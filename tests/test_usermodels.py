from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

from models import db, User, Event, Participant, Invitation, Task, Timeline, Poll, PollOption, Vote


def test_user_model_creation(client):
    user = User.query.filter_by(email="gargi@example.com").first()

    assert user is not None
    assert user.username == "gargi"
    assert user.email == "gargi@example.com"
    assert check_password_hash(user.password_hash, "password123")


def test_event_model_creation(client):
    user = User.query.filter_by(email="gargi@example.com").first()

    event = Event(
        title="Model Event",
        description="Testing model",
        location="UWA Library",
        event_date=datetime(2026, 8, 1),
        event_type="Study session",
        is_public=True,
        user_id=user.id
    )

    db.session.add(event)
    db.session.commit()

    saved_event = Event.query.filter_by(title="Model Event").first()

    assert saved_event is not None
    assert saved_event.host.username == "gargi"
    assert saved_event.is_public is True


def test_participant_model_creation(client):
    user = User.query.filter_by(email="alex@example.com").first()
    event = Event.query.first()

    participant = Participant(
        user_id=user.id,
        event_id=event.id
    )

    db.session.add(participant)
    db.session.commit()

    saved_participant = Participant.query.first()

    assert saved_participant is not None
    assert saved_participant.user.username == "alex"
    assert saved_participant.event.title == "Test Event"


def test_invitation_model_creation(client):
    user = User.query.filter_by(email="alex@example.com").first()
    event = Event.query.first()

    invitation = Invitation(
        user_id=user.id,
        event_id=event.id,
        status="pending"
    )

    db.session.add(invitation)
    db.session.commit()

    saved_invitation = Invitation.query.filter_by(status="pending").first()

    assert saved_invitation is not None
    assert saved_invitation.user.email == "alex@example.com"
    assert saved_invitation.event.title == "Test Event"


def test_task_model_creation(client):
    event = Event.query.first()
    user = User.query.filter_by(email="gargi@example.com").first()

    task = Task(
        name="Prepare food",
        assigned_to=user.id,
        completed=False,
        event_id=event.id
    )

    db.session.add(task)
    db.session.commit()

    saved_task = Task.query.filter_by(name="Prepare food").first()

    assert saved_task is not None
    assert saved_task.completed is False
    assert saved_task.event.title == "Test Event"


def test_timeline_model_creation(client):
    event = Event.query.first()

    timeline = Timeline(
        step="Arrive at location",
        order=1,
        event_id=event.id
    )

    db.session.add(timeline)
    db.session.commit()

    saved_timeline = Timeline.query.first()

    assert saved_timeline is not None
    assert saved_timeline.step == "Arrive at location"
    assert saved_timeline.order == 1


def test_poll_model_creation(client):
    event = Event.query.first()

    poll = Poll(
        question="What food should we bring?",
        event_id=event.id
    )

    db.session.add(poll)
    db.session.commit()

    option1 = PollOption(text="Pizza", poll_id=poll.id)
    option2 = PollOption(text="Sandwiches", poll_id=poll.id)

    db.session.add_all([option1, option2])
    db.session.commit()

    saved_poll = Poll.query.first()

    assert saved_poll is not None
    assert saved_poll.question == "What food should we bring?"
    assert len(saved_poll.options) == 2


def test_vote_model_creation(client):
    user = User.query.filter_by(email="gargi@example.com").first()
    event = Event.query.first()

    poll = Poll(
        question="Choose option",
        event_id=event.id
    )

    db.session.add(poll)
    db.session.commit()

    option = PollOption(
        text="Option A",
        poll_id=poll.id
    )

    db.session.add(option)
    db.session.commit()

    vote = Vote(
        user_id=user.id,
        option_id=option.id
    )

    db.session.add(vote)
    db.session.commit()

    saved_vote = Vote.query.first()

    assert saved_vote is not None
    assert saved_vote.user.username == "gargi"
    assert saved_vote.option.text == "Option A"