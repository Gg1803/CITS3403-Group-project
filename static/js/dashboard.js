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

function goTo(page) { window.location.href = page; }

let modal;

function openModal() { modal.style.display = "flex"; }
function closeModal() { modal.style.display = "none"; }

window.onclick = e => { if (e.target === modal) closeModal(); };

function updateCharCount() {
  const desc    = document.getElementById("desc");
  const counter = document.getElementById("charCount");
  const max     = 120;
  const len     = desc.value.length;
  counter.innerText   = `${len}/${max}`;
  counter.style.color = len >= max ? "#ef4444" : "#9ca3af";
  if (len > max) desc.value = desc.value.substring(0, max);
}

function handleTypeChange() {
  const type = document.getElementById("type").value;
  document.getElementById("customType").style.display =
    type === "Custom" ? "block" : "none";
}

function clearForm() {
  document.getElementById("title").value       = "";
  document.getElementById("type").value        = "Beach day";
  document.getElementById("customType").value  = "";
  document.getElementById("customType").style.display = "none";
  document.getElementById("date").value        = "";
  document.getElementById("location").value    = "";
  document.getElementById("desc").value        = "";
  document.getElementById("isPublic").checked  = false;
  document.getElementById("charCount").innerText = "0/120";
}

async function submitEvent() {
  const title    = document.getElementById("title").value.trim();
  const type     = document.getElementById("type").value;
  const custom   = document.getElementById("customType").value.trim();
  const date     = document.getElementById("date").value;
  const location = document.getElementById("location").value.trim();
  const desc     = document.getElementById("desc").value.trim();
  const isPublic = document.getElementById("isPublic").checked;

  if (!title || !date || !location) {
    alert("Please fill all required fields.");
    return;
  }

  const response = await fetch("/create-event", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      title, type, customType: custom,
      date, location, description: desc, is_public: isPublic
    })
  });

  if (!response.ok) {
    alert("Failed to create event. Please try again.");
    return;
  }

  const event = await response.json();
  addEventCard(event);
  closeModal();
  clearForm();
}

function addEventCard(e) {
  const gradient = gradients[e.event_type] || "gradient-dark";
  const descHTML = e.description
    ? `<p><i data-lucide="align-left"></i> ${e.description}</p>` : "";

  const grid = document.getElementById("eventGrid");

  // Remove "no events" message if present
  const empty = grid.querySelector("p");
  if (empty) empty.remove();

  grid.innerHTML += `
    <div class="card">
      <div class="card-header ${gradient}">
        <span class="card-title">${e.title}</span>
        <span class="card-badge">${e.is_public ? "Public" : "Private"}</span>
      </div>
      <div class="card-content">
        <p><i data-lucide="calendar"></i> ${e.event_date}</p>
        <p><i data-lucide="map-pin"></i> ${e.location}</p>
        <p><i data-lucide="users"></i> ${e.participants} participants</p>
        ${descHTML}
      </div>
      <div class="card-footer">
        <a class="view-btn" href="/event-details/${e.id}">View Details</a>
      </div>
    </div>
  `;

  // Update event count in header
  const countEl  = document.querySelector(".header p");
  const total    = grid.querySelectorAll(".card").length;
  countEl.innerText = `You have ${total} upcoming event${total !== 1 ? "s" : ""}`;

  lucide.createIcons();
}

document.addEventListener("DOMContentLoaded", () => {
  modal = document.getElementById("modal");
  lucide.createIcons();
});