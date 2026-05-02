from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_login import UserMixin

db = SQLAlchemy()

ROLE_HOST = "host"
ROLE_CO_HOST = "co_host"
ROLE_PARTICIPANT = "participant"


class User(UserMixin, db.Model):
    __tablename__ = "user"
    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(80), unique=True, nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    events       = db.relationship("Event",       backref="host",    lazy=True, cascade="all, delete-orphan")
    participants = db.relationship("Participant",  backref="user",    lazy=True, cascade="all, delete-orphan")
    invitations  = db.relationship("Invitation",  backref="user",    lazy=True, cascade="all, delete-orphan")
    votes        = db.relationship("Vote",         backref="user",    lazy=True, cascade="all, delete-orphan")

class Event(db.Model):
    __tablename__ = "event"
    id          = db.Column(db.Integer, primary_key=True)
    title       = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    location    = db.Column(db.String(200))
    event_date  = db.Column(db.DateTime, nullable=False)
    event_type  = db.Column(db.String(50))
    is_public   = db.Column(db.Boolean, default=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    user_id     = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    # Relationships
    participants = db.relationship("Participant", backref="event", lazy=True, cascade="all, delete-orphan")
    invitations  = db.relationship("Invitation",  backref="event", lazy=True, cascade="all, delete-orphan")
    tasks        = db.relationship("Task",         backref="event", lazy=True, cascade="all, delete-orphan")
    timelines    = db.relationship("Timeline",     backref="event", lazy=True, cascade="all, delete-orphan")
    polls        = db.relationship("Poll",         backref="event", lazy=True, cascade="all, delete-orphan")

class Participant(db.Model):
    __tablename__ = "participant"
    id        = db.Column(db.Integer, primary_key=True)
    user_id   = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    event_id  = db.Column(db.Integer, db.ForeignKey("event.id"), nullable=False)
    role      = db.Column(db.String(20), nullable=False, default=ROLE_PARTICIPANT)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("user_id", "event_id", name="uq_participant_user_event"),
    )

class Invitation(db.Model):
    __tablename__ = "invitation"
    id       = db.Column(db.Integer, primary_key=True)
    user_id  = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey("event.id"), nullable=False)
    status   = db.Column(db.String(20), default="pending")

class Task(db.Model):
    __tablename__ = "task"
    id          = db.Column(db.Integer, primary_key=True)
    name        = db.Column(db.String(200), nullable=False)
    assigned_to = db.Column(db.Integer, db.ForeignKey("user.id"))
    completed   = db.Column(db.Boolean, default=False)
    event_id    = db.Column(db.Integer, db.ForeignKey("event.id"), nullable=False)

class Timeline(db.Model):
    __tablename__ = "timeline"
    id       = db.Column(db.Integer, primary_key=True)
    step     = db.Column(db.String(300), nullable=False)
    order    = db.Column(db.Integer)
    event_id = db.Column(db.Integer, db.ForeignKey("event.id"), nullable=False)

class Poll(db.Model):
    __tablename__ = "poll"
    id       = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.String(300), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey("event.id"), nullable=False)

    # Relationship
    options = db.relationship("PollOption", backref="poll", lazy=True, cascade="all, delete-orphan")

class PollOption(db.Model):
    __tablename__ = "poll_option"
    id      = db.Column(db.Integer, primary_key=True)
    text    = db.Column(db.String(200), nullable=False)
    poll_id = db.Column(db.Integer, db.ForeignKey("poll.id"), nullable=False)

    # Relationship
    votes = db.relationship("Vote", backref="option", lazy=True, cascade="all, delete-orphan")

class Vote(db.Model):
    __tablename__ = "vote"
    id        = db.Column(db.Integer, primary_key=True)
    user_id   = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    option_id = db.Column(db.Integer, db.ForeignKey("poll_option.id"), nullable=False)
    __table_args__ = (db.UniqueConstraint("user_id", "option_id"),)