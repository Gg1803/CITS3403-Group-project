const invitationGrid = document.getElementById("invitationGrid");
const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const statusFilter = document.getElementById("statusFilter");
const dateFilter = document.getElementById("dateFilter");
const sortFilter = document.getElementById("sortFilter");

const totalInvitations = document.getElementById("totalInvitations");
const joinedCount = document.getElementById("joinedCount");
const pendingCount = document.getElementById("pendingCount");
const declinedCount = document.getElementById("declinedCount");
const resultsCount = document.getElementById("resultsCount");
const thisWeekCount = document.getElementById("thisWeekCount");
const needResponseCount = document.getElementById("needResponseCount");

const toast = document.getElementById("toast");
const detailModal = document.getElementById("detailModal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalJoinBtn = document.getElementById("modalJoinBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const realDetailLink = document.getElementById("realDetailLink");

const tabButtons = document.querySelectorAll(".tab-btn");

let activeTab = "all";
let selectedModalEventId = null;

let invitations = [
  {
    id: 1,
    type: "Social",
    name: "Beach Day Bonanza",
    description: "Enjoy a fun beach day with games, snacks, and relaxed group activities.",
    date: "2026-03-25",
    location: "Santa Monica Beach",
    status: "pending",
    note: "Respond before Wednesday to confirm final headcount.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 2,
    type: "Workshop",
    name: "Frontend Study Jam",
    description: "Review UI pages, discuss pull requests, and align styling across the project.",
    date: "2026-03-28",
    location: "UWA Library",
    status: "pending",
    note: "Bring your laptop and latest screenshots.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 3,
    type: "Sports",
    name: "Friday Futsal Meetup",
    description: "Join a friendly futsal session and meet other students after class.",
    date: "2026-03-30",
    location: "UWA Sports Centre",
    status: "joined",
    note: "You have already joined this event.",
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 4,
    type: "Study",
    name: "Group Project Planning",
    description: "Plan tasks, issues, code reviews, and upcoming frontend pages.",
    date: "2026-04-02",
    location: "Online",
    status: "pending",
    note: "Check the GitHub issue list before the meeting.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 5,
    type: "Social",
    name: "Movie Night Hangout",
    description: "Casual evening with snacks, movie voting, and team relaxation time.",
    date: "2026-04-04",
    location: "Student Lounge",
    status: "declined",
    note: "You declined this event earlier.",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 6,
    type: "Workshop",
    name: "Resume Review Session",
    description: "Improve resume wording, internship highlights, and project descriptions.",
    date: "2026-04-06",
    location: "Career Hub",
    status: "pending",
    note: "Bring your latest resume draft for review.",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80"
  }
];

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function updateSummary(filteredItems = invitations) {
  totalInvitations.textContent = invitations.length;
  joinedCount.textContent = invitations.filter(item => item.status === "joined").length;
  pendingCount.textContent = invitations.filter(item => item.status === "pending").length;
  declinedCount.textContent = invitations.filter(item => item.status === "declined").length;
  resultsCount.textContent = filteredItems.length;

  const weekThreshold = new Date("2026-04-07");
  thisWeekCount.textContent = invitations.filter(item => new Date(item.date) <= weekThreshold).length;
  needResponseCount.textContent = invitations.filter(item => item.status === "pending").length;
}

function getStatusClass(status) {
  if (status === "joined") return "status-joined";
  if (status === "declined") return "status-declined";
  return "status-pending";
}

function openModalForEvent(item) {
  selectedModalEventId = item.id;
  modalTitle.textContent = item.name;

  modalBody.innerHTML = `
    <img src="${item.image}" alt="${item.name}" class="card-banner" />
    <div class="modal-meta-box"><strong>Type:</strong> ${item.type}</div>
    <div class="modal-meta-box"><strong>Date:</strong> ${formatDate(item.date)}</div>
    <div class="modal-meta-box"><strong>Location:</strong> ${item.location}</div>
    <div class="modal-meta-box"><strong>Status:</strong> ${item.status}</div>
    <div class="modal-meta-box"><strong>Description:</strong> ${item.description}</div>
    <div class="modal-meta-box"><strong>Note:</strong> ${item.note}</div>
  `;

  modalJoinBtn.textContent = item.status === "joined" ? "Joined" : "Join";
  modalJoinBtn.disabled = item.status === "joined";
  realDetailLink.href = `event_details.html?id=${item.id}`;

  detailModal.classList.remove("hidden");
}

function closeModal() {
  detailModal.classList.add("hidden");
}

function applyFilters() {
  const searchValue = searchInput.value.trim().toLowerCase();
  const selectedType = typeFilter.value;
  const selectedStatus = statusFilter.value;
  const selectedDate = dateFilter.value;
  const selectedSort = sortFilter.value;

  let filtered = invitations.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchValue) ||
      item.location.toLowerCase().includes(searchValue) ||
      item.description.toLowerCase().includes(searchValue);

    const matchesType = selectedType === "all" || item.type === selectedType;
    const matchesStatusDropdown = selectedStatus === "all" || item.status === selectedStatus;
    const matchesTab = activeTab === "all" || item.status === activeTab;
    const matchesDate = !selectedDate || item.date >= selectedDate;

    return matchesSearch && matchesType && matchesStatusDropdown && matchesTab && matchesDate;
  });

  filtered.sort((a, b) => {
    if (selectedSort === "oldest") return new Date(a.date) - new Date(b.date);
    if (selectedSort === "name-asc") return a.name.localeCompare(b.name);
    if (selectedSort === "name-desc") return b.name.localeCompare(a.name);
    return new Date(b.date) - new Date(a.date);
  });

  return filtered;
}

function renderInvitations() {
  const filteredInvitations = applyFilters();
  invitationGrid.innerHTML = "";

  if (filteredInvitations.length === 0) {
    invitationGrid.innerHTML = `
      <div class="empty-state">
        No invitations found for your current search or filter.
      </div>
    `;
    updateSummary(filteredInvitations);
    return;
  }

  filteredInvitations.forEach(item => {
    const card = document.createElement("article");
    card.className = "card invitation-card";

    const joined = item.status === "joined";
    const declined = item.status === "declined";

    card.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="card-banner" />

      <div class="card-content">
        <div class="card-top">
          <span class="event-type">🏷 ${item.type}</span>
          <span class="status-badge ${getStatusClass(item.status)}">
            ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </span>
        </div>

        <h2 class="event-name">${item.name}</h2>

        <p class="event-description">${item.description}</p>

        <div class="meta-list">
          <div class="meta-row">
            <span class="meta-label">📅 Date</span>
            <span class="meta-value">${formatDate(item.date)}</span>
          </div>

          <div class="meta-row">
            <span class="meta-label">📍 Location</span>
            <span class="meta-value">${item.location}</span>
          </div>

          <div class="meta-row">
            <span class="meta-label">📝 Type</span>
            <span class="meta-value">${item.type}</span>
          </div>
        </div>

        <div class="card-footer-note">${item.note}</div>

        <div class="card-actions">
          <a class="secondary-btn" href="event_details.html?id=${item.id}">View Detail</a>
          <button class="action-btn join-btn" type="button">${joined ? "Joined" : "Accept"}</button>
          <button class="secondary-btn decline-btn" type="button">${declined ? "Declined" : "Decline"}</button>
          <button class="secondary-btn quick-view-btn" type="button">Quick View</button>
        </div>
      </div>
    `;

    const joinBtn = card.querySelector(".join-btn");
    const declineBtn = card.querySelector(".decline-btn");
    const quickViewBtn = card.querySelector(".quick-view-btn");

    if (joined) {
      joinBtn.disabled = true;
    }

    if (declined) {
      declineBtn.disabled = true;
    }

    joinBtn.addEventListener("click", () => {
      if (item.status !== "joined") {
        item.status = "joined";
        item.note = "You have accepted this invitation.";
        renderInvitations();
        showToast("Invitation joined successfully");
      }
    });

    declineBtn.addEventListener("click", () => {
      if (item.status !== "declined") {
        item.status = "declined";
        item.note = "You declined this invitation.";
        renderInvitations();
        showToast("Invitation declined");
      }
    });

    quickViewBtn.addEventListener("click", () => {
      openModalForEvent(item);
    });

    invitationGrid.appendChild(card);
  });

  updateSummary(filteredInvitations);
}

tabButtons.forEach(button => {
  button.addEventListener("click", () => {
    tabButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    activeTab = button.dataset.tab;
    renderInvitations();
  });
});

modalJoinBtn.addEventListener("click", () => {
  const selected = invitations.find(item => item.id === selectedModalEventId);
  if (!selected || selected.status === "joined") return;

  selected.status = "joined";
  selected.note = "You have accepted this invitation.";
  closeModal();
  renderInvitations();
  showToast("Invitation joined successfully");
});

closeModalBtn.addEventListener("click", closeModal);
detailModal.addEventListener("click", (e) => {
  if (e.target === detailModal) closeModal();
});

searchInput.addEventListener("input", renderInvitations);
typeFilter.addEventListener("change", renderInvitations);
statusFilter.addEventListener("change", renderInvitations);
dateFilter.addEventListener("change", renderInvitations);
sortFilter.addEventListener("change", renderInvitations);

renderInvitations();