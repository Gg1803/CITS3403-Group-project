let eventGrid;
let modal;
let editingIndex = null; // null = create mode, number = edit mode

const gradients = {
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

let events = [
  {
    title: "Beach Day Bonanza",
    type: "Beach day",
    date: "2026-03-25",
    location: "Cottesloe Beach",
    desc: "Sun, games, snacks, and chill vibes by the ocean",
    participants: 5,
    public: true
  }
];

/* NAV */
function goTo(page) { window.location.href = page; }
function goToDetail() { window.location.href = "event_details.html"; }

/* MODAL */
function openModal() {
  editingIndex = null;
  clearForm();
  document.querySelector(".modal-content h2").innerText = "Create Event";
  document.getElementById("modalSubmitBtn").innerText = "Create";
  modal.style.display = "flex";
}

function openEditModal(index) {
  editingIndex = index;
  const e = events[index];

  document.getElementById("title").value = e.title;
  document.getElementById("type").value = e.type in gradients ? e.type : "Custom";
  if (!(e.type in gradients)) {
    document.getElementById("customType").value = e.type;
    document.getElementById("customType").style.display = "block";
  } else {
    document.getElementById("customType").style.display = "none";
  }
  document.getElementById("date").value = e.date;
  document.getElementById("location").value = e.location;
  document.getElementById("desc").value = e.desc || "";
  document.getElementById("isPublic").checked = e.public;

  updateCharCount();
  document.querySelector(".modal-content h2").innerText = "Edit Event";
  document.getElementById("modalSubmitBtn").innerText = "Save Changes";
  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
  editingIndex = null;
}

window.onclick = e => {
  if (e.target === modal) closeModal();
};

/* CHAR COUNT */
function updateCharCount() {
  const desc = document.getElementById("desc");
  const counter = document.getElementById("charCount");
  const max = 120;
  const len = desc.value.length;
  counter.innerText = `${len}/${max}`;
  counter.style.color = len >= max ? "#ef4444" : "#9ca3af";
  if (len > max) desc.value = desc.value.substring(0, max);
}

/* TYPE */
function handleTypeChange() {
  const type = document.getElementById("type").value;
  document.getElementById("customType").style.display = type === "Custom" ? "block" : "none";
}

/* CLEAR FORM */
function clearForm() {
  document.getElementById("title").value = "";
  document.getElementById("type").value = "Beach day";
  document.getElementById("customType").value = "";
  document.getElementById("customType").style.display = "none";
  document.getElementById("date").value = "";
  document.getElementById("location").value = "";
  document.getElementById("desc").value = "";
  document.getElementById("isPublic").checked = false;
  document.getElementById("charCount").innerText = "0/120";
}

/* SUBMIT — handles both create and edit */
function submitEvent() {
  const title = document.getElementById("title").value.trim();
  let type = document.getElementById("type").value;
  const custom = document.getElementById("customType").value.trim();
  const date = document.getElementById("date").value;
  const location = document.getElementById("location").value.trim();
  const desc = document.getElementById("desc").value.trim();

  if (!title || !date || !location) {
    alert("Please fill all required fields");
    return;
  }

  if (type === "Custom") type = custom || "Custom";

  const evt = { title, type, date, location, desc, participants: 1, public: document.getElementById("isPublic").checked };

  if (editingIndex !== null) {
    evt.participants = events[editingIndex].participants; // preserve participant count
    events[editingIndex] = evt;
  } else {
    events.push(evt);
  }

  renderEvents();
  closeModal();
  clearForm();
}

/* RENDER */
function renderEvents() {
  eventGrid.innerHTML = "";

  events.forEach((e, index) => {
    const gradient = gradients[e.type] || "gradient-dark";
    const descHTML = e.desc
      ? `<p><i data-lucide="align-left"></i> ${e.desc}</p>`
      : "";

    eventGrid.innerHTML += `
      <div class="card">
        <div class="card-header ${gradient}">
          <span class="card-title">${e.title}</span>
          <span class="card-badge">${e.public ? "Public" : "Private"}</span>
        </div>
        <div class="card-content">
          <p><i data-lucide="calendar"></i> ${e.date}</p>
          <p><i data-lucide="map-pin"></i> ${e.location}</p>
          <p><i data-lucide="users"></i> ${e.participants} participants</p>
          ${descHTML}
        </div>
        <div class="card-footer">
          <button class="view-btn" onclick="goToDetail()">View Details</button>
        </div>
      </div>
    `;
  });

  document.getElementById("eventCount").innerText = `You have ${events.length} upcoming events`;
  lucide.createIcons();
}

/* INIT */
document.addEventListener("DOMContentLoaded", () => {
  eventGrid = document.getElementById("eventGrid");
  modal = document.getElementById("modal");
  renderEvents();
  lucide.createIcons();
});