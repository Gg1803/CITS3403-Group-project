const loginBtn   = document.getElementById("loginBtn");
const signupBtn  = document.getElementById("signupBtn");
const loginForm  = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const extraText  = document.getElementById("extraText");

loginBtn.addEventListener("click", () => {
  loginBtn.classList.add("active");
  signupBtn.classList.remove("active");
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");
  extraText.innerText = "Forgot password?";
});

signupBtn.addEventListener("click", () => {
  signupBtn.classList.add("active");
  loginBtn.classList.remove("active");
  signupForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  extraText.innerText = "";
});

window.addEventListener("load", () => {
  const loginEmail = document.getElementById("loginEmail");
  const errorBox   = document.querySelector(".login-error");

  if (loginEmail && loginEmail.value !== "") {
    loginBtn.classList.add("active");
    signupBtn.classList.remove("active");
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
    extraText.innerText = "Forgot password?";
  }

  if (errorBox) {
    document.getElementById("loginPassword").focus();
  }
});

// Real-time password validation for signup
const signupPasswordInput = document.getElementById("signupPassword");
const signupPasswordHint  = document.getElementById("signupPasswordHint");

if (signupPasswordInput && signupPasswordHint) {
  signupPasswordInput.addEventListener("input", () => {
    const val = signupPasswordInput.value;
    let msg = "";
    if (val.length > 0 && val.length < 8) {
      msg = "Password must be at least 8 characters";
    } else if (val.length >= 8 && !/[A-Z]/.test(val)) {
      msg = "Password must contain at least one uppercase letter";
    }
    signupPasswordHint.textContent = msg;
  });

  // Also validate on form submit (extra safety)
  const signupForm = document.getElementById("signupForm");
  signupForm.addEventListener("submit", (e) => {
    const pw = signupPasswordInput.value;
    if (pw.length < 8) {
      e.preventDefault();
      signupPasswordHint.textContent = "Password must be at least 8 characters";
      return;
    }
    if (!/[A-Z]/.test(pw)) {
      e.preventDefault();
      signupPasswordHint.textContent = "Password must contain at least one uppercase letter";
      return;
    }
  });
}