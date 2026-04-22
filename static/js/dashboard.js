const fallbackImages = {
  "Beach day": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
  "House party": "https://images.unsplash.com/photo-1517457373958-b7bdd4587205",
  "Game night": "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09",
  "Hiking/Outdoor": "https://images.unsplash.com/photo-1551632811-561732d1e306",
  "Study session": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
  "Sport events": "https://images.unsplash.com/photo-1574629810360-7efbbe195018",
  "Food/dining": "https://images.unsplash.com/photo-1528605248644-14dd04022da1",
  "Movie night": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba",
  "Concert/music": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745",
  "Custom": "https://images.unsplash.com/photo-1521737604893-d14cc237f11d"
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
    body: JSON.stringify({
      title,
      type,
      customType: custom,
      date,
      location,
      description: desc,
      is_public: isPublic
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
  const descHTML = e.description
    ? `<p><i data-lucide="align-left"></i> ${e.description}</p>` : "";

  const grid = document.getElementById("eventGrid");

  // Remove "no events" message if present
  const empty = grid.querySelector("p");
  if (empty) empty.remove();

  // Create card as element so we can attach listener properly
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="card-image-wrap">
      <img class="card-image"
          src="${fallbackImages[e.event_type] || fallbackImages["Custom"]}"
          alt="${e.title}">
    </div>

    <div class="card-content">
      <div class="card-top-row">
        <h3 class="card-title-text">${e.title}</h3>

        <span class="card-badge ${e.is_public ? "public" : "private"}">
          ${e.is_public ? "Public" : "Private"}
        </span>
      </div>

      <p><i data-lucide="calendar"></i> ${e.event_date}</p>
      <p><i data-lucide="map-pin"></i> ${e.location}</p>
      <p><i data-lucide="users"></i> ${e.participants} participants</p>
      ${descHTML}
    </div>

    <div class="card-footer">
      <a class="view-btn" href="/event-details/${e.id}">View Details</a>
      <button class="delete-btn" data-event-id="${e.id}">Delete</button>
    </div>
  `;
  grid.appendChild(card);

  // Update event count
  const countEl = document.querySelector(".header p");
  const total   = grid.querySelectorAll(".card").length;
  countEl.innerText = `You have ${total} upcoming event${total !== 1 ? "s" : ""}`;

  lucide.createIcons();
}

async function deleteEvent(eventId, btn) {
  if (!confirm("Are you sure you want to delete this event?")) return;
  const res  = await fetch(`/event/${eventId}`, { method: "DELETE" });
  const data = await res.json();
  if (data.success) {
    const card = btn.closest(".card");
    card.remove();
    const grid    = document.getElementById("eventGrid");
    const total   = grid.querySelectorAll(".card").length;
    const countEl = document.querySelector(".header p");
    countEl.innerText = `You have ${total} upcoming event${total !== 1 ? "s" : ""}`;
    if (total === 0) {
      grid.innerHTML = `<p style="color:#9ca3af;">No events yet. Create your first one!</p>`;
    }
  } else {
    alert("Failed to delete event.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  modal = document.getElementById("modal");

  // Event delegation — handles delete for ALL cards (Jinja-rendered + JS-added)
  document.getElementById("eventGrid").addEventListener("click", e => {
    const btn = e.target.closest(".delete-btn");
    if (btn) deleteEvent(btn.dataset.eventId, btn);
  });

  lucide.createIcons();
});