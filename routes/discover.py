from flask import Blueprint, render_template
from flask_login import login_required
from models import Event

discover = Blueprint("discover", __name__)

@discover.route("/discover")
@login_required
def discover_page():
    events = Event.query.filter_by(is_public=True).all()
    return render_template("discover.html", events=events)