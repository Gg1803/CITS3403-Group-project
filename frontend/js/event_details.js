const eventTitleInput = document.getElementById("eventTitle");
const eventTypeInput = document.getElementById("eventType");
const eventDateInput = document.getElementById("eventDate");
const eventLocationInput = document.getElementById("eventLocation");

const displayEventTitle = document.getElementById("displayEventTitle");
const displayEventDate = document.getElementById("displayEventDate");
const displayEventLocation = document.getElementById("displayEventLocation");
const displayParticipantCount = document.getElementById("displayParticipantCount");

const taskList = document.getElementById("taskList");
const timelineList = document.getElementById("timelineList");
const participantList = document.getElementById("participantList");
const pollContainer = document.getElementById("pollContainer");
const pollFooter = document.getElementById("pollFooter");

const taskProgressCount = document.getElementById("taskProgressCount");
const taskProgressFill = document.getElementById("taskProgressFill");

const openTaskModal = document.getElementById("openTaskModal");
const openTimelineModal = document.getElementById("openTimelineModal");
const openParticipantModal = document.getElementById("openParticipantModal");
const openPollModal = document.getElementById("openPollModal");

const taskModal = document.getElementById("taskModal");
const timelineModal = document.getElementById("timelineModal");
const participantModal = document.getElementById("participantModal");
const pollModal = document.getElementById("pollModal");

const taskNameInput = document.getElementById("taskName");
const taskAssignedToInput = document.getElementById("taskAssignedTo");
const addTaskBtn = document.getElementById("addTaskBtn");

const timelineStepInput = document.getElementById("timelineStep");
const addTimelineBtn = document.getElementById("addTimelineBtn");

const participantNameInput = document.getElementById("participantName");
const addParticipantBtn = document.getElementById("addParticipantBtn");

const pollQuestionInput = document.getElementById("pollQuestion");
const pollOptionsWrapper = document.getElementById("pollOptionsWrapper");
const addPollOptionFieldBtn = document.getElementById("addPollOptionField");
const createPollBtn = document.getElementById("createPollBtn");
const prevPollBtn = document.getElementById("prevPollBtn");
const nextPollBtn = document.getElementById("nextPollBtn");

let tasks = [];
let timelineSteps = [];
let participants = [];
let polls = [];
let currentPollIndex = 0;
let votedPolls = new Set();

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const options = { day: "2-digit", month: "short", year: "numeric" };
  return date.toLocaleDateString("en-GB", options);
}

function updateTheme() {
  const selectedType = eventTypeInput.value || "beach";
  document.body.className = `theme-${selectedType}`;
}

function updateTopInfo() {
  displayEventTitle.textContent = eventTitleInput.value.trim() || "Untitled Event";
  displayEventDate.textContent = formatDate(eventDateInput.value);
  displayEventLocation.textContent = eventLocationInput.value.trim() || "-";
  displayParticipantCount.textContent = participants.length;
  updateTheme();
}

function openModal(modal) {
  modal.classList.remove("hidden");
}

function closeModal(modal) {
  modal.classList.add("hidden");
}

openTaskModal.addEventListener("click", () => openModal(taskModal));
openTimelineModal.addEventListener("click", () => openModal(timelineModal));
openParticipantModal.addEventListener("click", () => openModal(participantModal));
openPollModal.addEventListener("click", () => openModal(pollModal));

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => {
    const modalId = button.getAttribute("data-close");
    closeModal(document.getElementById(modalId));
  });
});

document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeModal(overlay);
    }
  });
});

function updateTaskProgress() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const percent = total === 0 ? 0 : (completed / total) * 100;

  taskProgressCount.textContent = `${completed}/${total}`;
  taskProgressFill.style.width = `${percent}%`;
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
        <button class="icon-btn task-complete" type="button">Done</button>
        <button class="remove-btn task-delete" type="button">Remove</button>
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

function renderTimeline() {
  timelineList.innerHTML = "";

  if (timelineSteps.length === 0) {
    timelineList.innerHTML = `<p class="empty-state">No timeline steps yet.</p>`;
    return;
  }

  timelineSteps.forEach((step, index) => {
    const item = document.createElement("div");
    item.className = "item-card";

    item.innerHTML = `
      <div class="item-main">
        <div class="item-title">Step ${index + 1}</div>
        <div class="item-subtitle">${step}</div>
      </div>
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

function resetPollForm() {
  pollQuestionInput.value = "";
  pollOptionsWrapper.innerHTML = `
    <div class="field-group poll-option-field">
      <label>Option 1</label>
      <input type="text" class="poll-option-input" />
    </div>
    <div class="field-group poll-option-field">
      <label>Option 2</label>
      <input type="text" class="poll-option-input" />
    </div>
  `;
}

function addPollOptionField() {
  const currentCount = pollOptionsWrapper.querySelectorAll(".poll-option-input").length + 1;

  const newField = document.createElement("div");
  newField.className = "field-group poll-option-field";
  newField.innerHTML = `
    <label>Option ${currentCount}</label>
    <input type="text" class="poll-option-input" />
  `;

  pollOptionsWrapper.appendChild(newField);
}

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
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

  const questionBox = document.createElement("div");
  questionBox.className = "poll-question-box";
  questionBox.innerHTML = `<div class="poll-question-title">${poll.question}</div>`;
  pollContainer.appendChild(questionBox);

  const optionsList = document.createElement("div");
  optionsList.className = "poll-options-list";

  poll.options.forEach((option, index) => {
    const actualPercent = totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100);
    const visiblePercent = totalVotes === 0 ? 12 : Math.max(actualPercent, 6);
    const colorClass = `color-${(index % 6) + 1}`;

    const optionEl = document.createElement("div");
    optionEl.className = "poll-option-display";

    optionEl.innerHTML = `
      <div class="poll-option-top">
        <span class="poll-option-name">${option.name}</span>
        <span class="poll-option-votes">${option.votes} votes • ${actualPercent}%</span>
      </div>
      <div class="poll-bar">
        <div class="poll-fill ${colorClass}" style="width: ${visiblePercent}%"></div>
      </div>
      <button class="vote-btn" type="button">Vote</button>
    `;

    const voteBtn = optionEl.querySelector(".vote-btn");

    if (votedPolls.has(currentPollIndex)) {
      voteBtn.disabled = true;
      voteBtn.textContent = "Voted";
    } else {
      voteBtn.addEventListener("click", () => {
        polls[currentPollIndex].options[index].votes += 1;
        votedPolls.add(currentPollIndex);
        renderPoll();
      });
    }

    optionsList.appendChild(optionEl);
  });

  pollContainer.appendChild(optionsList);

  pollFooter.textContent = `${currentPollIndex + 1}/${polls.length}`;
  prevPollBtn.disabled = currentPollIndex === 0;
  nextPollBtn.disabled = currentPollIndex === polls.length - 1;
}

function nextPoll() {
  if (currentPollIndex < polls.length - 1) {
    currentPollIndex += 1;
    renderPoll();
  }
}

function prevPoll() {
  if (currentPollIndex > 0) {
    currentPollIndex -= 1;
    renderPoll();
  }
}

addTaskBtn.addEventListener("click", () => {
  const taskName = taskNameInput.value.trim();
  const assignedTo = taskAssignedToInput.value.trim();

  if (!taskName) return;

  tasks.push({
    name: taskName,
    assignedTo,
    completed: false
  });

  taskNameInput.value = "";
  taskAssignedToInput.value = "";
  closeModal(taskModal);
  renderTasks();
});

addTimelineBtn.addEventListener("click", () => {
  const step = timelineStepInput.value.trim();

  if (!step) return;

  timelineSteps.push(step);
  timelineStepInput.value = "";
  closeModal(timelineModal);
  renderTimeline();
});

addParticipantBtn.addEventListener("click", () => {
  const name = participantNameInput.value.trim();

  if (!name) return;

  participants.push(name);
  participantNameInput.value = "";
  closeModal(participantModal);
  renderParticipants();
});

addPollOptionFieldBtn.addEventListener("click", addPollOptionField);

createPollBtn.addEventListener("click", () => {
  const question = pollQuestionInput.value.trim();
  const optionInputs = document.querySelectorAll(".poll-option-input");

  const options = Array.from(optionInputs)
    .map((input) => input.value.trim())
    .filter((value) => value !== "")
    .map((value) => ({
      name: value,
      votes: 0
    }));

  if (!question || options.length < 2) {
    alert("Question and at least 2 options are required.");
    return;
  }

  polls.push({
    question,
    options
  });

  currentPollIndex = polls.length - 1;
  resetPollForm();
  closeModal(pollModal);
  renderPoll();
});

prevPollBtn.addEventListener("click", prevPoll);
nextPollBtn.addEventListener("click", nextPoll);

eventTitleInput.addEventListener("input", updateTopInfo);
eventTypeInput.addEventListener("change", updateTopInfo);
eventDateInput.addEventListener("input", updateTopInfo);
eventLocationInput.addEventListener("input", updateTopInfo);

updateTopInfo();
renderTasks();
renderTimeline();
renderParticipants();
renderPoll();