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

  if (type === "success") {
    setTimeout(() => { box.style.display = "none"; }, 3000);
  }
}

function clearMessage() {
  const box = document.getElementById("profileMsg");
  if (box) box.style.display = "none";
}

// =======================
// SAVE PROFILE
// =======================
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

    if (!res.ok || data.error) {
      showMessage("error", data.error || "Failed to update profile.");
      return;
    }

    document.getElementById("displayName").innerText = data.username;
    document.getElementById("displayEmail").innerText = data.email;

    showMessage("success", "Profile updated successfully!");

  } catch (err) {
    showMessage("error", "Network error. Please try again.");
  }
}

// =======================
// CHANGE PASSWORD
// =======================
async function changePassword() {
  clearMessage();

  const current = document.getElementById("currentPassword").value.trim();
  const newPass = document.getElementById("newPassword").value.trim();

  if (!current || !newPass) {
    showMessage("error", "Please fill in both password fields.");
    return;
  }

  // Frontend validation
  if (newPass.length < 8) {
    showMessage("error", "Password must be at least 8 characters.");
    return;
  }

  if (!/[A-Z]/.test(newPass)) {
    showMessage("error", "Password must contain at least one uppercase letter.");
    return;
  }

  try {
    const res = await fetch("/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current: current,
        new: newPass
      })
    });

    const data = await res.json();

    // ❗ IMPORTANT FIX
    if (!res.ok || data.error) {
      showMessage("error", data.error || "Password update failed.");
      return;
    }

    // Clear fields ONLY on success
    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";

    // ✅ Use backend message (includes email status)
    showMessage("success", data.message || "Password updated successfully!");

  } catch (err) {
    showMessage("error", "Network error. Please try again.");
  }
}

// =======================
// LIVE PASSWORD HINT
// =======================
const newPasswordInput = document.getElementById("newPassword");
const newPasswordHint  = document.getElementById("newPasswordHint");

if (newPasswordInput && newPasswordHint) {
  newPasswordInput.addEventListener("input", () => {
    const val = newPasswordInput.value;

    if (val.length > 0 && val.length < 8) {
      newPasswordHint.textContent = "At least 8 characters required";
    } 
    else if (val.length >= 8 && !/[A-Z]/.test(val)) {
      newPasswordHint.textContent = "Must include one uppercase letter";
    } 
    else {
      newPasswordHint.textContent = "";
    }
  });
}