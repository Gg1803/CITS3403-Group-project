from conftest import login
from models import db, User, Event, Participant, Task, Timeline, Poll, PollOption


def test_dashboard_requires_login(client):
    response = client.get("/dashboard")
    assert response.status_code == 302


def test_dashboard_loads_after_login(client):
    login(client)
    response = client.get("/dashboard")
    assert response.status_code == 200
    assert b"My Events" in response.data


def test_discover_loads_after_login(client):
    login(client)
    response = client.get("/discover")
    assert response.status_code == 200
    assert b"Discover" in response.data


def test_profile_loads_after_login(client):
    login(client)
    response = client.get("/profile")
    assert response.status_code == 200
    assert b"My Profile" in response.data


def test_invitations_loads_after_login(client):
    login(client, email="alex@example.com", password="password123")
    response = client.get("/invitations")
    assert response.status_code == 200
    assert b"My Invitations" in response.data


def test_event_details_loads(client):
    login(client)

    event = Event.query.first()
    response = client.get(f"/event-details/{event.id}")

    assert response.status_code == 200
    assert b"Event Details" in response.data or b"Task Board" in response.data


def test_create_event_route(client):
    login(client)

    response = client.post(
        "/create-event",
        json={
            "title": "New Test Event",
            "type": "Beach day",
            "date": "2026-06-01",
            "location": "Cottesloe Beach",
            "description": "Created by test",
            "is_public": True
        }
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data["title"] == "New Test Event"
    assert data["event_type"] == "Beach day"


def test_update_event_route(client):
    login(client)

    event = Event.query.first()

    response = client.patch(
        f"/event/{event.id}",
        json={
            "title": "Updated Event",
            "event_type": "Game night",
            "location": "Perth",
            "description": "Updated description",
            "is_public": False,
            "date": "2026-07-01"
        }
    )

    assert response.status_code == 200
    assert response.get_json()["success"] is True

    updated_event = db.session.get(Event, event.id)
    assert updated_event.title == "Updated Event"
    assert updated_event.location == "Perth"


def test_add_task_route(client):
    login(client)

    event = Event.query.first()

    response = client.post(
        f"/event/{event.id}/tasks",
        json={
            "name": "Bring snacks",
            "assigned_to": 1
        }
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data["name"] == "Bring snacks"
    assert data["completed"] is False


def test_get_tasks_route(client):
    login(client)

    event = Event.query.first()

    task = Task(
        name="Test task",
        assigned_to=1,
        completed=False,
        event_id=event.id
    )

    db.session.add(task)
    db.session.commit()

    response = client.get(f"/event/{event.id}/tasks")

    assert response.status_code == 200
    assert response.get_json()[0]["name"] == "Test task"


def test_add_timeline_route(client):
    login(client)

    event = Event.query.first()

    response = client.post(
        f"/event/{event.id}/timeline",
        json={
            "step": "Arrive at venue"
        }
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data["step"] == "Arrive at venue"
    assert data["order"] == 1


def test_add_participant_route(client):
    login(client)

    event = Event.query.first()

    response = client.post(
        f"/event/{event.id}/participants",
        json={
            "email": "alex@example.com"
        }
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data["username"] == "alex"


def test_add_participant_user_not_found(client):
    login(client)

    event = Event.query.first()

    response = client.post(
        f"/event/{event.id}/participants",
        json={
            "email": "missing@example.com"
        }
    )

    assert response.status_code == 404
    assert response.get_json()["error"] == "User not found"


def test_create_poll_route(client):
    login(client)

    event = Event.query.first()

    response = client.post(
        f"/event/{event.id}/polls",
        json={
            "question": "What time?",
            "options": ["5 PM", "6 PM"]
        }
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data["question"] == "What time?"
    assert len(data["options"]) == 2


def test_join_event_route(client):
    login(client, email="alex@example.com", password="password123")

    event = Event.query.first()

    response = client.post(f"/event/{event.id}/join")

    assert response.status_code == 200
    assert response.get_json()["success"] is True


def test_logout_route(client):
    login(client)
    response = client.get("/logout", follow_redirects=False)

    assert response.status_code == 302
    assert "/login" in response.location