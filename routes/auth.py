from flask import Blueprint, render_template, request, redirect, url_for
from flask_login import login_user, logout_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User

auth = Blueprint("auth", __name__)

@auth.route("/")
@auth.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email    = request.form["email"]
        password = request.form["password"]
        user     = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for("dashboard.dashboard_page"))
        # Re-render with error and keep the email field filled
        return render_template("login_signup.html",
                               error="Incorrect email or password. Please try again.",
                               prefill_email=email)
    prefill_email = request.args.get("email", "")
    return render_template("login_signup.html", prefill_email=prefill_email)

@auth.route("/signup", methods=["POST"])
def signup():
    username = request.form["username"]
    email    = request.form["email"]
    password = request.form["password"]
    if User.query.filter_by(email=email).first():
        return redirect(url_for("auth.login"))
    hashed   = generate_password_hash(password)
    new_user = User(username=username, email=email, password_hash=hashed)
    db.session.add(new_user)
    db.session.commit()
    # Redirect back to login page with email pre-filled
    return redirect(url_for("auth.login") + f"?email={email}")
