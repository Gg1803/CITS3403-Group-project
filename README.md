# Eventure

Eventure is a full-stack web application that allows users to create, manage, and discover events. The platform enables collaboration through invitations, task management, timelines, and interactive polls.

---

## Group Members

| Student ID | Name        | GitHub                                                 |
| ---------- | ----------- | ------------------------------------------------------ |
| 23887876   | Gargi Garg  | [@Gg1803](https://github.com/Gg1803)                   |
| 24159102   | Khanh Do    | [@khanhdo01060903](https://github.com/khanhdo01060903) |
| 24092758   | Yiming Ding | [@Vincent0301](https://github.com/Vincent0301)         |
| 23986759   | Zihan He    | [@AnnieH0826](https://github.com/AnnieH0826)           |

---

## Project Overview

Eventure is built using a client-server architecture and demonstrates full-stack web development concepts.

**Technologies Used:**

* Frontend: HTML, CSS, JavaScript
* Backend: Flask (Python)
* Database: SQLite (Flask-SQLAlchemy)
* Testing: Pytest, Selenium

---

## Key Features

* User authentication (login/logout)
* Event creation and management
* Discover public events
* Invitation system for participants
* Task board and timeline management
* Polls and voting within events
* User profile management

---

## Security

* Passwords are securely stored using salted hashing
* CSRF protection is implemented using Flask-WTF
* Sensitive configuration (e.g. secret keys) is managed using environment variables

---

## Testing

The project includes:

* Unit tests for backend functionality
* Selenium tests simulating real user interactions

### Run all tests

```bash
PYTHONPATH=. python -m pytest tests
```

### Run unit tests only

```bash
PYTHONPATH=. python -m pytest tests/test_forms.py tests/test_routes.py tests/test_usermodels.py
```

### Run Selenium tests

(make sure the server is running)

```bash
PYTHONPATH=. python -m pytest tests/test_selenium.py
```

---

## Project Structure

```text
CITS3403-Group-project/
│
├── app.py
├── models.py
├── seed.py
├── requirements.txt
├── README.md
│
├── instance/
│   └── database.db
│
├── templates/
├── static/
└── tests/
```

---

## Setup Instructions

### 1. Clone repository

```bash
git clone https://github.com/Gg1803/CITS3403-Group-project.git
cd CITS3403-Group-project
```

### 2. Create virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file:

```bash
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///database.db
```

### 5. Setup database

```bash
flask --app app db upgrade
```

### 6. Seed database (optional)

```bash
python seed.py
```

### 7. Run application

```bash
python app.py
```

Open in browser:

```
http://127.0.0.1:5000
```

---

## Notes

* The application follows a modular Flask structure using templates and static assets.
* Protected routes require authentication and redirect unauthorised users.
* The system is designed to handle invalid input and prevent common errors.
