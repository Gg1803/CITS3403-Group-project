let isLoginMode = true;

const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const nameField = document.getElementById('nameField');
const submitBtn = document.getElementById('submitBtn');
const extraText = document.getElementById('extraText');

// Switch to login mode
function setLoginMode() {
  isLoginMode = true;

  loginBtn.classList.add('active');
  signupBtn.classList.remove('active');

  nameField.classList.add('hidden');

  submitBtn.innerText = "Let's go!";
  extraText.innerText = "Forgot password?";
}

// Switch to signup mode
function setSignupMode() {
  isLoginMode = false;

  signupBtn.classList.add('active');
  loginBtn.classList.remove('active');

  nameField.classList.remove('hidden');

  submitBtn.innerText = "Create Account";
  extraText.innerText = "";
}

// Toggle buttons
loginBtn.addEventListener('click', setLoginMode);
signupBtn.addEventListener('click', setSignupMode);

// Handle submit
submitBtn.addEventListener('click', () => {
  if (isLoginMode) {
    // LOGIN → go to dashboard
    window.location.href = "dashboard.html";
  } else {
    // SIGN UP → fake success → switch to login
    alert("Account created! Please log in.");

    setLoginMode();
  }
});