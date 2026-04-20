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

/* Sample data */
let invitations = [
  {
    id: 1,
    type: "Beach day",
    name: "Beach Day Bonanza",
    description: "Enjoy a fun beach day with games, snacks, and relaxed group activities.",
    date: "2026-03-25",
    location: "Cottesloe Beach",
    participants: 14,
    status: "pending",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 2,
    type: "Study session",
    name: "Frontend Study Jam",
    description: "Review UI pages, discuss pull requests, and align styling across the project.",
    date: "2026-03-28",
    location: "UWA Library",
    participants: 8,
    status: "pending",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 3,
    type: "Sport events",
    name: "Friday Futsal Meetup",
    description: "Join a friendly futsal session and meet other students after class.",
    date: "2026-03-30",
    location: "UWA Sports Centre",
    participants: 18,
    status: "joined",
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 4,
    type: "Study session",
    name: "Group Project Planning",
    description: "Plan tasks, issues, code reviews, and upcoming frontend pages.",
    date: "2026-04-02",
    location: "Online",
    participants: 5,
    status: "pending",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 5,
    type: "Movie night",
    name: "Movie Night Hangout",
    description: "Casual evening with snacks, movie voting, and team relaxation time.",
    date: "2026-04-04",
    location: "Student Lounge",
    participants: 12,
    status: "declined",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 6,
    type: "Custom",
    name: "Resume Review Session",
    description: "Improve resume wording, internship highlights, and project descriptions.",
    date: "2026-04-06",
    location: "Career Hub",
    participants: 6,
    status: "pending",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
  }
];

/* Helpers */
function formatDate(dateString) {
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
  if (status === "joined")   return "status-joined";
  if (status === "declined") return "status-declined";
  return "status-pending";
}

function getStatusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/* Summary */
function updateSummary(filtered) {
  totalInvitations.textContent = invitations.length;
  joinedCount.textContent      = invitations.filter(i => i.status === "joined").length;
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
    <div class="modal-meta-box"><strong>Participants:</strong> ${item.participants}</div>
  `;

  modalJoinBtn.textContent = item.status === "joined" ? "Accepted" : "Accept";
  modalJoinBtn.disabled    = item.status === "joined" || item.status === "declined";
  modalDetailLink.href = `/event-details?id=${item.id}`;

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

    const joined  = item.status === "joined";
    const declined = item.status === "declined";

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
          <button class="btn-accept"  type="button" ${joined ? "disabled" : ""}>${joined ? "Accepted" : "Accept"}</button>
          <button class="btn-decline" type="button" ${declined ? "disabled" : ""}>${declined ? "Declined" : "Decline"}</button>
        </div>
      </div>
    `;

    const quickViewBtn  = card.querySelector(".btn-quick-view");
    const viewDetailBtn = card.querySelector(".btn-view-details");
    const acceptBtn     = card.querySelector(".btn-accept");
    const declineBtn    = card.querySelector(".btn-decline");

    quickViewBtn.addEventListener("click", () => openModalForEvent(item));

    viewDetailBtn.addEventListener("click", () => {
      goTo(`/event-details?id=${item.id}`);
    });

    acceptBtn.addEventListener("click", () => {
      item.status = "joined";
      renderInvitations();
      showToast("Invitation accepted!");
    });

    declineBtn.addEventListener("click", () => {
      if (item.status !== "declined") {
        item.status = "declined";
        renderInvitations();
        showToast("Invitation declined.");
      }
    });

    invitationGrid.appendChild(card);
  });

  updateSummary(filtered);
  lucide.createIcons();
}

/* Modal listeners */
modalJoinBtn.addEventListener("click", () => {
  const selected = invitations.find(i => i.id === selectedModalEventId);
  if (!selected || selected.status === "joined") return;
  selected.status = "joined";
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

/* Init */
renderInvitations();
lucide.createIcons();