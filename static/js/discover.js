/* NAV */
function goTo(page) {
  window.location.href = page;
}

// gradient map
const gradientMap = {
  "Beach day":      "gradient-teal",
  "House party":    "gradient-pink",
  "Game night":     "gradient-purple",
  "Hiking/Outdoor": "gradient-green",
  "Study session":  "gradient-grey",
  "Sport events":   "gradient-orange",
  "Food/dining":    "gradient-red",
  "Movie night":    "gradient-indigo",
  "Concert/music":  "gradient-concert",
  "Custom":         "gradient-dark"
};

// fake public data
const publicEvents = [
  {
    id: 1,
    title: "Sunset Beach Volleyball",
    type: "Beach day",
    date: "2026-04-12",
    location: "Cottesloe Beach, Perth",
    description: "Casual volleyball followed by a bonfire. All levels welcome!",
    attendees: 14,
  },
  {
    id: 2,
    title: "Indie Housewarming Party",
    type: "House party",
    date: "2026-04-18",
    location: "Fremantle, Perth",
    description: "Bring a snack, bring a vibe. Good music guaranteed.",
    attendees: 22,
  },
  {
    id: 3,
    title: "Trivia & Board Game Night",
    type: "Game night",
    date: "2026-04-20",
    location: "The Broken Hill Hotel, Perth",
    description: "Teams of 4 — prizes for top 3 teams. Free entry.",
    attendees: 31,
  },
  {
    id: 4,
    title: "Kings Park Morning Hike",
    type: "Hiking/Outdoor",
    date: "2026-04-26",
    location: "Kings Park, Perth",
    description: "A scenic 8 km loop with coffee at the end.",
    attendees: 9,
  },
  {
    id: 5,
    title: "UX Design Study Circle",
    type: "Study session",
    date: "2026-05-03",
    location: "State Library of WA",
    description: "Weekly co-working for designers & developers. BYOL.",
    attendees: 7,
  },
  {
    id: 6,
    title: "5-a-Side Footy Showdown",
    type: "Sport events",
    date: "2026-05-10",
    location: "Langley Park, Perth",
    description: "Mixed-gender friendly match. Bring your boots!",
    attendees: 18,
  },
  {
    id: 7,
    title: "Dumpling Crawl",
    type: "Food/dining",
    date: "2026-04-30",
    location: "Northbridge, Perth",
    description: "Hit 4 dumpling spots in one evening. Limited spots.",
    attendees: 12,
  },
  {
    id: 8,
    title: "Outdoor Cinema Night",
    type: "Movie night",
    date: "2026-05-07",
    location: "Elizabeth Quay, Perth",
    description: "BYO blankets & snacks. Screening: The Grand Budapest Hotel.",
    attendees: 40,
  },
  {
    id: 9,
    title: "Local Bands Showcase",
    type: "Concert/music",
    date: "2026-05-15",
    location: "Rosemount Hotel, Perth",
    description: "Three local acts, $5 entry, all proceeds to charity.",
    attendees: 55,
  },
  {
    id: 10,
    title: "Sunrise Yoga on the Beach",
    type: "Hiking/Outdoor",
    date: "2026-04-22",
    location: "City Beach, Perth",
    description: "Free community yoga session. Mats provided.",
    attendees: 26,
  },
  {
    id: 11,
    title: "Retro Gaming Marathon",
    type: "Game night",
    date: "2026-05-02",
    location: "Perth City, WA",
    description: "SNES, N64, PS1 — the full nostalgia trip. Snacks supplied.",
    attendees: 16,
  },
  {
    id: 12,
    title: "Jazz Brunch Pop-Up",
    type: "Concert/music",
    date: "2026-04-27",
    location: "Subiaco, Perth",
    description: "Live jazz quartet + bottomless mimosas. Bookings required.",
    attendees: 34,
  },
];

// Tracks which events the user has joined (by id)
const joined = new Set();

/* HELPERS */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function getGradient(type) {
  return gradientMap[type] || "gradient-grey";
}

/* RENDER */
function renderEvents(events) {
  const grid = document.getElementById("discoverGrid");
  const empty = document.getElementById("emptyState");
  const count = document.getElementById("resultCount");

  grid.innerHTML = "";

  if (events.length === 0) {
    empty.style.display = "flex";
    count.textContent = "No events found";
    lucide.createIcons();
    return;
  }

  empty.style.display = "none";
  count.textContent = `Showing ${events.length} event${events.length !== 1 ? "s" : ""}`;

  events.forEach(ev => {
    const isJoined = joined.has(ev.id);
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-header ${getGradient(ev.type)}">
        <div class="card-title">${ev.title}</div>
        <div class="card-badge">${ev.type}</div>
      </div>
      <div class="card-content">
        <p><i data-lucide="calendar"></i> ${formatDate(ev.date)}</p>
        <p><i data-lucide="map-pin"></i> ${ev.location}</p>
        <p><i data-lucide="users"></i> ${ev.attendees} going${isJoined ? '<span class="joined-badge">Joined</span>' : ""}</p>
        ${ev.description ? `<p class="card-desc">${ev.description}</p>` : ""}
      </div>
      <div class="card-footer">
        <button class="view-btn" onclick="goTo('/event-details')">View Details</button>
        <button class="join-btn ${isJoined ? "joined" : ""}" id="join-${ev.id}" onclick="toggleJoin(${ev.id})">
          ${isJoined ? "Leave" : "Join"}
        </button>
      </div>
    `;
    grid.appendChild(card);
  });

  lucide.createIcons();
}

/* FILTER */
function filterEvents() {
  const val = document.getElementById("typeFilter").value;
  const filtered = val === "all"
    ? publicEvents
    : publicEvents.filter(e => e.type === val);
  renderEvents(filtered);
}

/* JOIN / LEAVE TOGGLE */
function toggleJoin(id) {
  const ev = publicEvents.find(e => e.id === id);
  if (!ev) return;

  if (joined.has(id)) {
    joined.delete(id);
    ev.attendees--;
  } else {
    joined.add(id);
    ev.attendees++;
  }

  // Re-render keeping current filter
  filterEvents();
}

/* INIT */
document.addEventListener("DOMContentLoaded", () => {
  renderEvents(publicEvents);
});