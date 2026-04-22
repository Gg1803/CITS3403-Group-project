from flask import Blueprint, render_template
from flask_login import login_required, current_user
from models import Invitation

invitations = Blueprint("invitations", __name__)

@invitations.route("/invitations")
@login_required
def invitations_page():
    invites = Invitation.query.filter_by(user_id=current_user.id).all()
    return render_template("invitation_page.html", invitations=invites)