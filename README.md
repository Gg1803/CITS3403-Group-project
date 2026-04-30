# Eventure
A web-based event management platform that allows users to discover, create, and manage events.

## Group Members

| Student ID | Name        | GitHub                                                 |
| ---------- | ----------- | ------------------------------------------------------ |
| 23887876   | Gargi Garg  | [@Gg1803](https://github.com/Gg1803)                   |
| 24159102   | Khanh Do    | [@khanhdo01060903](https://github.com/khanhdo01060903) |
| 24092758   | Yiming Ding | [@Vincent0301](https://github.com/Vincent0301)         |
| 23986759   | Zihan He    | [@AnnieH0826](https://github.com/AnnieH0826)           |

## Project Overview
Eventure is a full-stack web application built using:
- **Frontend:** HTML, CSS, JavaScript  
- **Backend:** Flask (Python)  
- **Database:** SQLite (via Flask-SQLAlchemy)  

The system allows users to:

- create and manage events
- discover public events
- view event details
- invite participants
- manage tasks and timelines
- create polls and vote on options
- view invitations and profile details

## Main Features

### Dashboard
Users can create events with a title, description, date, location, type, and visibility setting.

### Discover Page
Public events are shown on the discover page so users can browse and join available events.

### Invitations
Invitations can be created for a specific event and linked to registered users in the database.

### Participants
Users can join events and appear in the participant list.

### Task Board
Each event can include tasks that help organise responsibilities.

### Timeline
Each event can include timeline steps to plan the flow of activities.

### Polls and Voting
Polls can be created for an event, with multiple options, and users can vote on them.

### Seed Data
A `seed.py` file is included to populate the database with sample users, events, invitations, tasks, timelines, polls, and votes for testing and demonstration.  

## Project Structure

```text
CITS3403-Group-project/
│
├── app.py
├── seed.py
├── models.py
├── requirements.txt
├── README.md
│
├── instance/
│   └── database.db
│
├── templates/
│   ├── login_signup.html
│   ├── dashboard.html
│   ├── discover.html
│   ├── event_details.html
│   ├── invitation_page.html
│   └── profile.html
│
├── static/
│   ├── css/
│   └── js/
│
└── meeting minutes/

```

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/Gg1803/CITS3403-Group-project.git
cd CITS3403-Group-project
```
### 2. Setup environment variables

Create a .env file in the project root (same level as app.py):

```bash
SECRET_KEY=your-very-long-random-secret-key-change-this
DATABASE_URL=sqlite:///database.db
```

### 3. Create and activate a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 4. Install dependencies

```bash
pip install flask flask-sqlalchemy werkzeug flask-login
```
Or (if requirements.txt is available):

### Installation

Install all required project dependencies:

###Add Mailtrap install (must)

```bash
pip install mailtrap
```

```bash
pip install -r requirements.txt
```
### If python-dotenv is missing, install it separately:
```bash
pip install python-dotenv
```

### 5. Seed the database

```bash
python seed.py
```
This will create the database and populate it with sample data. You'll see "Database seeded successfully" when done. Every time after that just run the application (Step 5)

### 6. Run the application

```bash
python app.py
```

### 7. Open in browser

```bash
http://127.0.0.1:5000
```
### 8. Install Selenium

```bash
pip install selenium
```
or

If using Mac:

```bash
brew install chromedriver
```

### 9. Running test cases 

```bash
PYTHONPATH=. python -m pytest tests
```

### running only uni test

```bash
PYTHONPATH=. python -m pytest tests/test_forms.py tests/test_routes.py tests/test_usermodels.py
```

### Run only Selenium tests

```bash
PYTHONPATH=. python -m pytest tests/test_selenium.py
```


## Available Routes

| Route                           | Description                        |
| ------------------------------- | ---------------------------------- |
| `/` or `/login`                 | Login / signup page                |
| `/dashboard`                    | Main dashboard showing events      |
| `/discover`                     | Page for browsing public events    |
| `/event-details/<event_id>`     | Detailed page for a selected event |
| `/invitations/<event_id>`       | Invitations for a selected event   |
| `/profile`                      | User profile page                  |
| `/create-event`                 | Create a new event                 |
| `/create-invitation/<event_id>` | Create an invitation for an event  |
| `/join-event/<event_id>`        | Join an event                      |
| `/add-task/<event_id>`          | Add a task to an event             |
| `/add-timeline/<event_id>`      | Add a timeline step to an event    |
| `/add-poll/<event_id>`          | Add a poll to an event             |
| `/vote/<option_id>`             | Vote on a poll option              |


## Database
The project uses SQLite as its database.

The database file is created automatically when the project runs and is stored in:

```bash
instance/database.db
```
The database includes models for:

User
Event
Participant
Invitation
Task
Timeline
Poll
PollOption
Vote
Added password change email notification using Mailtrap API
