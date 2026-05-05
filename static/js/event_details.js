// Get the event ID from the body data attribute
const EVENT_ID = document.body.dataset.eventId;
const IS_PUBLIC = document.body.dataset.isPublic === "true";
const CURRENT_ROLE = document.body.dataset.currentRole || "";
const CAN_EDIT = document.body.dataset.canEdit === "true";
const CAN_MANAGE_PARTICIPANTS = document.body.dataset.canManageParticipants === "true";
const CAN_ASSIGN_ROLES = document.body.dataset.canAssignRoles === "true";
const CAN_VOTE = document.body.dataset.canVote === "true";

// DOM refs (unchanged)
const eventTitleInput        = document.getElementById("eventTitle");
const eventTypeInput         = document.getElementById("eventType");
const eventDateInput         = document.getElementById("eventDate");
const eventLocationInput     = document.getElementById("eventLocation");
const eventDescriptionInput = document.getElementById("eventDescription");
const eventVisibilityInput  = document.getElementById("eventVisibility");
const displayEventTitle      = document.getElementById("displayEventTitle");
const displayEventDate       = document.getElementById("displayEventDate");
const displayEventLocation   = document.getElementById("displayEventLocation");
const displayParticipantCount = document.getElementById("displayParticipantCount");
const taskList               = document.getElementById("taskList");
const timelineList           = document.getElementById("timelineList");
const participantList        = document.getElementById("participantList");
const pollContainer          = document.getElementById("pollContainer");
const pollFooter             = document.getElementById("pollFooter");
const taskProgressCount      = document.getElementById("taskProgressCount");
const taskProgressFill       = document.getElementById("taskProgressFill");
const openTaskModalBtn       = document.getElementById("openTaskModal");
const openTimelineModalBtn   = document.getElementById("openTimelineModal");
const openParticipantModalBtn = document.getElementById("openParticipantModal");
const openPollModalBtn       = document.getElementById("openPollModal");
const taskModal              = document.getElementById("taskModal");
const timelineModal          = document.getElementById("timelineModal");
const participantModal       = document.getElementById("participantModal");
const pollModal              = document.getElementById("pollModal");
const taskNameInput          = document.getElementById("taskName");
const taskAssignedToInput    = document.getElementById("taskAssignedTo");
const addTaskBtn             = document.getElementById("addTaskBtn");
const timelineStepInput      = document.getElementById("timelineStep");
const addTimelineBtn         = document.getElementById("addTimelineBtn");
const participantEmailInput  = document.getElementById("participantName");
const addParticipantBtn      = document.getElementById("addParticipantBtn");
const pollQuestionInput      = document.getElementById("pollQuestion");
const pollOptionsWrapper     = document.getElementById("pollOptionsWrapper");
const addPollOptionFieldBtn  = document.getElementById("addPollOptionField");
const createPollBtn          = document.getElementById("createPollBtn");
const prevPollBtn            = document.getElementById("prevPollBtn");
const nextPollBtn            = document.getElementById("nextPollBtn");

let polls = [];
let currentPollIndex = 0;

function goTo(page) { window.location.href = page; }

function formatRole(role) {
  if (role === "co_host") return "co-host";
  return role || "participant";
}

function applyPermissionUi() {
  if (!CAN_EDIT) {
    document.querySelector(".edit-strip").classList.add("hidden");
    openTaskModalBtn.classList.add("hidden");
    openTimelineModalBtn.classList.add("hidden");
    openPollModalBtn.classList.add("hidden");
  }

  if (!CAN_MANAGE_PARTICIPANTS) {
    openParticipantModalBtn.classList.add("hidden");
  }
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// Gradients map
const typeGradients = {
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

function updateTheme() {
  const heroCard = document.querySelector(".hero-card");
  Object.values(typeGradients).forEach(cls => heroCard.classList.remove(cls));
  heroCard.classList.add(typeGradients[eventTypeInput.value] || "gradient-teal");
}

function updateTopInfo() {
  displayEventTitle.textContent    = eventTitleInput.value.trim() || "Untitled Event";
  displayEventDate.textContent     = formatDate(eventDateInput.value);
  displayEventLocation.textContent = eventLocationInput.value.trim() || "-";
  updateTheme();
  lucide.createIcons();
}

/* Modal helpers */
function openModal(modal)  { modal.classList.remove("hidden"); }
function closeModal(modal) { modal.classList.add("hidden"); }

openTaskModalBtn.addEventListener("click",        () => openModal(taskModal));
openTimelineModalBtn.addEventListener("click",    () => openModal(timelineModal));
openParticipantModalBtn.addEventListener("click", () => openModal(participantModal));
openPollModalBtn.addEventListener("click",        () => openModal(pollModal));

document.querySelectorAll("[data-close]").forEach(btn => {
  btn.addEventListener("click", () =>
    closeModal(document.getElementById(btn.getAttribute("data-close")))
  );
});

document.querySelectorAll(".modal-overlay").forEach(overlay => {
  overlay.addEventListener("click", e => {
    if (e.target === overlay) closeModal(overlay);
  });
});

/* TASKS */
function updateTaskProgress(tasks) {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  taskProgressCount.textContent = `${completed}/${total}`;
  taskProgressFill.style.width  = `${total === 0 ? 0 : (completed / total) * 100}%`;
}

function renderTasks(tasks) {
  taskList.innerHTML = "";
  if (tasks.length === 0) {
    taskList.innerHTML = `<p class="empty-state">No tasks added yet.</p>`;
    updateTaskProgress([]);
    return;
  }
  tasks.forEach(task => {
    const item = document.createElement("div");
    item.className = `item-card ${task.completed ? "completed-task" : ""}`;
    const taskActions = CAN_EDIT ? `
      <div class="item-actions">
        <button class="icon-btn task-complete" type="button">${task.completed ? "Undo" : "Done"}</button>
        <button class="remove-btn task-delete" type="button">Remove</button>
      </div>
    ` : "";

    item.innerHTML = `
      <div class="item-main">
        <div class="item-title">${task.name}</div>
        <div class="item-subtitle">Assigned to: ${task.assigned_to || "Not assigned"}</div>
      </div>
      ${taskActions}
    `;

    if (CAN_EDIT) {
      item.querySelector(".task-complete").addEventListener("click", async () => {
        await fetch(`/tasks/${task.id}/toggle`, { method: "POST" });
        loadTasks();
      });
      item.querySelector(".task-delete").addEventListener("click", async () => {
        await fetch(`/tasks/${task.id}`, { method: "DELETE" });
        loadTasks();
      });
    }

    taskList.appendChild(item);
  });
  updateTaskProgress(tasks);
}

async function loadTasks() {
  const res   = await fetch(`/event/${EVENT_ID}/tasks`);
  const tasks = await res.json();
  renderTasks(tasks);
}

addTaskBtn.addEventListener("click", async () => {
  if (!CAN_EDIT) return;

  const name       = taskNameInput.value.trim();
  const assignedTo = taskAssignedToInput.value.trim();
  if (!name) return;
  await fetch(`/event/${EVENT_ID}/tasks`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ name, assigned_to: assignedTo })
  });
  taskNameInput.value       = "";
  taskAssignedToInput.value = "";
  closeModal(taskModal);
  loadTasks();
});

/* TIMELINE */
function renderTimeline(steps) {
  timelineList.innerHTML = "";
  if (steps.length === 0) {
    timelineList.innerHTML = `<p class="empty-state">No timeline steps yet.</p>`;
    return;
  }
  steps.forEach((step, index) => {
    const item = document.createElement("div");
    item.className = "timeline-item";
    const timelineActions = CAN_EDIT ? `
      <div class="item-actions">
        <button class="remove-btn timeline-delete" type="button">Remove</button>
      </div>
    ` : "";

    item.innerHTML = `
      <div class="timeline-circle">${index + 1}</div>
      <div class="timeline-text">${step.step}</div>
      ${timelineActions}
    `;

    if (CAN_EDIT) {
      item.querySelector(".timeline-delete").addEventListener("click", async () => {
        await fetch(`/timeline/${step.id}`, { method: "DELETE" });
        loadTimeline();
      });
    }

    timelineList.appendChild(item);
  });
}

async function loadTimeline() {
  const res   = await fetch(`/event/${EVENT_ID}/timeline`);
  const steps = await res.json();
  renderTimeline(steps);
}

addTimelineBtn.addEventListener("click", async () => {
  if (!CAN_EDIT) return;

  const step = timelineStepInput.value.trim();
  if (!step) return;
  await fetch(`/event/${EVENT_ID}/timeline`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ step })
  });
  timelineStepInput.value = "";
  closeModal(timelineModal);
  loadTimeline();
});

/* PARTICIPANTS */
function renderParticipants(participants) {
  participantList.innerHTML = "";
  displayParticipantCount.textContent =
    `${participants.length} participant${participants.length !== 1 ? "s" : ""}`;

  if (participants.length === 0) {
    participantList.innerHTML = `<p class="empty-state">No participants have joined yet.</p>`;
    return;
  }
  participants.forEach(p => {
    const item = document.createElement("div");
    item.className = "item-card";
    const roleLabel = formatRole(p.role);
    const roleAction = CAN_ASSIGN_ROLES && p.role !== "host" && IS_PUBLIC ? `
      <button class="icon-btn participant-role" type="button">
        ${p.role === "co_host" ? "Make Participant" : "Make Co-host"}
      </button>
    ` : "";
    const removeAction = CAN_MANAGE_PARTICIPANTS && p.role !== "host" ? `
      <button class="remove-btn participant-delete" type="button">Remove</button>
    ` : "";
    const participantActions = roleAction || removeAction ? `
      <div class="item-actions">
        ${roleAction}
        ${removeAction}
      </div>
    ` : "";

    item.innerHTML = `
      <div class="item-main">
        <div class="item-title">${p.username}</div>
        <div class="item-subtitle">
          <span class="role-tag role-${p.role}">${roleLabel}</span>
        </div>
      </div>
      ${participantActions}
    `;

    const roleBtn = item.querySelector(".participant-role");
    if (roleBtn) {
      roleBtn.addEventListener("click", async () => {
        const role = p.role === "co_host" ? "participant" : "co_host";
        const res = await fetch(`/participants/${p.id}/role`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role })
        });
        const data = await res.json();
        if (data.error) { alert(data.error); return; }
        loadParticipants();
      });
    }

    const deleteBtn = item.querySelector(".participant-delete");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        const res = await fetch(`/participants/${p.id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.error) { alert(data.error); return; }
        loadParticipants();
      });
    }

    participantList.appendChild(item);
  });
}

async function loadParticipants() {
  const res          = await fetch(`/event/${EVENT_ID}/participants`);
  const participants = await res.json();
  renderParticipants(participants);
}

/* User search dropdown */
const searchDropdown = document.getElementById("userSearchDropdown");
let searchTimer = null;
let selectedEmail = "";

participantEmailInput.addEventListener("input", () => {
  const q = participantEmailInput.value.trim();
  selectedEmail = "";  // reset selection on new input
  clearTimeout(searchTimer);

  if (q.length < 2) {
    searchDropdown.style.display = "none";
    searchDropdown.innerHTML = "";
    return;
  }

  searchTimer = setTimeout(async () => {
    const res   = await fetch(`/users/search?q=${encodeURIComponent(q)}`);
    const users = await res.json();

    if (users.length === 0) {
      searchDropdown.style.display = "none";
      return;
    }

    searchDropdown.innerHTML = users.map(u => `
      <div class="search-result-item" data-email="${u.email}"
           style="padding:10px 14px; cursor:pointer; font-size:0.88rem;
                  border-bottom:1px solid #f1f5f9; color:#1f2933;">
        <strong>${u.username}</strong>
        <span style="color:#6b7280; margin-left:6px;">${u.email}</span>
      </div>
    `).join("");

    searchDropdown.style.display = "block";

    searchDropdown.querySelectorAll(".search-result-item").forEach(item => {
      item.addEventListener("mouseenter", () => item.style.background = "#f1f5f9");
      item.addEventListener("mouseleave", () => item.style.background = "");
      item.addEventListener("click", () => {
        selectedEmail = item.dataset.email;
        participantEmailInput.value = selectedEmail;
        searchDropdown.style.display = "none";
      });
    });
  }, 300);
});

// Close dropdown on outside click
document.addEventListener("click", e => {
  if (!participantEmailInput.contains(e.target) && !searchDropdown.contains(e.target)) {
    searchDropdown.style.display = "none";
  }
});

addParticipantBtn.addEventListener("click", async () => {
  if (!CAN_MANAGE_PARTICIPANTS) return;

  const email = (selectedEmail || participantEmailInput.value).trim();
  if (!email) return;

  addParticipantBtn.disabled = true;
  addParticipantBtn.textContent = "Sending...";

  const res  = await fetch(`/event/${EVENT_ID}/invitations`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email })
  });
  const data = await res.json();

  addParticipantBtn.disabled = false;
  addParticipantBtn.textContent = "Invite";

  if (data.error) {
    alert(data.error);
    return;
  }

  participantEmailInput.value = "";
  selectedEmail = "";
  searchDropdown.style.display = "none";
  closeModal(participantModal);
  alert("Invitation sent. The user will join after accepting it.");
});

/* Voters popup in poll */
function showVotersPopup(anchor, voters) {
  // Remove any existing popup
  const existing = document.getElementById("votersPopup");
  if (existing) existing.remove();

  const popup = document.createElement("div");
  popup.id = "votersPopup";
  popup.style.cssText = `
    position: absolute;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 12px 16px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    z-index: 9999;
    min-width: 160px;
    font-family: "Poppins", sans-serif;
    font-size: 0.85rem;
  `;

  if (voters.length === 0) {
    popup.innerHTML = `<p style="color:#9ca3af; margin:0;">No votes yet</p>`;
  } else {
    popup.innerHTML = `
      <p style="font-weight:700; color:#1f2933; margin:0 0 8px;">Voted by</p>
      ${voters.map(v => `
        <div style="display:flex; align-items:center; gap:6px; padding:4px 0; color:#374151;">
          <span style="
            width:24px; height:24px; border-radius:50%;
            background:linear-gradient(135deg,#4f8cff,#6b9dfc);
            display:inline-flex; align-items:center; justify-content:center;
            color:#fff; font-size:0.7rem; font-weight:700; flex-shrink:0;">
            ${v.username.charAt(0).toUpperCase()}
          </span>
          ${v.username}
        </div>`).join("")}
    `;
  }

  // Position near the anchor
  document.body.appendChild(popup);
  const rect = anchor.getBoundingClientRect();
  popup.style.top  = `${rect.bottom + window.scrollY + 6}px`;
  popup.style.left = `${rect.left  + window.scrollX}px`;

  // Close on outside click
  setTimeout(() => {
    document.addEventListener("click", function handler(e) {
      if (!popup.contains(e.target) && e.target !== anchor) {
        popup.remove();
        document.removeEventListener("click", handler);
      }
    });
  }, 0);
}

/* POLLS */
function renderPoll() {
  pollContainer.innerHTML = "";
  if (polls.length === 0) {
    pollContainer.innerHTML = `<p class="empty-state">No polls created yet.</p>`;
    pollFooter.textContent = "0/0";
    prevPollBtn.disabled = true;
    nextPollBtn.disabled = true;
    return;
  }

  const poll       = polls[currentPollIndex];
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);

  const qEl = document.createElement("div");
  qEl.className   = "poll-question-title";
  qEl.textContent = poll.question;
  pollContainer.appendChild(qEl);

  const optList = document.createElement("div");
  optList.className = "poll-options-list";

  const sorted = [...poll.options]
    .sort((a, b) => b.votes - a.votes);

  sorted.forEach(option => {
    const actualPct  = totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100);
    const visiblePct = totalVotes === 0 ? 12 : Math.max(actualPct, 6);

    const el = document.createElement("div");
    el.className = "poll-option-display";
    const voteButton = CAN_VOTE ? `
      <button class="vote-btn vote-option" type="button"
              data-poll-id="${poll.id}" data-option-id="${option.id}">Vote</button>
    ` : "";

    el.innerHTML = `
      <div class="poll-option-top">
        <span class="poll-option-name">${option.text}</span>
        <span class="poll-option-votes voters-trigger"
              data-option-id="${option.id}"
              style="cursor:pointer; text-decoration:underline dotted;"
              title="Click to see who voted">
          ${option.votes} votes · ${actualPct}%
        </span>
      </div>
      <div class="poll-bar">
        <div class="poll-fill color-vote" style="width:${visiblePct}%"></div>
      </div>
      ${voteButton}
    `;
    optList.appendChild(el);
  });

  pollContainer.appendChild(optList);

  // Attach vote button listeners
  optList.querySelectorAll(".vote-option").forEach(btn => {
    btn.addEventListener("click", async () => {
      const pollId   = btn.dataset.pollId;
      const optionId = btn.dataset.optionId;
      const res      = await fetch(`/polls/${pollId}/vote/${optionId}`, { method: "POST" });
      const data     = await res.json();
      if (data.error) { alert(data.error); return; }
      await loadPolls();
    });
  });

  // Voters popup
  optList.querySelectorAll(".voters-trigger").forEach(span => {
    span.addEventListener("click", async () => {
      const optionId = span.dataset.optionId;
      const res      = await fetch(`/poll-option/${optionId}/voters`);
      const data     = await res.json();
      showVotersPopup(span, data);
    });
  });

  pollFooter.textContent = `${currentPollIndex + 1}/${polls.length}`;
  prevPollBtn.disabled   = currentPollIndex === 0;
  nextPollBtn.disabled   = currentPollIndex === polls.length - 1;
}

async function loadPolls() {
  const res = await fetch(`/event/${EVENT_ID}/polls`);
  polls     = await res.json();
  renderPoll();
}

function resetPollForm() {
  pollQuestionInput.value = "";
  pollOptionsWrapper.innerHTML = `
    <div class="field-group poll-option-field">
      <label>Option 1</label>
      <input type="text" class="poll-option-input" placeholder="Option 1"/>
    </div>
    <div class="field-group poll-option-field">
      <label>Option 2</label>
      <input type="text" class="poll-option-input" placeholder="Option 2"/>
    </div>
  `;
}

addPollOptionFieldBtn.addEventListener("click", () => {
  const count = pollOptionsWrapper.querySelectorAll(".poll-option-input").length + 1;
  const el    = document.createElement("div");
  el.className = "field-group poll-option-field";
  el.innerHTML = `
    <label>Option ${count}</label>
    <input type="text" class="poll-option-input" placeholder="Option ${count}"/>
  `;
  pollOptionsWrapper.appendChild(el);
});

createPollBtn.addEventListener("click", async () => {
  if (!CAN_EDIT) return;

  const question = pollQuestionInput.value.trim();
  const options  = Array.from(document.querySelectorAll(".poll-option-input"))
    .map(i => i.value.trim()).filter(Boolean);
  if (!question || options.length < 2) {
    alert("Please enter a question and at least 2 options.");
    return;
  }
  await fetch(`/event/${EVENT_ID}/polls`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ question, options })
  });
  currentPollIndex = polls.length; // will point to new poll after reload
  resetPollForm();
  closeModal(pollModal);
  await loadPolls();
  currentPollIndex = polls.length - 1;
  renderPoll();
});

prevPollBtn.addEventListener("click", () => {
  if (currentPollIndex > 0) { currentPollIndex--; renderPoll(); }
});
nextPollBtn.addEventListener("click", () => {
  if (currentPollIndex < polls.length - 1) { currentPollIndex++; renderPoll(); }
});

/* ── Live edit strip listeners ────────────────────────────────── */
eventTitleInput.addEventListener("input",    updateTopInfo);
eventTypeInput.addEventListener("change",    updateTopInfo);
eventDateInput.addEventListener("input",     updateTopInfo);
eventLocationInput.addEventListener("input", updateTopInfo);

/* ── Save event details ───────────────────────────────────────── */
async function saveEvent() {
  if (!CAN_EDIT) return;

  const res = await fetch(`/event/${EVENT_ID}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: eventTitleInput.value.trim(),
      event_type: eventTypeInput.value,
      date: eventDateInput.value,
      location: eventLocationInput.value.trim(),

      // NEW
      description: eventDescriptionInput.value.trim(),
      is_public: eventVisibilityInput.value === "public"
    })
  });

  const data = await res.json();

  if (data.success) {
    updateTopInfo();
    alert("Event saved!");
  } else {
    alert(data.error || "Failed to save.");
  }
}

/* Init - load everything from DB on page load */
document.addEventListener("DOMContentLoaded", () => {
  applyPermissionUi();
  updateTopInfo();
  loadTasks();
  loadTimeline();
  loadParticipants();
  loadPolls();
  lucide.createIcons();
});