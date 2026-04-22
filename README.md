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

The application allows users to:
- View and discover events  
- Manage invitations  
- View event details  
- Access a personal dashboard and profile  

## 📁 Project Structure

CITS3403-Group-project/
│
├── app.py # Main Flask application
├── instance/
│ └── database.db # SQLite database (auto-generated)
│
├── templates/ # HTML files (Flask templates)
│ ├── login_signup.html
│ ├── dashboard.html
│ ├── discover.html
│ ├── event_details.html
│ ├── invitation_page.html
│ └── profile.html
│
├── static/ # Static assets
│ ├── css/
│ └── js/
│
└── README.md


---

## ⚙️ Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/Gg1803/CITS3403-Group-project.git
cd CITS3403-Group-project
```
2. Create a virtual environment
```bash
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies
```bash
pip install flask flask-sqlalchemy
```
Or (if requirements.txt is available):
```bash
pip install -r requirements.txt
```

4. Run the application
```bash
python app.py
```
5. Open in browser
```bash
http://127.0.0.1:5000
```

## Available Routes

| Route            | Description         |
| ---------------- | ------------------- |
| `/` or `/login`  | Login / Signup page |
| `/dashboard`     | User dashboard      |
| `/discover`      | Discover events     |
| `/event-details` | Event details page  |
| `/invitations`   | Invitations page    |
| `/profile`       | User profile        |

🗄️ Database
Uses SQLite
File: instance/database.db
Automatically created when the app runs

