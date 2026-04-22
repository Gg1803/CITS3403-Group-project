from flask import Blueprint, render_template
from flask_login import login_required, current_user
from models import Event, Participant

dashboard = Blueprint("dashboard", __name__)

@dashboard.route("/dashboard")
@login_required
def dashboard_page():
    owned = Event.query.filter_by(user_id=current_user.id).all()
    joined_rows = Participant.query.filter_by(user_id=current_user.id).all()
    joined = [row.event for row in joined_rows]
    events = owned + joined
    return render_template("dashboard.html", events=events)