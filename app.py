from flask import Flask
from flask_login import LoginManager
from models import db, User
from routes.auth import auth
from routes.dashboard import dashboard
from routes.events import events
from routes.discover import discover
from routes.invitations import invitations
from routes.profile import profile

app = Flask(__name__)
app.secret_key = "your-secret-key-change-this"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "auth.login"

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Register blueprints
app.register_blueprint(auth)
app.register_blueprint(dashboard)
app.register_blueprint(events)
app.register_blueprint(discover)
app.register_blueprint(invitations)
app.register_blueprint(profile)

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True)