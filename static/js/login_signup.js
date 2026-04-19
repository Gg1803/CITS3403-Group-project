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
  const email = document.querySelector('input[type="email"]').value;
  const password = document.querySelector('input[type="password"]').value;
  const nameInput = document.querySelector('#nameField input');

  if (isLoginMode) {
    // get saved user
    const user = JSON.parse(localStorage.getItem("user"));

    if (user && user.email === email) {
      window.location.href = "/dashboard";
    } else {
      alert("User not found. Please sign up.");
    }

  } else {
    // SIGN UP
    const name = nameInput.value;

    const user = {
      name: name,
      email: email,
      password: password
    };

    localStorage.setItem("user", JSON.stringify(user));

    alert("Account created! Please log in.");
    setLoginMode();
  }
});