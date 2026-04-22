let eventGrid;
let modal;
let emptyState;
let editingIndex = null;

const gradients = {
  "Beach day": "gradient-teal",
  "House party": "gradient-pink",
  "Game night": "gradient-purple",
  "Hiking/Outdoor": "gradient-green",
  "Study session": "gradient-grey",
  "Sport events": "gradient-orange",
  "Food/dining": "gradient-red",
  "Movie night": "gradient-indigo",
  "Concert/music": "gradient-concert",
  "Custom": "gradient-dark"
};

const fallbackImages = {
  "Beach day": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  "House party": "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80",
  "Game night": "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=1200&q=80",
  "Hiking/Outdoor": "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80",
  "Study session": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
  "Sport events": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
  "Food/dining": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
  "Movie night": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
  "Concert/music": "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
  "Custom": "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80"
};

let events = [
  {
    title: "Beach Day Bonanza",
    type: "Beach day",
    date: "2026-03-25",
    location: "Cottesloe Beach",
    desc: "Sun, games, snacks, and chill vibes by the ocean",
    participants: 5,
    public: true,
    image: fallbackImages["Beach day"]
  }
];

/* NAV */
function goTo(page) {
  window.location.href = page;
}

function goToDetail() {
  window.location.href = "/event-details";
}

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
    document.getElementById("customType").value = "";
    document.getElementById("customType").style.display = "none";
  }

  document.getElementById("date").value = e.date;
  document.getElementById("location").value = e.location;
  document.getElementById("desc").value = e.desc || "";
  document.getElementById("image").value = e.image || "";
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

  if (len > max) {
    desc.value = desc.value.substring(0, max);
  }

  counter.innerText = `${desc.value.length}/${max}`;
  counter.style.color = desc.value.length >= max ? "#ef4444" : "#9ca3af";
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
  document.getElementById("image").value = "";
  document.getElementById("isPublic").checked = false;
  document.getElementById("charCount").innerText = "0/120";
}

/* DATE FORMAT */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

/* SUBMIT */
function submitEvent() {
  const title = document.getElementById("title").value.trim();
  let type = document.getElementById("type").value;
  const custom = document.getElementById("customType").value.trim();
  const date = document.getElementById("date").value;
  const location = document.getElementById("location").value.trim();
  const desc = document.getElementById("desc").value.trim();
  const imageInput = document.getElementById("image").value.trim();
  const isPublic = document.getElementById("isPublic").checked;

  if (!title || !date || !location) {
    alert("Please fill all required fields");
    return;
  }

  if (type === "Custom") {
    type = custom || "Custom";
  }

  const evt = {
    title,
    type,
    date,
    location,
    desc,
    participants: 1,
    public: isPublic,
    image: imageInput || fallbackImages[type] || fallbackImages["Custom"]
  };

  if (editingIndex !== null) {
    evt.participants = events[editingIndex].participants;
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

  if (events.length === 0) {
    emptyState.classList.remove("hidden");
    document.getElementById("eventCount").innerText = "You have 0 upcoming events";
    lucide.createIcons();
    return;
  }

  emptyState.classList.add("hidden");

  events.forEach((e, index) => {
    const gradient = gradients[e.type] || "gradient-dark";

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-image-wrap">
        <img class="card-image" src="${e.image || fallbackImages["Custom"]}" alt="${e.title}">
        <div class="card-image-overlay ${gradient}"></div>
        <div class="card-header-overlay">
          <span class="card-title">${e.title}</span>
          <span class="card-badge">${e.public ? "Public" : "Private"}</span>
        </div>
      </div>

      <div class="card-content">
        <p><i data-lucide="calendar"></i> ${formatDate(e.date)}</p>
        <p><i data-lucide="map-pin"></i> ${e.location}</p>
        <p><i data-lucide="users"></i> ${e.participants} participant${e.participants !== 1 ? "s" : ""}</p>
        ${e.desc ? `<p class="card-desc">${e.desc}</p>` : ""}
      </div>

      <div class="card-footer">
        <button class="view-btn" onclick="goToDetail()">View Details</button>
        <button class="edit-btn" onclick="openEditModal(${index})">Edit</button>
      </div>
    `;

    eventGrid.appendChild(card);
  });

  document.getElementById("eventCount").innerText = `You have ${events.length} upcoming event${events.length !== 1 ? "s" : ""}`;
  lucide.createIcons();
}

/* INIT */
document.addEventListener("DOMContentLoaded", () => {
  eventGrid = document.getElementById("eventGrid");
  modal = document.getElementById("modal");
  emptyState = document.getElementById("emptyState");

  renderEvents();
  lucide.createIcons();
});