function goTo(page) {
  window.location.href = page;
}

// Message display helper
function showMessage(type, text) {
  const box = document.getElementById("profileMsg");
  if (!box) return;
  box.textContent = text;
  box.className = `profile-msg profile-msg-${type}`;
  box.style.display = "block";
  // Auto-hide success after 3s
  if (type === "success") {
    setTimeout(() => { box.style.display = "none"; }, 3000);
  }
}

function clearMessage() {
  const box = document.getElementById("profileMsg");
  if (box) box.style.display = "none";
}

// SAVE PROFILE (username + email)
async function saveProfile() {
  clearMessage();
  
  const name = document.getElementById("nameInput").value.trim();
  const email = document.getElementById("emailInput").value.trim();

  if (!name || !email) {
    showMessage("error", "Username and email cannot be empty.");
    return;
  }

  try {
    const res = await fetch("/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: name, email: email })
    });
    const data = await res.json();

    if (data.error) {
      showMessage("error", data.error);
      return;
    }

    // Update display
    document.getElementById("displayName").innerText = data.username;
    document.getElementById("displayEmail").innerText = data.email;
    document.getElementById("nameInput").value = data.username;
    document.getElementById("emailInput").value = data.email;

    showMessage("success", "Profile updated successfully!");
  } catch (err) {
    showMessage("error", "Network error. Please try again.");
  }
}

// CHANGE PASSWORD
async function changePassword() {
  clearMessage();

  const current = document.getElementById("currentPassword").value;
  const newPass = document.getElementById("newPassword").value;

  if (!current || !newPass) {
    showMessage("error", "Please fill in both password fields.");
    return;
  }

  // Frontend pre-check
  if (newPass.length < 8) {
    showMessage("error", "Password must be at least 8 characters and include one uppercase letter.");
    return;
  }
  if (!/[A-Z]/.test(newPass)) {
    showMessage("error", "Password must be at least 8 characters and include one uppercase letter.");
    return;
  }

  try {
    const res = await fetch("/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current: current, new: newPass })
    });
    const data = await res.json();

    if (data.error) {
      showMessage("error", data.error);
      return;
    }

    // Clear password fields
    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    showMessage("success", "Password updated successfully!");
  } catch (err) {
    showMessage("error", "Network error. Please try again.");
  }
}

// Real-time password validation hint
const newPasswordInput = document.getElementById("newPassword");
const newPasswordHint  = document.getElementById("newPasswordHint");

if (newPasswordInput && newPasswordHint) {
  newPasswordInput.addEventListener("input", () => {
    const val = newPasswordInput.value;
    let msg = "";
    if (val.length > 0 && val.length < 8) {
      msg = "Password must be at least 8 characters";
    } else if (val.length >= 8 && !/[A-Z]/.test(val)) {
      msg = "Password must contain at least one uppercase letter";
    }
    newPasswordHint.textContent = msg;
  });
}