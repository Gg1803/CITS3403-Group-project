from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_migrate import Migrate
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from models import (
    db,
    ROLE_CO_HOST,
    ROLE_HOST,
    ROLE_PARTICIPANT,
    User,
    Event,
    Participant,
    Invitation,
    Task,
    Timeline,
    Poll,
    PollOption,
    Vote
)
from dotenv import load_dotenv
import os
import mailtrap as mt
from flask_wtf import CSRFProtect

# Load environment variables from .env before creating app config
load_dotenv()

app = Flask(__name__)

csrf = CSRFProtect(app)

# App configuration
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key")

app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL",
    "sqlite:///database.db"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Email configuration
app.config["MAIL_SERVER"] = os.environ.get("MAIL_SERVER")
app.config["MAIL_PORT"] = int(os.environ.get("MAIL_PORT", 587))
app.config["MAIL_USERNAME"] = os.environ.get("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.environ.get("MAIL_PASSWORD")
app.config["MAIL_DEFAULT_SENDER"] = os.environ.get(
    "MAIL_DEFAULT_SENDER",
    app.config["MAIL_USERNAME"]
)

db.init_app(app)
migrate = Migrate(app, db)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


def permission_denied(message="Permission denied"):
    return jsonify({"error": message}), 403


def get_event_role(event, user_id=None):
    user_id = user_id or current_user.id

    if event.user_id == user_id:
        return ROLE_HOST

    participant = Participant.query.filter_by(
        event_id=event.id,
        user_id=user_id
    ).first()

    return participant.role if participant else None


def get_event_participant(event, user_id=None):
    user_id = user_id or current_user.id

    return Participant.query.filter_by(
        event_id=event.id,
        user_id=user_id
    ).first()


def can_edit_event(event, user_id=None):
    role = get_event_role(event, user_id)

    if not role:
        return False

    if not event.is_public:
        return True

    return role in (ROLE_HOST, ROLE_CO_HOST)


def can_manage_participants(event, user_id=None):
    return get_event_role(event, user_id) in (ROLE_HOST, ROLE_CO_HOST)


def can_assign_roles(event, user_id=None):
    return get_event_role(event, user_id) == ROLE_HOST


def can_vote_in_event(event, user_id=None):
    return get_event_role(event, user_id) is not None


def event_permissions(event):
    role = get_event_role(event)

    return {
        "current_role": role,
        "can_edit": can_edit_event(event),
        "can_manage_participants": can_manage_participants(event),
        "can_assign_roles": can_assign_roles(event),
        "can_vote": can_vote_in_event(event)
    }


def serialize_participant(participant):
    return {
        "id": participant.id,
        "username": participant.user.username,
        "role": participant.role
    }


# AUTH
@app.route("/")
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]

        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for("dashboard"))

        return render_template(
            "login_signup.html",
            error="Incorrect email or password.",
            prefill_email=email
        )

    prefill_email = request.args.get("email", "")
    return render_template("login_signup.html", prefill_email=prefill_email)


@app.route("/signup", methods=["POST"])
def signup():
    username = request.form["username"]
    email = request.form["email"]
    password = request.form["password"]

    # Validation: email uniqueness
    if User.query.filter_by(email=email).first():
        return render_template(
            "login_signup.html",
            error="An account with this email already exists.",
            prefill_email=email
        )

    # Validation: password strength
    if len(password) < 8:
        return render_template(
            "login_signup.html",
            error="Password must be at least 8 characters long."
        )

    if not any(c.isupper() for c in password):
        return render_template(
            "login_signup.html",
            error="Password must contain at least one uppercase letter."
        )

    new_user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password, method="pbkdf2:sha256")
    )

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
    joined_rows = Participant.query.filter_by(user_id=current_user.id).all()
    joined_events = [row.event for row in joined_rows]

    return render_template(
        "dashboard.html",
        owned_events=owned_events,
        joined_events=joined_events
    )


@app.route("/discover")
@login_required
def discover():
    # Get event IDs the user created or already joined
    joined_ids = {
        p.event_id for p in Participant.query.filter_by(user_id=current_user.id).all()
    }
    owned_ids = {
        e.id for e in Event.query.filter_by(user_id=current_user.id).all()
    }
    excluded = joined_ids | owned_ids

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
    invitations = Invitation.query.filter_by(event_id=event_id).all()
    tasks = Task.query.filter_by(event_id=event_id).all()
    timelines = Timeline.query.filter_by(event_id=event_id).order_by(
        Timeline.order.asc()
    ).all()
    polls = Poll.query.filter_by(event_id=event_id).all()

    return render_template(
        "event_details.html",
        event=event,
        participants=participants,
        invitations=invitations,
        tasks=tasks,
        timelines=timelines,
        polls=polls,
        **event_permissions(event)
    )


@app.route("/invitations")
@login_required
def invitations():
    invites = Invitation.query.filter_by(user_id=current_user.id).all()
    return render_template("invitation_page.html", invitations=invites)


@app.route("/profile")
@login_required
def profile():
    return render_template("profile.html", user=current_user)


def serialize_invitation(invitation):
    event = invitation.event
    status = "joined" if invitation.status in ("accepted", "joined") else invitation.status
    participant_count = Participant.query.filter_by(event_id=event.id).count()

    return {
        "id": invitation.id,
        "event_id": event.id,
        "type": event.event_type,
        "name": event.title,
        "description": event.description or "",
        "date": event.event_date.strftime("%Y-%m-%d"),
        "location": event.location or "",
        "participants": participant_count,
        "status": status
    }


# AJAX - INVITATIONS
@app.route("/api/invitations", methods=["GET"])
@login_required
def get_invitations():
    invites = Invitation.query.filter_by(user_id=current_user.id).all()
    return jsonify([serialize_invitation(invite) for invite in invites])


@csrf.exempt
@app.route("/api/invitations/<int:invitation_id>/accept", methods=["POST"])
@login_required
def accept_invitation(invitation_id):
    invitation = Invitation.query.get_or_404(invitation_id)

    if invitation.user_id != current_user.id:
        return jsonify({"error": "Unauthorised"}), 403

    invitation.status = "joined"

    existing = Participant.query.filter_by(
        user_id=current_user.id,
        event_id=invitation.event_id
    ).first()

    if not existing:
        db.session.add(
            Participant(
                user_id=current_user.id,
                event_id=invitation.event_id,
                role=ROLE_PARTICIPANT
            )
        )

    db.session.commit()
    return jsonify(serialize_invitation(invitation))


@csrf.exempt
@app.route("/api/invitations/<int:invitation_id>/decline", methods=["POST"])
@login_required
def decline_invitation(invitation_id):
    invitation = Invitation.query.get_or_404(invitation_id)

    if invitation.user_id != current_user.id:
        return jsonify({"error": "Unauthorised"}), 403

    invitation.status = "declined"
    db.session.commit()

    return jsonify(serialize_invitation(invitation))


@csrf.exempt
@app.route("/event/<int:event_id>/invitations", methods=["POST"])
@app.route("/event/<int:event_id>/participants", methods=["POST"])
@login_required
def send_invitation(event_id):
    event = Event.query.get_or_404(event_id)

    if not can_manage_participants(event):
        return permission_denied("Only hosts or co-hosts can invite participants")

    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.id == current_user.id:
        return jsonify({"error": "You cannot invite yourself"}), 400

    existing_participant = Participant.query.filter_by(
        user_id=user.id,
        event_id=event_id
    ).first()

    if existing_participant:
        return jsonify({"error": "User is already a participant"}), 400

    existing_invitation = Invitation.query.filter_by(
        user_id=user.id,
        event_id=event_id
    ).first()

    if existing_invitation:
        if existing_invitation.status == "pending":
            return jsonify({"error": "Invitation already pending"}), 400

        if existing_invitation.status in ("accepted", "joined"):
            return jsonify({"error": "Invitation has already been accepted"}), 400

        existing_invitation.status = "pending"
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Invitation sent",
            "invitation": serialize_invitation(existing_invitation)
        })

    invitation = Invitation(user_id=user.id, event_id=event_id, status="pending")
    db.session.add(invitation)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Invitation sent",
        "invitation": serialize_invitation(invitation)
    })


# AJAX - CREATE EVENT
@csrf.exempt
@app.route("/create-event", methods=["POST"])
@login_required
def create_event():
    data = request.get_json(silent=True) or {}

    event_type = data.get("type")

    if event_type == "Custom":
        event_type = data.get("customType") or "Custom"

    new_event = Event(
        title=data.get("title"),
        event_type=event_type,
        event_date=datetime.strptime(data.get("date"), "%Y-%m-%d"),
        location=data.get("location"),
        description=data.get("description", ""),
        is_public=data.get("is_public", False),
        user_id=current_user.id
    )

    db.session.add(new_event)
    db.session.flush()
    db.session.add(
        Participant(
            user_id=current_user.id,
            event_id=new_event.id,
            role=ROLE_HOST
        )
    )
    db.session.commit()

    # Return the new event data as JSON so JS can add the card without reload
    return jsonify({
        "id": new_event.id,
        "title": new_event.title,
        "event_type": new_event.event_type,
        "event_date": new_event.event_date.strftime("%d %b %Y"),
        "location": new_event.location,
        "description": new_event.description,
        "is_public": new_event.is_public,
        "participants": 1
    })


# AJAX - DELETE EVENT
@csrf.exempt
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
@csrf.exempt
@app.route("/event/<int:event_id>", methods=["PATCH"])
@login_required
def update_event(event_id):
    event = Event.query.get_or_404(event_id)

    if not can_edit_event(event):
        return permission_denied()

    data = request.get_json(silent=True) or {}

    event.title = data.get("title", event.title)
    event.event_type = data.get("event_type", event.event_type)
    event.location = data.get("location", event.location)

    if data.get("date"):
        event.event_date = datetime.strptime(data["date"], "%Y-%m-%d")

    event.description = data.get("description", event.description)
    event.is_public = data.get("is_public", event.is_public)

    db.session.commit()

    return jsonify({"success": True})


# AJAX - TASKS
@app.route("/event/<int:event_id>/tasks", methods=["GET"])
@login_required
def get_tasks(event_id):
    tasks = Task.query.filter_by(event_id=event_id).all()

    return jsonify([{
        "id": task.id,
        "name": task.name,
        "assigned_to": task.assigned_to,
        "completed": task.completed
    } for task in tasks])


@csrf.exempt
@app.route("/event/<int:event_id>/tasks", methods=["POST"])
@login_required
def add_task(event_id):
    event = Event.query.get_or_404(event_id)

    if not can_edit_event(event):
        return permission_denied()

    data = request.get_json(silent=True) or {}

    task = Task(
        name=data["name"],
        assigned_to=data.get("assigned_to"),
        completed=False,
        event_id=event_id
    )

    db.session.add(task)
    db.session.commit()

    return jsonify({
        "id": task.id,
        "name": task.name,
        "assigned_to": task.assigned_to,
        "completed": task.completed
    })


@csrf.exempt
@app.route("/tasks/<int:task_id>/toggle", methods=["POST"])
@login_required
def toggle_task(task_id):
    task = Task.query.get_or_404(task_id)

    if not can_edit_event(task.event):
        return permission_denied()

    task.completed = not task.completed

    db.session.commit()

    return jsonify({
        "id": task.id,
        "completed": task.completed
    })


@csrf.exempt
@app.route("/tasks/<int:task_id>", methods=["DELETE"])
@login_required
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)

    if not can_edit_event(task.event):
        return permission_denied()

    db.session.delete(task)
    db.session.commit()

    return jsonify({"success": True})


# AJAX - TIMELINE
@app.route("/event/<int:event_id>/timeline", methods=["GET"])
@login_required
def get_timeline(event_id):
    steps = Timeline.query.filter_by(event_id=event_id).order_by(Timeline.order).all()

    return jsonify([{
        "id": step.id,
        "step": step.step,
        "order": step.order
    } for step in steps])


@csrf.exempt
@app.route("/event/<int:event_id>/timeline", methods=["POST"])
@login_required
def add_timeline(event_id):
    event = Event.query.get_or_404(event_id)

    if not can_edit_event(event):
        return permission_denied()

    data = request.get_json(silent=True) or {}
    count = Timeline.query.filter_by(event_id=event_id).count()

    step = Timeline(
        step=data["step"],
        order=count + 1,
        event_id=event_id
    )

    db.session.add(step)
    db.session.commit()

    return jsonify({
        "id": step.id,
        "step": step.step,
        "order": step.order
    })


@csrf.exempt
@app.route("/timeline/<int:step_id>", methods=["DELETE"])
@login_required
def delete_timeline(step_id):
    step = Timeline.query.get_or_404(step_id)

    if not can_edit_event(step.event):
        return permission_denied()

    db.session.delete(step)
    db.session.commit()

    return jsonify({"success": True})


# AJAX - PARTICIPANTS
@app.route("/event/<int:event_id>/participants", methods=["GET"])
@login_required
def get_participants(event_id):
    rows = Participant.query.filter_by(event_id=event_id).all()

    return jsonify([serialize_participant(row) for row in rows])


@csrf.exempt
@app.route("/participants/<int:participant_id>", methods=["DELETE"])
@login_required
def remove_participant(participant_id):
    participant = Participant.query.get_or_404(participant_id)
    event = participant.event

    if not can_manage_participants(event):
        return permission_denied()

    if participant.role == ROLE_HOST or participant.user_id == event.user_id:
        return jsonify({"error": "The host cannot be removed"}), 400

    current_role = get_event_role(event)

    if current_role == ROLE_CO_HOST and participant.role == ROLE_CO_HOST:
        return permission_denied("Only the host can remove a co-host")

    db.session.delete(participant)
    db.session.commit()

    return jsonify({"success": True})


@app.route("/participants/<int:participant_id>/role", methods=["PATCH"])
@login_required
def update_participant_role(participant_id):
    participant = Participant.query.get_or_404(participant_id)
    event = participant.event

    if not can_assign_roles(event):
        return permission_denied("Only the host can manage roles")

    if participant.role == ROLE_HOST or participant.user_id == event.user_id:
        return jsonify({"error": "The host role cannot be changed"}), 400

    data = request.get_json(silent=True) or {}
    new_role = data.get("role")

    if new_role not in (ROLE_CO_HOST, ROLE_PARTICIPANT):
        return jsonify({"error": "Invalid role"}), 400

    participant.role = new_role
    db.session.commit()

    return jsonify(serialize_participant(participant))


# AJAX - POLLS
@app.route("/event/<int:event_id>/polls", methods=["GET"])
@login_required
def get_polls(event_id):
    polls = Poll.query.filter_by(event_id=event_id).all()

    return jsonify([{
        "id": poll.id,
        "question": poll.question,
        "options": [{
            "id": option.id,
            "text": option.text,
            "votes": len(option.votes)
        } for option in poll.options]
    } for poll in polls])


@csrf.exempt
@app.route("/event/<int:event_id>/polls", methods=["POST"])
@login_required
def create_poll(event_id):
    event = Event.query.get_or_404(event_id)

    if not can_edit_event(event):
        return permission_denied()

    data = request.get_json(silent=True) or {}

    poll = Poll(question=data["question"], event_id=event_id)
    db.session.add(poll)
    db.session.flush()

    for option_text in data.get("options", []):
        db.session.add(PollOption(text=option_text, poll_id=poll.id))

    db.session.commit()

    return jsonify({
        "id": poll.id,
        "question": poll.question,
        "options": [{
            "id": option.id,
            "text": option.text,
            "votes": 0
        } for option in poll.options]
    })


@csrf.exempt
@app.route("/polls/<int:poll_id>/vote/<int:option_id>", methods=["POST"])
@login_required
def vote(poll_id, option_id):
    option = PollOption.query.get_or_404(option_id)

    if option.poll_id != poll_id:
        return jsonify({"error": "Invalid poll option"}), 400

    if not can_vote_in_event(option.poll.event):
        return permission_denied("Only participants can vote")

    existing = Vote.query.filter_by(
        user_id=current_user.id,
        option_id=option_id
    ).first()

    if existing:
        return jsonify({"error": "Already voted"}), 400

    vote_record = Vote(user_id=current_user.id, option_id=option_id)

    db.session.add(vote_record)
    db.session.commit()

    return jsonify({
        "option_id": option_id,
        "votes": len(option.votes)
    })


# AJAX - GET VOTERS FOR POLL OPTIONS
@app.route("/poll-option/<int:option_id>/voters", methods=["GET"])
@login_required
def get_voters(option_id):
    votes = Vote.query.filter_by(option_id=option_id).all()

    return jsonify([{
        "username": vote_record.user.username
    } for vote_record in votes])


# AJAX - JOIN EVENT (discover page)
@csrf.exempt
@app.route("/event/<int:event_id>/join", methods=["POST"])
@login_required
def join_event(event_id):
    event = Event.query.get_or_404(event_id)

    if not event.is_public:
        return permission_denied("Private events require an invitation")

    existing = Participant.query.filter_by(
        user_id=current_user.id,
        event_id=event_id
    ).first()

    if existing:
        return jsonify({"error": "Already joined"}), 400

    participant = Participant(
        user_id=current_user.id,
        event_id=event_id,
        role=ROLE_PARTICIPANT
    )

    db.session.add(participant)
    db.session.commit()

    participant_count = Participant.query.filter_by(event_id=event_id).count()

    return jsonify({
        "success": True,
        "participants": participant_count
    })


# AJAX - LEAVE EVENT (discover page)
@csrf.exempt
@app.route("/event/<int:event_id>/leave", methods=["DELETE"])
@login_required
def leave_event(event_id):
    participant = Participant.query.filter_by(
        user_id=current_user.id,
        event_id=event_id
    ).first_or_404()

    if participant.role == ROLE_HOST or participant.event.user_id == current_user.id:
        return jsonify({"error": "The host cannot leave their own event"}), 400

    db.session.delete(participant)
    db.session.commit()

    return jsonify({"success": True})


# AJAX - PROFILE UPDATE
@csrf.exempt
@app.route("/profile/update", methods=["POST"])
@login_required
def update_profile():
    data = request.get_json(silent=True) or {}

    new_email = data.get("email", "").strip().lower()
    new_username = data.get("username", "").strip()

    # Validation: email uniqueness, excluding current user
    if new_email and new_email != current_user.email:
        existing = User.query.filter_by(email=new_email).first()

        if existing:
            return jsonify({
                "error": "This email is already used by another account."
            }), 400

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

def send_password_change_email(user):
    try:
        token = os.environ.get("MAILTRAP_API_TOKEN")

        if not token:
            app.logger.error("MAILTRAP_API_TOKEN is missing from environment variables.")
            return False

        mail = mt.Mail(
            sender=mt.Address(email="hello@demomailtrap.co", name="Eventure"),
            to=[mt.Address(email=user.email)],
            subject="Password Changed",
            text=f"""
Hi {user.username},

Your password has been successfully updated.

Account: {user.email}
Time: {datetime.now().strftime("%d %B %Y %I:%M %p")}

If this was not you, please secure your account immediately.

Regards,
Eventure Team
"""
        )

        client = mt.MailtrapClient(token=token)
        client.send(mail)

        return True

    except Exception as e:
        print("MAIL ERROR:", e)
        return False
    
# AJAX - PASSWORD UPDATE
@csrf.exempt
@app.route("/profile/password", methods=["POST"])
@login_required
def update_password():
    data = request.get_json(silent=True) or {}

    current_password = data.get("current", "").strip()
    new_password = data.get("new", "").strip()

    if not current_password or not new_password:
        return jsonify({
            "error": "Please fill in both password fields."
        }), 400

    if not check_password_hash(current_user.password_hash, current_password):
        return jsonify({
            "error": "Current password is incorrect."
        }), 400

    if len(new_password) < 8:
        return jsonify({
            "error": "New password must be at least 8 characters long."
        }), 400

    if not any(char.isupper() for char in new_password):
        return jsonify({
            "error": "New password must contain at least one uppercase letter."
        }), 400

    current_user.password_hash = generate_password_hash(
        new_password,
        method="pbkdf2:sha256"
    )
    db.session.commit()

    email_sent = send_password_change_email(current_user)

    if email_sent:
        message = "Password updated successfully. A confirmation email has been sent."
    else:
        message = "Password updated successfully. Email notification could not be sent right now."

    return jsonify({
        "success": True,
        "message": message
    }), 200


if __name__ == "__main__":
    app.run(debug=True)
