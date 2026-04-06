const eventTitleInput = document.getElementById("eventTitle");
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

const taskProgressCount = document.getElementById("taskProgressCount");
const taskProgressFill = document.getElementById("taskProgressFill");
const pollVoteCount = document.getElementById("pollVoteCount");

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

let tasks = [];
let timelineSteps = [];
let participants = [];
let currentPoll = null;

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);
  const options = { day: "2-digit", month: "short", year: "numeric" };
  return date.toLocaleDateString("en-GB", options);
}

function updateTopInfo() {
  displayEventTitle.textContent = eventTitleInput.value.trim() || "Untitled Event";
  displayEventDate.textContent = formatDate(eventDateInput.value);
  displayEventLocation.textContent = eventLocationInput.value.trim() || "-";
  displayParticipantCount.textContent = participants.length;
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

  taskProgressCount.textContent = `${completed}/${total}`;

  const percent = total === 0 ? 0 : (completed / total) * 100;
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
        <button class="icon-btn task-complete" type="button" title="Complete">✓</button>
        <button class="icon-btn task-delete" type="button" title="Delete">🗑</button>
      </div>
    `;

    const completeBtn = item.querySelector(".task-complete");
    const deleteBtn = item.querySelector(".task-delete");

    completeBtn.addEventListener("click", () => {
      tasks[index].completed = !tasks[index].completed;
      renderTasks();
    });

    deleteBtn.addEventListener("click", () => {
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
        <button class="icon-btn timeline-delete" type="button" title="Delete">🗑</button>
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
        <button class="icon-btn participant-delete" type="button" title="Delete">🗑</button>
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

function renderPoll() {
  pollContainer.innerHTML = "";

  if (!currentPoll) {
    pollContainer.innerHTML = `<p class="empty-state">No polls created yet.</p>`;
    pollVoteCount.textContent = "0/0";
    return;
  }

  const totalVotes = currentPoll.options.reduce((sum, option) => sum + option.votes, 0);
  pollVoteCount.textContent = `${totalVotes}/${currentPoll.options.length}`;

  const questionBox = document.createElement("div");
  questionBox.className = "poll-question-box";
  questionBox.innerHTML = `<div class="poll-question-title">${currentPoll.question}</div>`;
  pollContainer.appendChild(questionBox);

  const optionsList = document.createElement("div");
  optionsList.className = "poll-options-list";

  currentPoll.options.forEach((option, index) => {
    const percent = totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100);

    const optionEl = document.createElement("div");
    optionEl.className = "poll-option-display";

    optionEl.innerHTML = `
      <div class="poll-option-top">
        <span class="poll-option-name">${option.name}</span>
        <span class="poll-option-votes">${option.votes} votes</span>
      </div>
      <div class="poll-bar">
        <div class="poll-bar-fill" style="width: ${percent}%"></div>
      </div>
      <button class="vote-btn" type="button">Vote</button>
    `;

    optionEl.querySelector(".vote-btn").addEventListener("click", () => {
      currentPoll.options[index].votes += 1;
      renderPoll();
    });

    optionsList.appendChild(optionEl);
  });

  pollContainer.appendChild(optionsList);
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

addPollOptionFieldBtn.addEventListener("click", () => {
  const currentCount = pollOptionsWrapper.querySelectorAll(".poll-option-input").length;

  const newField = document.createElement("div");
  newField.className = "field-group poll-option-field";
  newField.innerHTML = `
    <label>Option ${currentCount + 1}</label>
    <input type="text" class="poll-option-input" />
  `;

  pollOptionsWrapper.appendChild(newField);
});

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

  if (!question || options.length < 2) return;

  currentPoll = {
    question,
    options
  };

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

  closeModal(pollModal);
  renderPoll();
});

eventTitleInput.addEventListener("input", updateTopInfo);
eventDateInput.addEventListener("input", updateTopInfo);
eventLocationInput.addEventListener("input", updateTopInfo);

updateTopInfo();
renderTasks();
renderTimeline();
renderParticipants();
renderPoll();