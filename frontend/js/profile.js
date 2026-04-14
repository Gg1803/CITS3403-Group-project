function goTo(page) {
  window.location.href = page;
}

function saveProfile() {
  const name = document.getElementById("nameInput").value;
  const email = document.getElementById("emailInput").value;

  // update with new
  document.getElementById("displayName").innerText = name;
  document.getElementById("displayEmail").innerText = email;

  alert("Profile updated successfully!");
}