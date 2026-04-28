// Get the event ID from the body data attribute
const EVENT_ID = document.body.dataset.eventId;

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

/* ── Modal helpers ────────────────────────────────────────────── */
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

/* ── TASKS ────────────────────────────────────────────────────── */
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
    item.innerHTML = `
      <div class="item-main">
        <div class="item-title">${task.name}</div>
        <div class="item-subtitle">Assigned to: ${task.assigned_to || "Not assigned"}</div>
      </div>
      <div class="item-actions">
        <button class="icon-btn task-complete" type="button">${task.completed ? "Undo" : "Done"}</button>
        <button class="remove-btn task-delete" type="button">Remove</button>
      </div>
    `;
    item.querySelector(".task-complete").addEventListener("click", async () => {
      await fetch(`/tasks/${task.id}/toggle`, { method: "POST" });
      loadTasks();
    });
    item.querySelector(".task-delete").addEventListener("click", async () => {
      await fetch(`/tasks/${task.id}`, { method: "DELETE" });
      loadTasks();
    });
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

/* ── TIMELINE ─────────────────────────────────────────────────── */
function renderTimeline(steps) {
  timelineList.innerHTML = "";
  if (steps.length === 0) {
    timelineList.innerHTML = `<p class="empty-state">No timeline steps yet.</p>`;
    return;
  }
  steps.forEach((step, index) => {
    const item = document.createElement("div");
    item.className = "timeline-item";
    item.innerHTML = `
      <div class="timeline-circle">${index + 1}</div>
      <div class="timeline-text">${step.step}</div>
      <div class="item-actions">
        <button class="remove-btn timeline-delete" type="button">Remove</button>
      </div>
    `;
    item.querySelector(".timeline-delete").addEventListener("click", async () => {
      await fetch(`/timeline/${step.id}`, { method: "DELETE" });
      loadTimeline();
    });
    timelineList.appendChild(item);
  });
}

async function loadTimeline() {
  const res   = await fetch(`/event/${EVENT_ID}/timeline`);
  const steps = await res.json();
  renderTimeline(steps);
}

addTimelineBtn.addEventListener("click", async () => {
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

/* ── PARTICIPANTS ─────────────────────────────────────────────── */
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
    item.innerHTML = `
      <div class="item-main">
        <div class="item-title">${p.username}</div>
        <div class="item-subtitle">Participant</div>
      </div>
      <div class="item-actions">
        <button class="remove-btn participant-delete" type="button">Remove</button>
      </div>
    `;
    item.querySelector(".participant-delete").addEventListener("click", async () => {
      await fetch(`/participants/${p.id}`, { method: "DELETE" });
      loadParticipants();
    });
    participantList.appendChild(item);
  });
}

async function loadParticipants() {
  const res          = await fetch(`/event/${EVENT_ID}/participants`);
  const participants = await res.json();
  renderParticipants(participants);
}

addParticipantBtn.addEventListener("click", async () => {
  const email = participantEmailInput.value.trim();
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
  closeModal(participantModal);
  alert("Invitation sent. The user will join this event after accepting it.");
});

/* ── POLLS ────────────────────────────────────────────────────── */
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
    el.innerHTML = `
      <div class="poll-option-top">
        <span class="poll-option-name">${option.text}</span>
        <span class="poll-option-votes">${option.votes} votes · ${actualPct}%</span>
      </div>
      <div class="poll-bar">
        <div class="poll-fill color-vote" style="width:${visiblePct}%"></div>
      </div>
      <button class="vote-btn vote-option" type="button"
              data-poll-id="${poll.id}" data-option-id="${option.id}">Vote</button>
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
    alert("Failed to save.");
  }
}

/* Init - load everything from DB on page load */
document.addEventListener("DOMContentLoaded", () => {
  updateTopInfo();
  loadTasks();
  loadTimeline();
  loadParticipants();
  loadPolls();
  lucide.createIcons();
});