function goTo(page) {
  window.location.href = page;
}

// LOAD USER
window.onload = function () {
  const user = JSON.parse(localStorage.getItem("user"));

  if (user) {
    document.getElementById("displayName").innerText = user.name;
    document.getElementById("displayEmail").innerText = user.email;

    document.getElementById("nameInput").value = user.name;
    document.getElementById("emailInput").value = user.email;
  }
};

// SAVE PROFILE
function saveProfile() {
  const name = document.getElementById("nameInput").value;
  const email = document.getElementById("emailInput").value;

  let user = JSON.parse(localStorage.getItem("user")) || {};

  user.name = name;
  user.email = email;

  localStorage.setItem("user", JSON.stringify(user));

  document.getElementById("displayName").innerText = name;
  document.getElementById("displayEmail").innerText = email;

  alert("Profile updated!");
}

// CHANGE PASSWORD
function changePassword() {
  const current = document.getElementById("currentPassword").value;
  const newPass = document.getElementById("newPassword").value;

  let user = JSON.parse(localStorage.getItem("user"));

  if (!user || user.password !== current) {
    alert("Current password is incorrect");
    return;
  }

  user.password = newPass;
  localStorage.setItem("user", JSON.stringify(user));

  alert("Password updated!");
}