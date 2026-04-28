from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from models import db, User, Event, Participant, Invitation, Task, Timeline, Poll, PollOption, Vote
from dotenv import load_dotenv
import os
load_dotenv()

app = Flask(__name__)

app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL",
    "sqlite:///database.db"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# AUTH 
@app.route("/")
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email    = request.form["email"]
        password = request.form["password"]
        user     = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for("dashboard"))
        return render_template("login_signup.html",
                               error="Incorrect email or password.",
                               prefill_email=email)
    prefill_email = request.args.get("email", "")
    return render_template("login_signup.html", prefill_email=prefill_email)

@app.route("/signup", methods=["POST"])
def signup():
    username = request.form["username"]
    email    = request.form["email"]
    password = request.form["password"]
    
    # Validation: email uniqueness
    if User.query.filter_by(email=email).first():
        return render_template("login_signup.html",
                               error="An account with this email already exists.",
                               prefill_email=email)
    
    # Validation: password strength
    if len(password) < 8:
        return render_template("login_signup.html",
                               error="Password must be at least 8 characters long.")
    if not any(c.isupper() for c in password):
        return render_template("login_signup.html",
                               error="Password must contain at least one uppercase letter.")
    
    new_user = User(username=username, email=email,
                    password_hash=generate_password_hash(password))
    db.session.add(new_user)
    db.session.commit()
    return redirect(url_for("login") + f"?email={email}")

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))

# PAGES 
@app.route("/dashboard")
@login_required
def dashboard():
    owned_events = Event.query.filter_by(user_id=current_user.id).all()
    joined_rows  = Participant.query.filter_by(user_id=current_user.id).all()
    joined_events = [row.event for row in joined_rows]
    return render_template("dashboard.html",
                           owned_events=owned_events,
                           joined_events=joined_events)

@app.route("/discover")
@login_required
def discover():
    # Get event IDs the user created or already joined
    joined_ids  = {p.event_id for p in Participant.query.filter_by(user_id=current_user.id).all()}
    owned_ids   = {e.id for e in Event.query.filter_by(user_id=current_user.id).all()}
    excluded    = joined_ids | owned_ids

    events = Event.query.filter(
        Event.is_public == True,
        ~Event.id.in_(excluded)
    ).all()
    return render_template("discover.html", events=events)

@app.route("/event-details/<int:event_id>")
@login_required
def event_details(event_id):
    event = Event.query.get_or_404(event_id)
    participants = Participant.query.filter_by(event_id=event_id).all()
    pending_invitations = Invitation.query.filter_by(
        event_id=event_id,
        status="pending"
    ).all()
    tasks = Task.query.filter_by(event_id=event_id).all()
    timelines = Timeline.query.filter_by(event_id=event_id).order_by(Timeline.order.asc()).all()
    polls = Poll.query.filter_by(event_id=event_id).all()

    return render_template(
        "event_details.html",
        event=event,
        participants=participants,
        pending_invitations=pending_invitations,
        tasks=tasks,
        timelines=timelines,
        polls=polls
    )

@app.route("/invitations")
@login_required
def invitations():
    invites = Invitation.query.filter_by(
        user_id=current_user.id,
        status="pending"
    ).all()
    return render_template("invitation_page.html", invitations=invites)

@app.route("/profile")
@login_required
def profile():
    return render_template("profile.html", user=current_user)

# AJAX - CREATE EVENT 
@app.route("/create-event", methods=["POST"])
@login_required
def create_event():
    data       = request.get_json()
    event_type = data.get("type")
    if event_type == "Custom":
        event_type = data.get("customType") or "Custom"
    new_event = Event(
        title       = data.get("title"),
        event_type  = event_type,
        event_date  = datetime.strptime(data.get("date"), "%Y-%m-%d"),
        location    = data.get("location"),
        description = data.get("description", ""),
        is_public   = data.get("is_public", False),
        user_id     = current_user.id
    )
    db.session.add(new_event)
    db.session.commit()
    # Return the new event data as JSON so JS can add the card without reload
    return jsonify({
        "id":          new_event.id,
        "title":       new_event.title,
        "event_type":  new_event.event_type,
        "event_date":  new_event.event_date.strftime("%d %b %Y"),
        "location":    new_event.location,
        "description": new_event.description,
        "is_public":   new_event.is_public,
        "participants": 0
    })

# AJAX - DELETE EVENT
@app.route("/event/<int:event_id>", methods=["DELETE"])
@login_required
def delete_event(event_id):
    event = Event.query.get_or_404(event_id)
    if event.user_id != current_user.id:
        return jsonify({"error": "Unauthorised"}), 403
    db.session.delete(event)
    db.session.commit()
    return jsonify({"success": True})

# AJAX - UPDATE EVENT
@app.route("/event/<int:event_id>", methods=["PATCH"])
@login_required
def update_event(event_id):
    event = Event.query.get_or_404(event_id)
    if event.user_id != current_user.id:
        return jsonify({"error": "Unauthorised"}), 403

    data = request.get_json()

    event.title      = data.get("title", event.title)
    event.event_type = data.get("event_type", event.event_type)
    event.location   = data.get("location", event.location)

    if data.get("date"):
        event.event_date = datetime.strptime(data["date"], "%Y-%m-%d")

    # NEW FIELDS
    event.description = data.get("description", event.description)
    event.is_public   = data.get("is_public", event.is_public)

    db.session.commit()
    return jsonify({"success": True})

# AJAX - TASKS
@app.route("/event/<int:event_id>/tasks", methods=["GET"])
@login_required
def get_tasks(event_id):
    tasks = Task.query.filter_by(event_id=event_id).all()
    return jsonify([{
        "id": t.id, "name": t.name,
        "assigned_to": t.assigned_to, "completed": t.completed
    } for t in tasks])

@app.route("/event/<int:event_id>/tasks", methods=["POST"])
@login_required
def add_task(event_id):
    data = request.get_json()
    task = Task(name=data["name"], assigned_to=data.get("assigned_to"),
                completed=False, event_id=event_id)
    db.session.add(task)
    db.session.commit()
    return jsonify({"id": task.id, "name": task.name,
                    "assigned_to": task.assigned_to, "completed": task.completed})

@app.route("/tasks/<int:task_id>/toggle", methods=["POST"])
@login_required
def toggle_task(task_id):
    task = Task.query.get_or_404(task_id)
    task.completed = not task.completed
    db.session.commit()
    return jsonify({"id": task.id, "completed": task.completed})

@app.route("/tasks/<int:task_id>", methods=["DELETE"])
@login_required
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({"success": True})

# AJAX - TIMELINE 
@app.route("/event/<int:event_id>/timeline", methods=["GET"])
@login_required
def get_timeline(event_id):
    steps = Timeline.query.filter_by(event_id=event_id).order_by(Timeline.order).all()
    return jsonify([{"id": s.id, "step": s.step, "order": s.order} for s in steps])

@app.route("/event/<int:event_id>/timeline", methods=["POST"])
@login_required
def add_timeline(event_id):
    data  = request.get_json()
    count = Timeline.query.filter_by(event_id=event_id).count()
    step  = Timeline(step=data["step"], order=count + 1, event_id=event_id)
    db.session.add(step)
    db.session.commit()
    return jsonify({"id": step.id, "step": step.step, "order": step.order})

@app.route("/timeline/<int:step_id>", methods=["DELETE"])
@login_required
def delete_timeline(step_id):
    step = Timeline.query.get_or_404(step_id)
    db.session.delete(step)
    db.session.commit()
    return jsonify({"success": True})

# AJAX - PARTICIPANTS
@app.route("/event/<int:event_id>/participants", methods=["GET"])
@login_required
def get_participants(event_id):
    rows = Participant.query.filter_by(event_id=event_id).all()
    return jsonify([{
        "id": r.id, "username": r.user.username
    } for r in rows])

# AJAX - INVITE USER
@app.route("/event/<int:event_id>/invite", methods=["POST"])
@login_required
def invite_user(event_id):
    data  = request.get_json()
    email = data.get("email")

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    existing_invite = Invitation.query.filter_by(
        user_id=user.id, event_id=event_id
    ).first()

    if existing_invite:
        if existing_invite.status == "pending":
            return jsonify({"error": "Already invited"}), 400
        # declined or previously accepted but left — reset to pending
        existing_invite.status = "pending"
        db.session.commit()
        return jsonify({
            "id": existing_invite.id,
            "username": user.username,
            "status": "pending"
        })

    # check already an active participant
    existing_participant = Participant.query.filter_by(
        user_id=user.id, event_id=event_id
    ).first()
    if existing_participant:
        return jsonify({"error": "Already a participant"}), 400

    invitation = Invitation(user_id=user.id, event_id=event_id, status="pending")
    db.session.add(invitation)
    db.session.commit()

    return jsonify({
        "id": invitation.id,
        "username": user.username,
        "status": invitation.status
    })

# AJAX - GET PENDING INVITATIONS FOR EVENT
@app.route("/event/<int:event_id>/pending-invitations", methods=["GET"])
@login_required
def get_pending_invitations(event_id):
    invitations = Invitation.query.filter_by(
        event_id=event_id,
        status="pending"
    ).all()
    return jsonify([{
        "id": inv.id,
        "username": inv.user.username,
        "status": inv.status
    } for inv in invitations])

# AJAX - GET INVITATIONS DATA (for the invitation page)
@app.route("/invitations/data")
@login_required
def get_invitations_data():
    invites = Invitation.query.filter_by(
        user_id=current_user.id
    ).all()
    
    result = []
    for inv in invites:
        event = inv.event
        result.append({
            "id": inv.id,
            "event_id": event.id,
            "event_title": event.title,
            "event_type": event.event_type,
            "event_date": event.event_date.strftime("%Y-%m-%d") if event.event_date else None,
            "location": event.location,
            "description": event.description,
            "status": inv.status  # "pending", "accepted", "declined"
        })
    
    return jsonify(result)

@app.route("/invitations/<int:invitation_id>/accept", methods=["POST"])
@login_required
def accept_invitation(invitation_id):
    invitation = Invitation.query.get_or_404(invitation_id)

    if invitation.user_id != current_user.id:
        return jsonify({"error": "Unauthorised"}), 403

    # update status
    invitation.status = "accepted"

    # create participant
    existing = Participant.query.filter_by(
        user_id=current_user.id,
        event_id=invitation.event_id
    ).first()

    if not existing:
        participant = Participant(
            user_id=current_user.id,
            event_id=invitation.event_id
        )
        db.session.add(participant)

    db.session.commit()

    return jsonify({"success": True})

@app.route("/invitations/<int:invitation_id>/decline", methods=["POST"])
@login_required
def decline_invitation(invitation_id):
    invitation = Invitation.query.get_or_404(invitation_id)

    if invitation.user_id != current_user.id:
        return jsonify({"error": "Unauthorised"}), 403

    invitation.status = "declined"
    db.session.commit()

    return jsonify({"success": True})

@app.route("/invitations/<int:invitation_id>/cancel", methods=["DELETE"])
@login_required
def cancel_invitation(invitation_id):
    invitation = Invitation.query.get_or_404(invitation_id)

    # allow ONLY event creator to cancel
    event = Event.query.get(invitation.event_id)
    if event.user_id != current_user.id:
        return jsonify({"error": "Unauthorised"}), 403

    db.session.delete(invitation)
    db.session.commit()

    return jsonify({"success": True})

@app.route("/participants/<int:participant_id>", methods=["DELETE"])
@login_required
def remove_participant(participant_id):
    p = Participant.query.get_or_404(participant_id)
    db.session.delete(p)
    db.session.commit()
    return jsonify({"success": True})

# AJAX - POLLS 
@app.route("/event/<int:event_id>/polls", methods=["GET"])
@login_required
def get_polls(event_id):
    polls = Poll.query.filter_by(event_id=event_id).all()
    return jsonify([{
        "id": p.id,
        "question": p.question,
        "options": [{
            "id": o.id,
            "text": o.text,
            "votes": len(o.votes)
        } for o in p.options]
    } for p in polls])

@app.route("/event/<int:event_id>/polls", methods=["POST"])
@login_required
def create_poll(event_id):
    data    = request.get_json()
    poll    = Poll(question=data["question"], event_id=event_id)
    db.session.add(poll)
    db.session.flush()   # get poll.id before committing
    for opt_text in data.get("options", []):
        db.session.add(PollOption(text=opt_text, poll_id=poll.id))
    db.session.commit()
    return jsonify({
        "id": poll.id,
        "question": poll.question,
        "options": [{"id": o.id, "text": o.text, "votes": 0}
                    for o in poll.options]
    })

@app.route("/polls/<int:poll_id>/vote/<int:option_id>", methods=["POST"])
@login_required
def vote(poll_id, option_id):
    existing = Vote.query.filter_by(
        user_id=current_user.id, option_id=option_id).first()
    if existing:
        return jsonify({"error": "Already voted"}), 400
    v = Vote(user_id=current_user.id, option_id=option_id)
    db.session.add(v)
    db.session.commit()
    option = PollOption.query.get(option_id)
    return jsonify({"option_id": option_id, "votes": len(option.votes)})

# AJAX - JOIN EVENT (discover page)
@app.route("/event/<int:event_id>/join", methods=["POST"])
@login_required
def join_event(event_id):
    event = Event.query.get_or_404(event_id)
    existing = Participant.query.filter_by(
        user_id=current_user.id, event_id=event_id).first()
    if existing:
        return jsonify({"error": "Already joined"}), 400
    p = Participant(user_id=current_user.id, event_id=event_id)
    db.session.add(p)
    db.session.commit()
    participant_count = Participant.query.filter_by(event_id=event_id).count()
    return jsonify({"success": True, "participants": participant_count})

# AJAX - LEAVE EVENT
@app.route("/event/<int:event_id>/leave", methods=["DELETE"])
@login_required
def leave_event(event_id):
    p = Participant.query.filter_by(
        user_id=current_user.id, event_id=event_id).first_or_404()
    db.session.delete(p)

    # Reset invitation back to pending so user can re-accept
    invitation = Invitation.query.filter_by(
        user_id=current_user.id, event_id=event_id
    ).first()
    if invitation:
        invitation.status = "pending"

    db.session.commit()
    return jsonify({"success": True})

# AJAX - PROFILE UPDATE
@app.route("/profile/update", methods=["POST"])
@login_required
def update_profile():
    data = request.get_json()
    new_email = data.get("email", "").strip().lower()
    new_username = data.get("username", "").strip()
    
    # Validation: email uniqueness (exclude current user)
    if new_email and new_email != current_user.email:
        existing = User.query.filter_by(email=new_email).first()
        if existing:
            return jsonify({"error": "This email is already taken by another account."}), 400
    
    if new_username:
        current_user.username = new_username
    if new_email:
        current_user.email = new_email
    
    db.session.commit()
    return jsonify({
        "success": True,
        "username": current_user.username,
        "email": current_user.email
    })

@app.route("/profile/password", methods=["POST"])
@login_required
def update_password():
    data = request.get_json()
    current_password = data.get("current", "")
    new_password = data.get("new", "")
    
    # Verify current password
    if not check_password_hash(current_user.password_hash, current_password):
        return jsonify({"error": "Current password is incorrect."}), 400
    
    # Validation: new password strength
    if len(new_password) < 8:
        return jsonify({"error": "New password must be at least 8 characters long."}), 400
    if not any(c.isupper() for c in new_password):
        return jsonify({"error": "New password must contain at least one uppercase letter."}), 400
    
    current_user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    return jsonify({"success": True})

if __name__ == "__main__":
    app.run(debug=True)