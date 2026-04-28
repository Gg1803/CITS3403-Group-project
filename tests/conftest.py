import os
import sys
import pytest
from datetime import datetime
from werkzeug.security import generate_password_hash

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, BASE_DIR)

from app import app
from models import db, User, Event, Participant, Invitation


@pytest.fixture
def client():
    app.config.update(
        TESTING=True,
        SECRET_KEY="test-secret-key",
        SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",
        WTF_CSRF_ENABLED=False
    )

    with app.app_context():
        db.drop_all()
        db.create_all()

        user1 = User(
            username="gargi",
            email="gargi@example.com",
            password_hash=generate_password_hash("password123")
        )

        user2 = User(
            username="alex",
            email="alex@example.com",
            password_hash=generate_password_hash("password123")
        )

        db.session.add_all([user1, user2])
        db.session.commit()

        event = Event(
            title="Test Event",
            description="Test event description",
            location="UWA",
            event_date=datetime(2026, 5, 1),
            event_type="Study session",
            is_public=True,
            user_id=user1.id
        )

        db.session.add(event)
        db.session.commit()

        invitation = Invitation(
            user_id=user2.id,
            event_id=event.id,
            status="pending"
        )

        db.session.add(invitation)
        db.session.commit()

        with app.test_client() as test_client:
            yield test_client

        db.session.remove()
        db.drop_all()


def login(client, email="gargi@example.com", password="password123"):
    return client.post(
        "/login",
        data={
            "email": email,
            "password": password
        },
        follow_redirects=True
    )