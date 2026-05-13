from models import db, Event, User, Timeline


def login(client, email="gargi@example.com", password="password123"):
    return client.post(
        "/login",
        data={"email": email, "password": password},
        follow_redirects=True,
    )


def test_login_page_loads_with_csrf_token(client):
    response = client.get("/login")

    assert response.status_code == 200
    assert b'name="csrf_token"' in response.data


def test_dashboard_redirects_when_not_logged_in(client):
    response = client.get("/dashboard")

    assert response.status_code == 302
    assert "/login" in response.headers["Location"]


def test_signup_creates_new_user_in_test_database(client):
    response = client.post(
        "/signup",
        data={
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "Password123",
        },
        follow_redirects=True,
    )

    assert response.status_code == 200
    assert User.query.filter_by(email="newuser@example.com").first() is not None


def test_logged_in_user_can_create_event(client):
    login(client)

    response = client.post(
        "/create-event",
        json={
            "title": "Unit Test Event",
            "type": "Study session",
            "date": "2026-06-01",
            "location": "Library",
            "description": "A small test event",
            "is_public": True,
        },
    )

    assert response.status_code == 200
    assert Event.query.filter_by(title="Unit Test Event").first() is not None


def test_profile_update_changes_current_user(client):
    login(client)

    response = client.post(
        "/profile/update",
        json={
            "username": "updatedgargi",
            "email": "updatedgargi@example.com",
        },
    )

    assert response.status_code == 200

    user = User.query.filter_by(email="updatedgargi@example.com").first()
    assert user is not None
    assert user.username == "updatedgargi"


def test_dashboard_has_csrf_meta_token(client):
    login(client)

    response = client.get("/dashboard")

    assert response.status_code == 200
    assert b'name="csrf-token"' in response.data


def test_discover_has_type_filter_options(client):
    login(client)

    response = client.get("/discover")

    assert response.status_code == 200
    assert b"Beach day" in response.data
    assert b"Sport events" in response.data
    assert b"Concert/music" in response.data


def test_profile_displays_logged_in_user_data(client):
    login(client)

    response = client.get("/profile")

    assert response.status_code == 200
    assert b"gargi" in response.data
    assert b"gargi@example.com" in response.data


def test_event_details_contains_timeline_position_dropdown(client):
    login(client)

    event = Event.query.first()
    response = client.get(f"/event-details/{event.id}")

    assert response.status_code == 200
    assert b'id="timelinePosition"' in response.data
    assert b"Insert position" in response.data


def test_timeline_insert_reorders_steps(client):
    login(client)

    event = Event.query.first()

    Timeline.query.filter_by(event_id=event.id).delete()
    db.session.commit()

    step1 = Timeline(step="Step 1", order=1, event_id=event.id)
    step2 = Timeline(step="Step 2", order=2, event_id=event.id)

    db.session.add_all([step1, step2])
    db.session.commit()

    response = client.post(
        f"/event/{event.id}/timeline",
        json={
            "step": "Inserted Step",
            "after_order": 1,
        },
    )

    assert response.status_code == 200

    steps = (
        Timeline.query
        .filter_by(event_id=event.id)
        .order_by(Timeline.order)
        .all()
    )

    assert len(steps) == 3
    assert steps[0].step == "Step 1"
    assert steps[1].step == "Inserted Step"
    assert steps[2].step == "Step 2"
    assert [step.order for step in steps] == [1, 2, 3]