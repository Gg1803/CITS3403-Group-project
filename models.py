from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<User {self.username}>"


class Event(db.Model):
    __tablename__ = "event"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(200), nullable=True)
    event_date = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    user = db.relationship(
        "User",
        backref=db.backref("events", lazy=True, cascade="all, delete-orphan")
    )

    def __repr__(self):
        return f"<Event {self.title}>"


class Invitation(db.Model):
    __tablename__ = "invitation"

    id = db.Column(db.Integer, primary_key=True)
    guest_name = db.Column(db.String(100), nullable=False)
    guest_email = db.Column(db.String(120), nullable=False)
    status = db.Column(db.String(20), default="pending")
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)

    event_id = db.Column(db.Integer, db.ForeignKey("event.id"), nullable=False)

    event = db.relationship(
        "Event",
        backref=db.backref("invitations", lazy=True, cascade="all, delete-orphan")
    )

    def __repr__(self):
        return f"<Invitation {self.guest_email} for Event {self.event_id}>"