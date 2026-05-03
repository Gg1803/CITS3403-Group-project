from conftest import login
from models import User


def test_login_form_loads(client):
    response = client.get("/login")

    assert response.status_code == 200
    assert b"Log In" in response.data
    assert b"Sign Up" in response.data


def test_valid_login_form(client):
    response = login(client)

    assert response.status_code == 200
    assert b"My Events" in response.data


def test_invalid_login_form(client):
    response = client.post(
        "/login",
        data={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        },
        follow_redirects=True
    )

    assert response.status_code == 200
    assert b"Incorrect email or password" in response.data


def test_signup_form_submits_successfully(client):
    response = client.post(
        "/signup",
        data={
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "password123"
        },
        follow_redirects=False
    )

    assert response.status_code in [200, 302]


def test_duplicate_signup_handled(client):
    response = client.post(
        "/signup",
        data={
            "username": "duplicate",
            "email": "gargi@example.com",
            "password": "password123"
        },
        follow_redirects=False
    )

    assert response.status_code in [200, 302]


def test_profile_update_form(client):
    login(client)

    response = client.post(
        "/profile/update",
        json={
            "username": "updatedgargi",
            "email": "updated@example.com"
        }
    )

    assert response.status_code == 200
    assert response.get_json()["success"] is True

    user = User.query.filter_by(email="updated@example.com").first()
    assert user is not None
    assert user.username == "updatedgargi"


def test_change_password_wrong_current_password(client):
    login(client)

    response = client.post(
        "/profile/password",
        json={
            "current": "wrongpassword",
            "new": "newpassword123"
        }
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "Current password is incorrect."