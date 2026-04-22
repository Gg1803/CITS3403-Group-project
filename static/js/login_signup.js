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

// Auto-switch to login tab if email is pre-filled (coming from signup)
window.addEventListener("load", () => {
  const loginEmail = document.getElementById("loginEmail");
  if (loginEmail && loginEmail.value !== "") {
    loginBtn.classList.add("active");
    signupBtn.classList.remove("active");
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
    extraText.innerText = "Forgot password?";
  }
});

// If error is shown, stay on login form and focus password
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