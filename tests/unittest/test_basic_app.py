from models import Event, User


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
