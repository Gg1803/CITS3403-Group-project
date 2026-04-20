let isLoginMode = true;
 
const loginBtn    = document.getElementById("loginBtn");
const signupBtn   = document.getElementById("signupBtn");
const nameField   = document.getElementById("nameField");
const nameInput   = document.getElementById("nameInput");
const emailInput  = document.getElementById("emailInput");
const passInput   = document.getElementById("passwordInput");
const submitBtn   = document.getElementById("submitBtn");
const extraText   = document.getElementById("extraText");
 
/* Switch to Login */
function setLoginMode() {
  isLoginMode = true;
  loginBtn.classList.add("active");
  signupBtn.classList.remove("active");
  nameField.classList.add("hidden");
  submitBtn.innerText = "Log In";
  extraText.innerText = "Forgot password?";
}
 
/* Switch to Sign Up */
function setSignupMode() {
  isLoginMode = false;
  signupBtn.classList.add("active");
  loginBtn.classList.remove("active");
  nameField.classList.remove("hidden");
  submitBtn.innerText = "Create Account";
  extraText.innerText = "";
}
 
loginBtn.addEventListener("click", setLoginMode);
signupBtn.addEventListener("click", setSignupMode);
 
/* Submit */
submitBtn.addEventListener("click", () => {
  const email    = emailInput.value.trim();
  const password = passInput.value;
 
  if (isLoginMode) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.email === email && user.password === password) {
      window.location.href = "dashboard.html";
    } else {
      alert("Incorrect email or password. Please try again.");
    }
  } else {
    const name = nameInput.value.trim();
    if (!name || !email || !password) {
      alert("Please fill in all fields.");
      return;
    }
    const user = { name, email, password };
    localStorage.setItem("user", JSON.stringify(user));
    alert("Account created! You can now log in.");
    setLoginMode();
  }
});