from flask import Flask, render_template, request, redirect, url_for
from datetime import datetime
from models import db, User, Event, Participant, Invitation, Task, Timeline, Poll, PollOption, Vote

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

with app.app_context():
    db.create_all()


@app.route("/")
@app.route("/login")
def login():
    return render_template("login_signup.html")


@app.route("/dashboard")
def dashboard():
    events = Event.query.order_by(Event.event_date.desc()).all()
    return render_template("dashboard.html", events=events)


@app.route("/discover")
def discover():
    events = Event.query.filter_by(is_public=True).order_by(Event.event_date.desc()).all()
    return render_template("discover.html", events=events)


@app.route("/event-details/<int:event_id>")
def event_details(event_id):
    event = Event.query.get_or_404(event_id)
    participants = Participant.query.filter_by(event_id=event_id).all()
    invitations = Invitation.query.filter_by(event_id=event_id).all()
    tasks = Task.query.filter_by(event_id=event_id).all()
    timelines = Timeline.query.filter_by(event_id=event_id).order_by(Timeline.order.asc()).all()
    polls = Poll.query.filter_by(event_id=event_id).all()

    return render_template(
        "event_details.html",
        event=event,
        participants=participants,
        invitations=invitations,
        tasks=tasks,
        timelines=timelines,
        polls=polls
    )


@app.route("/invitations/<int:event_id>")
def invitations(event_id):
    event = Event.query.get_or_404(event_id)
    invitations = Invitation.query.filter_by(event_id=event_id).all()
    return render_template("invitation_page.html", event=event, invitations=invitations)


@app.route("/profile")
def profile():
    user = User.query.first()
    return render_template("profile.html", user=user)


@app.route("/create-event", methods=["GET", "POST"])
def create_event():
    if request.method == "POST":
        try:
            title = request.form["title"]
            description = request.form.get("description")
            location = request.form.get("location")
            event_date = request.form["event_date"]
            event_type = request.form.get("event_type")
            is_public = request.form.get("is_public") == "on"

            user = User.query.first()
            if not user:
                return "No user found. Please run seed.py first."

            new_event = Event(
                title=title,
                description=description,
                location=location,
                event_date=datetime.strptime(event_date, "%Y-%m-%dT%H:%M"),
                event_type=event_type,
                is_public=is_public,
                user_id=user.id
            )

            db.session.add(new_event)
            db.session.commit()
            return redirect(url_for("dashboard"))

        except Exception as e:
            return f"Error creating event: {e}"

    return render_template("create_event.html")


@app.route("/create-invitation/<int:event_id>", methods=["GET", "POST"])
def create_invitation(event_id):
    event = Event.query.get_or_404(event_id)

    if request.method == "POST":
        try:
            guest_email = request.form.get("guest_email", "").strip()
            guest_name = request.form.get("guest_name", "").strip()
            status = request.form.get("status", "pending").strip().lower()

            if status not in ["pending", "accepted", "declined"]:
                status = "pending"

            invited_user = None

            if guest_email:
                invited_user = User.query.filter_by(email=guest_email).first()

            if not invited_user and guest_name:
                invited_user = User.query.filter_by(username=guest_name).first()

            if not invited_user:
                return "Invited user not found in database."

            existing = Invitation.query.filter_by(user_id=invited_user.id, event_id=event.id).first()
            if existing:
                return redirect(url_for("invitations", event_id=event.id))

            new_invitation = Invitation(
                user_id=invited_user.id,
                event_id=event.id,
                status=status
            )

            db.session.add(new_invitation)
            db.session.commit()
            return redirect(url_for("invitations", event_id=event.id))

        except Exception as e:
            return f"Error creating invitation: {e}"

    users = User.query.order_by(User.username.asc()).all()
    return render_template("create_invitation.html", event=event, users=users)


@app.route("/join-event/<int:event_id>", methods=["POST"])
def join_event(event_id):
    event = Event.query.get_or_404(event_id)
    user = User.query.first()

    if not user:
        return "No user found. Please run seed.py first."

    existing_participant = Participant.query.filter_by(user_id=user.id, event_id=event.id).first()
    if existing_participant:
        return redirect(url_for("event_details", event_id=event.id))

    participant = Participant(user_id=user.id, event_id=event.id)
    db.session.add(participant)
    db.session.commit()

    return redirect(url_for("event_details", event_id=event.id))


@app.route("/add-task/<int:event_id>", methods=["POST"])
def add_task(event_id):
    event = Event.query.get_or_404(event_id)

    try:
        name = request.form["name"]
        assigned_to = request.form.get("assigned_to")
        completed = request.form.get("completed") == "on"

        assigned_user_id = None
        if assigned_to:
            user = User.query.filter_by(email=assigned_to).first()
            if not user:
                user = User.query.filter_by(username=assigned_to).first()
            if user:
                assigned_user_id = user.id

        task = Task(
            name=name,
            assigned_to=assigned_user_id,
            completed=completed,
            event_id=event.id
        )

        db.session.add(task)
        db.session.commit()
        return redirect(url_for("event_details", event_id=event.id))

    except Exception as e:
        return f"Error adding task: {e}"


@app.route("/add-timeline/<int:event_id>", methods=["POST"])
def add_timeline(event_id):
    event = Event.query.get_or_404(event_id)

    try:
        step = request.form["step"]
        order = request.form.get("order")

        timeline = Timeline(
            step=step,
            order=int(order) if order else None,
            event_id=event.id
        )

        db.session.add(timeline)
        db.session.commit()
        return redirect(url_for("event_details", event_id=event.id))

    except Exception as e:
        return f"Error adding timeline step: {e}"


@app.route("/add-poll/<int:event_id>", methods=["POST"])
def add_poll(event_id):
    event = Event.query.get_or_404(event_id)

    try:
        question = request.form["question"]
        options_text = request.form.get("options", "")

        poll = Poll(question=question, event_id=event.id)
        db.session.add(poll)
        db.session.commit()

        options = options_text.split(",")
        for option in options:
            option = option.strip()
            if option:
                db.session.add(PollOption(text=option, poll_id=poll.id))

        db.session.commit()
        return redirect(url_for("event_details", event_id=event.id))

    except Exception as e:
        return f"Error adding poll: {e}"


@app.route("/vote/<int:option_id>", methods=["POST"])
def vote(option_id):
    option = PollOption.query.get_or_404(option_id)
    user = User.query.first()

    if not user:
        return "No user found. Please run seed.py first."

    existing_vote = Vote.query.filter_by(user_id=user.id, option_id=option.id).first()
    if existing_vote:
        return redirect(url_for("event_details", event_id=option.poll.event_id))

    new_vote = Vote(user_id=user.id, option_id=option.id)
    db.session.add(new_vote)
    db.session.commit()

    return redirect(url_for("event_details", event_id=option.poll.event_id))


if __name__ == "__main__":
    app.run(debug=True)