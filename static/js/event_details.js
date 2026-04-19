/* event_details.js */

const eventTitleInput        = document.getElementById("eventTitle");
const eventTypeInput         = document.getElementById("eventType");
const eventDateInput         = document.getElementById("eventDate");
const eventLocationInput     = document.getElementById("eventLocation");

const displayEventTitle       = document.getElementById("displayEventTitle");
const displayEventDate        = document.getElementById("displayEventDate");
const displayEventLocation    = document.getElementById("displayEventLocation");
const displayParticipantCount = document.getElementById("displayParticipantCount");

const taskList        = document.getElementById("taskList");
const timelineList    = document.getElementById("timelineList");
const participantList = document.getElementById("participantList");
const pollContainer   = document.getElementById("pollContainer");
const pollFooter      = document.getElementById("pollFooter");

const taskProgressCount = document.getElementById("taskProgressCount");
const taskProgressFill  = document.getElementById("taskProgressFill");

const openTaskModalBtn        = document.getElementById("openTaskModal");
const openTimelineModalBtn    = document.getElementById("openTimelineModal");
const openParticipantModalBtn = document.getElementById("openParticipantModal");
const openPollModalBtn        = document.getElementById("openPollModal");

const taskModal        = document.getElementById("taskModal");
const timelineModal    = document.getElementById("timelineModal");
const participantModal = document.getElementById("participantModal");
const pollModal        = document.getElementById("pollModal");

const taskNameInput       = document.getElementById("taskName");
const taskAssignedToInput = document.getElementById("taskAssignedTo");
const addTaskBtn          = document.getElementById("addTaskBtn");

const timelineStepInput = document.getElementById("timelineStep");
const addTimelineBtn    = document.getElementById("addTimelineBtn");

const participantNameInput = document.getElementById("participantName");
const addParticipantBtn    = document.getElementById("addParticipantBtn");

const pollQuestionInput     = document.getElementById("pollQuestion");
const pollOptionsWrapper    = document.getElementById("pollOptionsWrapper");
const addPollOptionFieldBtn = document.getElementById("addPollOptionField");
const createPollBtn         = document.getElementById("createPollBtn");
const prevPollBtn           = document.getElementById("prevPollBtn");
const nextPollBtn           = document.getElementById("nextPollBtn");

let tasks         = [];
let timelineSteps = [];
let participants  = [];
let polls         = [];
let currentPollIndex = 0;
let votedOptions = new Set(); // tracks "pollIndex-optionIndex" keys

/* Navigation helper */
function goTo(page) { window.location.href = page; }

/* Date formatter */
function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/* Gradient map (mirrors dashboard) */
const typeGradients = {
  "beach":    "gradient-teal",
  "birthday": "gradient-pink",
  "formal":   "gradient-dark",
  "festival": "gradient-red",
  "sports":   "gradient-green",
  "study":    "gradient-purple"
};

/* Theme: apply gradient class to hero card */
function updateTheme() {
  const heroCard = document.querySelector(".hero-card");
  // Remove any existing gradient class
  Object.values(typeGradients).forEach(cls => heroCard.classList.remove(cls));
  const gradClass = typeGradients[eventTypeInput.value] || "gradient-teal";
  heroCard.classList.add(gradClass);
}

/* Hero card live update */
function updateTopInfo() {
  displayEventTitle.textContent    = eventTitleInput.value.trim() || "Untitled Event";
  displayEventDate.textContent     = formatDate(eventDateInput.value);
  displayEventLocation.textContent = eventLocationInput.value.trim() || "-";
  displayParticipantCount.textContent =
    `${participants.length} participant${participants.length !== 1 ? "s" : ""}`;
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
  overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(overlay); });
});

/* Task Board */
function updateTaskProgress() {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  taskProgressCount.textContent = `${completed}/${total}`;
  taskProgressFill.style.width  = `${total === 0 ? 0 : (completed / total) * 100}%`;
}

function renderTasks() {
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    taskList.innerHTML = `<p class="empty-state">No tasks added yet.</p>`;
    updateTaskProgress();
    return;
  }

  tasks.forEach((task, index) => {
    const item = document.createElement("div");
    item.className = `item-card ${task.completed ? "completed-task" : ""}`;
    item.innerHTML = `
      <div class="item-main">
        <div class="item-title">${task.name}</div>
        <div class="item-subtitle">Assigned to: ${task.assignedTo || "Not assigned"}</div>
      </div>
      <div class="item-actions">
        <button class="icon-btn task-complete" type="button">${task.completed ? "Undo" : "Done"}</button>
        <button class="remove-btn task-delete"  type="button">Remove</button>
      </div>
    `;
    item.querySelector(".task-complete").addEventListener("click", () => {
      tasks[index].completed = !tasks[index].completed;
      renderTasks();
    });
    item.querySelector(".task-delete").addEventListener("click", () => {
      tasks.splice(index, 1);
      renderTasks();
    });
    taskList.appendChild(item);
  });

  updateTaskProgress();
}

addTaskBtn.addEventListener("click", () => {
  const name       = taskNameInput.value.trim();
  const assignedTo = taskAssignedToInput.value.trim();
  if (!name) return;
  tasks.push({ name, assignedTo, completed: false });
  taskNameInput.value       = "";
  taskAssignedToInput.value = "";
  closeModal(taskModal);
  renderTasks();
});

/* Timeline */
function renderTimeline() {
  timelineList.innerHTML = "";

  if (timelineSteps.length === 0) {
    timelineList.innerHTML = `<p class="empty-state">No timeline steps yet.</p>`;
    return;
  }

  timelineSteps.forEach((step, index) => {
    const item = document.createElement("div");
    item.className = "timeline-item";
    item.innerHTML = `
      <div class="timeline-circle">${index + 1}</div>
      <div class="timeline-text">${step}</div>
      <div class="item-actions">
        <button class="remove-btn timeline-delete" type="button">Remove</button>
      </div>
    `;
    item.querySelector(".timeline-delete").addEventListener("click", () => {
      timelineSteps.splice(index, 1);
      renderTimeline();
    });
    timelineList.appendChild(item);
  });
}

addTimelineBtn.addEventListener("click", () => {
  const step = timelineStepInput.value.trim();
  if (!step) return;
  timelineSteps.push(step);
  timelineStepInput.value = "";
  closeModal(timelineModal);
  renderTimeline();
});

/* Participants */
function renderParticipants() {
  participantList.innerHTML = "";

  if (participants.length === 0) {
    participantList.innerHTML = `<p class="empty-state">No participants invited yet.</p>`;
    updateTopInfo();
    return;
  }

  participants.forEach((participant, index) => {
    const item = document.createElement("div");
    item.className = "item-card";
    item.innerHTML = `
      <div class="item-main">
        <div class="item-title">${participant}</div>
        <div class="item-subtitle">Invited participant</div>
      </div>
      <div class="item-actions">
        <button class="remove-btn participant-delete" type="button">Remove</button>
      </div>
    `;
    item.querySelector(".participant-delete").addEventListener("click", () => {
      participants.splice(index, 1);
      renderParticipants();
    });
    participantList.appendChild(item);
  });

  updateTopInfo();
}

addParticipantBtn.addEventListener("click", () => {
  const name = participantNameInput.value.trim();
  if (!name) return;
  participants.push(name);
  participantNameInput.value = "";
  closeModal(participantModal);
  renderParticipants();
});

/* Poll */
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
  const el = document.createElement("div");
  el.className = "field-group poll-option-field";
  el.innerHTML = `
    <label>Option ${count}</label>
    <input type="text" class="poll-option-input" placeholder="Option ${count}"/>
  `;
  pollOptionsWrapper.appendChild(el);
});

function renderPoll() {
  pollContainer.innerHTML = "";

  if (polls.length === 0) {
    pollContainer.innerHTML = `<p class="empty-state">No polls created yet.</p>`;
    pollFooter.textContent = "0/0";
    prevPollBtn.disabled = true;
    nextPollBtn.disabled = true;
    return;
  }

  const poll = polls[currentPollIndex];
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);

  /* Question */
  const qEl = document.createElement("div");
  qEl.className = "poll-question-title";
  qEl.textContent = poll.question;
  pollContainer.appendChild(qEl);

  /* Options sorted by votes descending, original index kept for data mutation */
  const optList = document.createElement("div");
  optList.className = "poll-options-list";

  const sorted = poll.options
    .map((option, originalIndex) => ({ option, originalIndex }))
    .sort((a, b) => b.option.votes - a.option.votes);

  sorted.forEach(({ option, originalIndex }, sortedIndex) => {
    const actualPct  = totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100);
    const visiblePct = totalVotes === 0 ? 12 : Math.max(actualPct, 6);
    const colorClass = `color-vote`;
    const voteKey    = `${currentPollIndex}-${originalIndex}`;
    const hasVoted   = votedOptions.has(voteKey);

    const el = document.createElement("div");
    el.className = "poll-option-display";
    el.innerHTML = `
      <div class="poll-option-top">
        <span class="poll-option-name">${option.name}</span>
        <span class="poll-option-votes">${option.votes} votes · ${actualPct}%</span>
      </div>
      <div class="poll-bar">
        <div class="poll-fill ${colorClass}" style="width:${visiblePct}%"></div>
      </div>
      <button class="vote-btn" type="button">${hasVoted ? "Voted" : "Vote"}</button>
    `;

    const voteBtn = el.querySelector(".vote-btn");
    if (hasVoted) {
      voteBtn.disabled = true;
    } else {
      voteBtn.addEventListener("click", () => {
        polls[currentPollIndex].options[originalIndex].votes += 1;
        votedOptions.add(voteKey);
        renderPoll();
      });
    }

    optList.appendChild(el);
  });

  pollContainer.appendChild(optList);

  pollFooter.textContent = `${currentPollIndex + 1}/${polls.length}`;
  prevPollBtn.disabled   = currentPollIndex === 0;
  nextPollBtn.disabled   = currentPollIndex === polls.length - 1;
}

createPollBtn.addEventListener("click", () => {
  const question = pollQuestionInput.value.trim();
  const options  = Array.from(document.querySelectorAll(".poll-option-input"))
    .map(i => i.value.trim())
    .filter(Boolean)
    .map(name => ({ name, votes: 0 }));

  if (!question || options.length < 2) {
    alert("Please enter a question and at least 2 options.");
    return;
  }

  polls.push({ question, options });
  currentPollIndex = polls.length - 1;
  resetPollForm();
  closeModal(pollModal);
  renderPoll();
});

prevPollBtn.addEventListener("click", () => {
  if (currentPollIndex > 0) { currentPollIndex--; renderPoll(); }
});
nextPollBtn.addEventListener("click", () => {
  if (currentPollIndex < polls.length - 1) { currentPollIndex++; renderPoll(); }
});

/* Live edit listeners */
eventTitleInput.addEventListener("input",    updateTopInfo);
eventTypeInput.addEventListener("change",    updateTopInfo);
eventDateInput.addEventListener("input",     updateTopInfo);
eventLocationInput.addEventListener("input", updateTopInfo);

/* Init  */
updateTopInfo();
renderTasks();
renderTimeline();
renderParticipants();
renderPoll();
lucide.createIcons();