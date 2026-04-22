from flask import Flask, render_template, request, redirect, url_for
from datetime import datetime
from models import db, User, Event, Invitation

app = Flask(__name__)

# Database config
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

# Initialize DB
with app.app_context():
    db.create_all()

    # Create sample user (only once)
    if not User.query.first():
        sample_user = User(username="gargi", email="gargi@example.com")
        db.session.add(sample_user)
        db.session.commit()


# ---------------- ROUTES ---------------- #

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
    events = Event.query.order_by(Event.event_date.desc()).all()
    return render_template("discover.html", events=events)


@app.route("/event-details/<int:event_id>")
def event_details(event_id):
    event = Event.query.get_or_404(event_id)
    return render_template("event_details.html", event=event)


@app.route("/invitations/<int:event_id>")
def invitations(event_id):
    event = Event.query.get_or_404(event_id)
    invitations = Invitation.query.filter_by(event_id=event_id).all()
    return render_template("invitation_page.html", event=event, invitations=invitations)


@app.route("/profile")
def profile():
    user = User.query.first()
    return render_template("profile.html", user=user)


# ---------------- CREATE EVENT ---------------- #

@app.route("/create-event", methods=["GET", "POST"])
def create_event():
    if request.method == "POST":
        try:
            title = request.form["title"]
            description = request.form.get("description")
            location = request.form.get("location")
            event_date = request.form["event_date"]

            user = User.query.first()

            new_event = Event(
                title=title,
                description=description,
                location=location,
                event_date=datetime.strptime(event_date, "%Y-%m-%dT%H:%M"),
                user_id=user.id
            )

            db.session.add(new_event)
            db.session.commit()

            return redirect(url_for("dashboard"))

        except Exception as e:
            return f"Error creating event: {e}"

    return render_template("create_event.html")


# ---------------- CREATE INVITATION ---------------- #

@app.route("/create-invitation/<int:event_id>", methods=["GET", "POST"])
def create_invitation(event_id):
    event = Event.query.get_or_404(event_id)

    if request.method == "POST":
        try:
            guest_name = request.form["guest_name"]
            guest_email = request.form["guest_email"]

            new_invitation = Invitation(
                guest_name=guest_name,
                guest_email=guest_email,
                event_id=event.id
            )

            db.session.add(new_invitation)
            db.session.commit()

            return redirect(url_for("invitations", event_id=event.id))

        except Exception as e:
            return f"Error creating invitation: {e}"

    return render_template("create_invitation.html", event=event)


# ---------------- RUN ---------------- #

if __name__ == "__main__":
    app.run(debug=True)