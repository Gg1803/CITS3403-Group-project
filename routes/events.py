from flask import Blueprint, render_template, request, redirect, url_for
from flask_login import login_required, current_user
from datetime import datetime
from models import db, Event

events = Blueprint("events", __name__)

@events.route("/event-details/<int:event_id>")
@login_required
def event_details(event_id):
    event = Event.query.get_or_404(event_id)
    return render_template("event_details.html", event=event)

@events.route("/create-event", methods=["POST"])
@login_required
def create_event():
    title      = request.form["title"]
    event_type = request.form["type"]
    date       = request.form["date"]
    location   = request.form["location"]
    desc       = request.form.get("description", "")
    is_public  = request.form.get("is_public") == "true"
    new_event  = Event(
        title       = title,
        event_type  = event_type,
        event_date  = datetime.strptime(date, "%Y-%m-%d"),
        location    = location,
        description = desc,
        is_public   = is_public,
        user_id     = current_user.id
    )
    db.session.add(new_event)
    db.session.commit()
    return redirect(url_for("dashboard.dashboard_page"))