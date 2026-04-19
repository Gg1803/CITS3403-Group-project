from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

# Database config
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy()
db.init_app(app)

with app.app_context():
    db.create_all()

# Routes: one per HTML page
@app.route("/")
@app.route("/login")
def login():
    return render_template("login_signup.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/event-details")
def event_details():
    return render_template("event_details.html")

@app.route("/invitations")
def invitations():
    return render_template("invitation_page.html")

@app.route("/discover")
def discover():
    return render_template("discover.html")

@app.route("/profile")
def profile():
    return render_template("profile.html")

# Run 
if __name__ == "__main__":
    app.run(debug=True)