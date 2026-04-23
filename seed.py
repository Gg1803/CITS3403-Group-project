from dotenv import load_dotenv
load_dotenv()

from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from app import app
from models import db, User, Event, Participant, Invitation, Task, Timeline, Poll, PollOption, Vote


def future_date(days, hours=0):
    return datetime.utcnow() + timedelta(days=days, hours=hours)


with app.app_context():
    db.drop_all()
    db.create_all()

    user1 = User(username="gargi",  email="gargi@example.com",  password_hash=generate_password_hash("password123"))
    user2 = User(username="alex",   email="alex@example.com",   password_hash=generate_password_hash("password123"))
    user3 = User(username="priya",  email="priya@example.com",  password_hash=generate_password_hash("password123"))
    user4 = User(username="john",   email="john@example.com",   password_hash=generate_password_hash("password123"))
    user5 = User(username="sarah",  email="sarah@example.com",  password_hash=generate_password_hash("password123"))
    user6 = User(username="mike",   email="mike@example.com",   password_hash=generate_password_hash("password123"))

    db.session.add_all([user1, user2, user3, user4, user5, user6])
    db.session.commit()

    # event_type values match dashboard gradient map exactly
    event1 = Event(
        title="Beach Day Bonanza",
        description="A fun beach event with food, music and games.",
        location="Cottesloe Beach",
        event_date=future_date(5),
        event_type="Beach day",
        is_public=True,
        user_id=user1.id
    )
    event2 = Event(
        title="Tech Networking Night",
        description="A networking event for students interested in tech.",
        location="UWA EZONE",
        event_date=future_date(10),
        event_type="Game night",
        is_public=True,
        user_id=user2.id
    )
    event3 = Event(
        title="Birthday Dinner",
        description="Birthday dinner with close friends and family.",
        location="Nedlands",
        event_date=future_date(3, 4),
        event_type="Food/dining",
        is_public=False,
        user_id=user3.id
    )
    event4 = Event(
        title="Study Session Sprint",
        description="Group study session before the next assessment.",
        location="Reid Library",
        event_date=future_date(2),
        event_type="Study session",
        is_public=False,
        user_id=user4.id
    )
    event5 = Event(
        title="Friday Futsal",
        description="Friendly futsal match after class.",
        location="UWA Sports Centre",
        event_date=future_date(7),
        event_type="Sport events",
        is_public=True,
        user_id=user5.id
    )
    event6 = Event(
        title="Indie Housewarming",
        description="Good music and good vibes. Bring a snack!",
        location="Fremantle",
        event_date=future_date(14),
        event_type="House party",
        is_public=True,
        user_id=user6.id
    )

    db.session.add_all([event1, event2, event3, event4, event5, event6])
    db.session.commit()

    participants = [
        Participant(user_id=user2.id, event_id=event1.id),
        Participant(user_id=user3.id, event_id=event1.id),
        Participant(user_id=user4.id, event_id=event1.id),

        Participant(user_id=user1.id, event_id=event2.id),
        Participant(user_id=user5.id, event_id=event2.id),
        Participant(user_id=user6.id, event_id=event2.id),

        Participant(user_id=user1.id, event_id=event3.id),
        Participant(user_id=user2.id, event_id=event3.id),

        Participant(user_id=user3.id, event_id=event4.id),
        Participant(user_id=user5.id, event_id=event4.id),

        Participant(user_id=user1.id, event_id=event5.id),
        Participant(user_id=user2.id, event_id=event5.id),

        Participant(user_id=user3.id, event_id=event6.id),
        Participant(user_id=user4.id, event_id=event6.id),
    ]

    db.session.add_all(participants)
    db.session.commit()

    invitations = [
        Invitation(user_id=user5.id, event_id=event1.id, status="pending"),
        Invitation(user_id=user6.id, event_id=event1.id, status="accepted"),
        Invitation(user_id=user4.id, event_id=event2.id, status="pending"),
        Invitation(user_id=user3.id, event_id=event2.id, status="accepted"),
        Invitation(user_id=user5.id, event_id=event3.id, status="declined"),
        Invitation(user_id=user2.id, event_id=event4.id, status="accepted"),
        Invitation(user_id=user6.id, event_id=event5.id, status="pending"),
        Invitation(user_id=user1.id, event_id=event6.id, status="pending"),
    ]

    db.session.add_all(invitations)
    db.session.commit()

    tasks = [
        Task(name="Book picnic area",      assigned_to=user1.id, completed=True,  event_id=event1.id),
        Task(name="Bring snacks",          assigned_to=user2.id, completed=False, event_id=event1.id),
        Task(name="Create poster",         assigned_to=user5.id, completed=True,  event_id=event2.id),
        Task(name="Arrange speaker setup", assigned_to=user6.id, completed=False, event_id=event2.id),
        Task(name="Reserve dinner table",  assigned_to=user3.id, completed=False, event_id=event3.id),
        Task(name="Prepare guest list",    assigned_to=user3.id, completed=True,  event_id=event3.id),
        Task(name="Prepare notes",         assigned_to=user4.id, completed=False, event_id=event4.id),
        Task(name="Book the court",        assigned_to=user5.id, completed=True,  event_id=event5.id),
        Task(name="Bring extra balls",     assigned_to=user1.id, completed=False, event_id=event5.id),
        Task(name="Buy drinks",            assigned_to=user6.id, completed=False, event_id=event6.id),
    ]

    db.session.add_all(tasks)
    db.session.commit()

    timelines = [
        Timeline(step="Arrive at the beach", order=1, event_id=event1.id),
        Timeline(step="Set up games",        order=2, event_id=event1.id),
        Timeline(step="Lunch and relax",     order=3, event_id=event1.id),

        Timeline(step="Registration",        order=1, event_id=event2.id),
        Timeline(step="Networking session",  order=2, event_id=event2.id),
        Timeline(step="Closing remarks",     order=3, event_id=event2.id),

        Timeline(step="Guests arrive",       order=1, event_id=event3.id),
        Timeline(step="Dinner starts",       order=2, event_id=event3.id),
        Timeline(step="Cake cutting",        order=3, event_id=event3.id),

        Timeline(step="Meet in library",     order=1, event_id=event4.id),
        Timeline(step="Review content",      order=2, event_id=event4.id),
        Timeline(step="Practice questions",  order=3, event_id=event4.id),

        Timeline(step="Warm up",             order=1, event_id=event5.id),
        Timeline(step="Match begins",        order=2, event_id=event5.id),
        Timeline(step="Cool down",           order=3, event_id=event5.id),

        Timeline(step="Doors open",          order=1, event_id=event6.id),
        Timeline(step="Music starts",        order=2, event_id=event6.id),
        Timeline(step="Food served",         order=3, event_id=event6.id),
    ]

    db.session.add_all(timelines)
    db.session.commit()

    poll1 = Poll(question="What food should we bring?",            event_id=event1.id)
    poll2 = Poll(question="Which topic should be discussed first?", event_id=event2.id)
    poll3 = Poll(question="What dessert should we have?",           event_id=event3.id)
    poll4 = Poll(question="What time should we start?",             event_id=event5.id)

    db.session.add_all([poll1, poll2, poll3, poll4])
    db.session.commit()

    options = [
        PollOption(text="Pizza",           poll_id=poll1.id),
        PollOption(text="Sandwiches",      poll_id=poll1.id),
        PollOption(text="Fruit platter",   poll_id=poll1.id),

        PollOption(text="AI Careers",      poll_id=poll2.id),
        PollOption(text="Cybersecurity",   poll_id=poll2.id),
        PollOption(text="Data Science",    poll_id=poll2.id),

        PollOption(text="Chocolate cake",  poll_id=poll3.id),
        PollOption(text="Ice cream",       poll_id=poll3.id),
        PollOption(text="Cheesecake",      poll_id=poll3.id),

        PollOption(text="5:00 PM",         poll_id=poll4.id),
        PollOption(text="6:00 PM",         poll_id=poll4.id),
        PollOption(text="7:00 PM",         poll_id=poll4.id),
    ]

    db.session.add_all(options)
    db.session.commit()

    pizza      = PollOption.query.filter_by(text="Pizza",          poll_id=poll1.id).first()
    sandwiches = PollOption.query.filter_by(text="Sandwiches",     poll_id=poll1.id).first()
    fruit      = PollOption.query.filter_by(text="Fruit platter",  poll_id=poll1.id).first()
    ai         = PollOption.query.filter_by(text="AI Careers",     poll_id=poll2.id).first()
    cyber      = PollOption.query.filter_by(text="Cybersecurity",  poll_id=poll2.id).first()
    data_sci   = PollOption.query.filter_by(text="Data Science",   poll_id=poll2.id).first()
    cake       = PollOption.query.filter_by(text="Chocolate cake", poll_id=poll3.id).first()
    icecream   = PollOption.query.filter_by(text="Ice cream",      poll_id=poll3.id).first()
    cheesecake = PollOption.query.filter_by(text="Cheesecake",     poll_id=poll3.id).first()
    five_pm    = PollOption.query.filter_by(text="5:00 PM",        poll_id=poll4.id).first()
    six_pm     = PollOption.query.filter_by(text="6:00 PM",        poll_id=poll4.id).first()

    votes = [
        Vote(user_id=user1.id, option_id=pizza.id),
        Vote(user_id=user2.id, option_id=sandwiches.id),
        Vote(user_id=user3.id, option_id=fruit.id),

        Vote(user_id=user1.id, option_id=cyber.id),
        Vote(user_id=user5.id, option_id=ai.id),
        Vote(user_id=user6.id, option_id=data_sci.id),

        Vote(user_id=user2.id, option_id=cake.id),
        Vote(user_id=user3.id, option_id=cheesecake.id),
        Vote(user_id=user5.id, option_id=icecream.id),

        Vote(user_id=user1.id, option_id=five_pm.id),
        Vote(user_id=user2.id, option_id=six_pm.id),
    ]

    db.session.add_all(votes)
    db.session.commit()

    print("Database seeded successfully.")