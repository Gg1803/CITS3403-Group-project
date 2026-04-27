/* Navigation */
function goTo(page) { window.location.href = page; }

/* DOM refs */
const invitationGrid     = document.getElementById("invitationGrid");
const searchInput        = document.getElementById("searchInput");
const typeFilter         = document.getElementById("typeFilter");
const dateFilter         = document.getElementById("dateFilter");
const sortFilter         = document.getElementById("sortFilter");

const totalInvitations   = document.getElementById("totalInvitations");
const joinedCount        = document.getElementById("joinedCount");
const pendingCount       = document.getElementById("pendingCount");
const declinedCount      = document.getElementById("declinedCount");
const resultsCount       = document.getElementById("resultsCount");
const invitationSubtitle = document.getElementById("invitationSubtitle");

const toast          = document.getElementById("toast");
const detailModal    = document.getElementById("detailModal");
const modalTitle     = document.getElementById("modalTitle");
const modalBody      = document.getElementById("modalBody");
const modalJoinBtn   = document.getElementById("modalJoinBtn");
const closeModalBtn  = document.getElementById("closeModalBtn");
const modalDetailLink = document.getElementById("modalDetailLink");

const tabButtons = document.querySelectorAll(".tab-btn");

let activeTab = "all";
let selectedModalEventId = null;

// Real invitations from backend
let invitations = [];

/* Gradient map (mirrors dashboard exactly) */
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

/* Image map – same as discover page */
const imageMap = {
  "Beach day":      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
  "House party":    "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80",
  "Game night":     "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80",
  "Hiking/Outdoor": "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80",
  "Study session":  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
  "Sport events":   "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
  "Food/dining":    "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=80",
  "Movie night":    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
  "Concert/music":  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
  "Custom":         "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80"
};

/* Helpers */
function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function getGradient(type) {
  return gradientMap[type] || "gradient-dark";
}

function getStatusClass(status) {
  if (status === "accepted") return "status-joined";
  if (status === "declined") return "status-declined";
  return "status-pending";
}

function getStatusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/* Summary */
function updateSummary(filtered) {
  totalInvitations.textContent = invitations.length;
  joinedCount.textContent      = invitations.filter(i => i.status === "accepted").length;
  pendingCount.textContent     = invitations.filter(i => i.status === "pending").length;
  declinedCount.textContent    = invitations.filter(i => i.status === "declined").length;
  resultsCount.textContent     = filtered.length;

  const pending = invitations.filter(i => i.status === "pending").length;
  invitationSubtitle.textContent = pending > 0
    ? `You have ${pending} pending invitation${pending !== 1 ? "s" : ""}`
    : "No pending invitations right now";
}

/* Quick View Modal */
function openModalForEvent(item) {
  selectedModalEventId = item.id;
  modalTitle.textContent = item.name;

  modalBody.innerHTML = `
    <div class="modal-meta-box"><strong>Date:</strong> ${formatDate(item.date)}</div>
    <div class="modal-meta-box"><strong>Location:</strong> ${item.location}</div>
    <div class="modal-meta-box"><strong>Description:</strong> ${item.description}</div>
  `;

  modalJoinBtn.textContent = item.status === "accepted" ? "Accepted" : "Accept";
  modalJoinBtn.disabled    = item.status === "accepted" || item.status === "declined";
  modalDetailLink.href = `/event-details/${item.eventId}`;

  detailModal.classList.remove("hidden");
}

function closeModal() { detailModal.classList.add("hidden"); }

/* Filters */
function applyFilters() {
  const search  = searchInput.value.trim().toLowerCase();
  const selType = typeFilter.value;
  const selDate = dateFilter.value;
  const selSort = sortFilter.value;

  let filtered = invitations.filter(item => {
    const matchSearch = !search ||
      item.name.toLowerCase().includes(search) ||
      item.location.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search);
    const matchType = selType === "all" || item.type === selType;
    const matchTab  = activeTab === "all" || item.status === activeTab;
    const matchDate = !selDate || item.date >= selDate;
    return matchSearch && matchType && matchTab && matchDate;
  });

  filtered.sort((a, b) => {
    if (selSort === "oldest")    return new Date(a.date) - new Date(b.date);
    if (selSort === "name-asc")  return a.name.localeCompare(b.name);
    if (selSort === "name-desc") return b.name.localeCompare(a.name);
    return new Date(b.date) - new Date(a.date);
  });

  return filtered;
}

/* Render */
function renderInvitations() {
  const filtered = applyFilters();
  invitationGrid.innerHTML = "";

  if (filtered.length === 0) {
    invitationGrid.innerHTML = `<div class="empty-state">No invitations match your current filter.</div>`;
    updateSummary(filtered);
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement("article");
    card.className = "invitation-card";

    const isAccepted = item.status === "accepted";
    const isDeclined = item.status === "declined";

    card.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="card-banner" />
      <div class="card-meta">
        <span class="type-tag ${getGradient(item.type)}">${item.type}</span>
        <span class="status-tag ${getStatusClass(item.status)}">${getStatusLabel(item.status)}</span>
      </div>
      <div class="card-content">
        <div class="card-title">${item.name}</div>
        <p><i data-lucide="calendar"></i> ${formatDate(item.date)}</p>
        <p><i data-lucide="map-pin"></i> ${item.location}</p>
      </div>
      <div class="card-footer">
        <div class="footer-row-top">
          <button class="btn-quick-view"   type="button">Quick View</button>
          <button class="btn-view-details" type="button">View Details</button>
        </div>
        <div class="footer-row-bottom">
          <button class="btn-accept"  type="button" ${isAccepted || isDeclined ? "disabled" : ""}>${isAccepted ? "Accepted" : "Accept"}</button>
          <button class="btn-decline" type="button" ${isAccepted || isDeclined ? "disabled" : ""}>${isDeclined ? "Declined" : "Decline"}</button>
        </div>
      </div>
    `;

    const quickViewBtn  = card.querySelector(".btn-quick-view");
    const viewDetailBtn = card.querySelector(".btn-view-details");
    const acceptBtn     = card.querySelector(".btn-accept");
    const declineBtn    = card.querySelector(".btn-decline");

    quickViewBtn.addEventListener("click", () => openModalForEvent(item));

    viewDetailBtn.addEventListener("click", () => {
      goTo(`/event-details/${item.eventId}`);
    });

    acceptBtn.addEventListener("click", async () => {
      const res = await fetch(`/invitations/${item.id}/accept`, { method: "POST" });
      const data = await res.json();
      if (data.error) {
        showToast(data.error);
        return;
      }
      item.status = "accepted";
      renderInvitations();
      showToast("Invitation accepted!");
    });

    declineBtn.addEventListener("click", async () => {
      if (item.status === "declined") return;
      const res = await fetch(`/invitations/${item.id}/decline`, { method: "POST" });
      const data = await res.json();
      if (data.error) {
        showToast(data.error);
        return;
      }
      item.status = "declined";
      renderInvitations();
      showToast("Invitation declined.");
    });

    invitationGrid.appendChild(card);
  });

  updateSummary(filtered);
  lucide.createIcons();
}

/* Modal listeners */
modalJoinBtn.addEventListener("click", async () => {
  const selected = invitations.find(i => i.id === selectedModalEventId);
  if (!selected || selected.status === "accepted" || selected.status === "declined") return;

  const res = await fetch(`/invitations/${selected.id}/accept`, { method: "POST" });
  const data = await res.json();
  if (data.error) {
    showToast(data.error);
    return;
  }
  selected.status = "accepted";
  closeModal();
  renderInvitations();
  showToast("Invitation accepted!");
});

closeModalBtn.addEventListener("click", closeModal);
detailModal.addEventListener("click", e => { if (e.target === detailModal) closeModal(); });

/* Tab listeners */
tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeTab = btn.dataset.tab;
    renderInvitations();
  });
});

/* Filter listeners */
searchInput.addEventListener("input",  renderInvitations);
typeFilter.addEventListener("change",  renderInvitations);
dateFilter.addEventListener("change",  renderInvitations);
sortFilter.addEventListener("change",  renderInvitations);

/* Load invitations from backend and map to the format the UI expects */
async function loadInvitations() {
  try {
    const res = await fetch("/invitations/data");
    if (!res.ok) throw new Error("Failed to load invitations");
    const data = await res.json();

    // Map backend data to the format the invitation page expects
    invitations = data.map(inv => ({
      id:          inv.id,                              // invitation id (for accept/decline API)
      eventId:     inv.event_id,                        // event id (for navigation)
      type:        inv.event_type || "Custom",
      name:        inv.event_title,
      description: inv.description || "No description provided.",
      date:        inv.event_date,
      location:    inv.location || "N/A",
      status:      inv.status,                          // "pending", "accepted", "declined"
      image:       imageMap[inv.event_type] || imageMap["Custom"]  // match discover page images
    }));
  } catch (err) {
    console.error(err);
    invitations = [];
  }
  renderInvitations();
  lucide.createIcons();
}

/* Init */
loadInvitations();