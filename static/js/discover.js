function goTo(page) { window.location.href = page; }

/* Filter — hides/shows Jinja-rendered cards by data-type */
function filterCards() {
  const val     = document.getElementById("typeFilter").value;
  const cards   = document.querySelectorAll("#discoverGrid .card");
  const empty   = document.getElementById("emptyState");
  const count   = document.getElementById("resultCount");
  let   visible = 0;

  cards.forEach(card => {
    const match = val === "all" || card.dataset.type === val;
    card.style.display = match ? "" : "none";
    if (match) visible++;
  });

  count.textContent = `Showing ${visible} event${visible !== 1 ? "s" : ""}`;
  empty.style.display = visible === 0 ? "flex" : "none";
}

/* Join via AJAX */
document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  document.getElementById("discoverGrid").addEventListener("click", async e => {
    const btn = e.target.closest(".join-btn");
    if (!btn) return;

    const eventId = btn.dataset.eventId;

    const res  = await fetch(`/event/${eventId}/join`, { method: "POST" });
    const data = await res.json();

    if (data.error) {
      // Already joined — update button to reflect state
      btn.textContent  = "Joined";
      btn.disabled     = true;
      btn.style.background = "#d6f3ef";
      btn.style.color      = "#12796c";
      return;
    }

    if (data.success) {
      // Update attendee count and button state
      const countEl = document.getElementById(`count-${eventId}`);
      if (countEl) countEl.textContent = data.participants;
      btn.textContent      = "Joined";
      btn.disabled         = true;
      btn.style.background = "#d6f3ef";
      btn.style.color      = "#12796c";
    }
  });
});