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

function openModal() {
  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
}

window.onclick = e => {
  if (e.target === modal) closeModal();
};

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

document.addEventListener("DOMContentLoaded", () => {
  modal = document.getElementById("modal");
  lucide.createIcons();
});