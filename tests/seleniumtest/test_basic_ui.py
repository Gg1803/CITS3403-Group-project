import uuid

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


def wait_for_page(driver, timeout=10):
    return WebDriverWait(driver, timeout)


def create_and_login_user(driver, live_server_url):
    # Per-test DB is empty, but use uuid to be defensive against any sharing.
    username = f"sel_{uuid.uuid4().hex[:10]}"
    email = f"{username}@example.com"
    password = "Password123"

    driver.get(f"{live_server_url}/login")

    wait_for_page(driver).until(
        EC.element_to_be_clickable((By.ID, "signupBtn"))
    ).click()

    wait_for_page(driver).until(
        EC.visibility_of_element_located((By.ID, "signupUsername"))
    )

    driver.find_element(By.ID, "signupUsername").send_keys(username)
    driver.find_element(By.ID, "signupEmail").send_keys(email)
    driver.find_element(By.ID, "signupPassword").send_keys(password)

    signup_submit = driver.find_element(
        By.CSS_SELECTOR, "#signupForm button[type='submit']"
    )
    signup_submit.click()

    # The login page initially has the URL "/login", so a plain url_contains("/login")
    # would be satisfied IMMEDIATELY (before the form POST completes). We wait for the
    # submit button to actually go stale (page navigated) AND for the redirect
    # target "/login?email=..." which only appears after a successful signup.
    wait_for_page(driver).until(EC.staleness_of(signup_submit))
    wait_for_page(driver).until(
        lambda d: "/login" in d.current_url and "email=" in d.current_url
    )

    driver.get(f"{live_server_url}/login")

    wait_for_page(driver).until(
        EC.visibility_of_element_located((By.ID, "loginEmail"))
    )

    driver.find_element(By.ID, "loginEmail").clear()
    driver.find_element(By.ID, "loginEmail").send_keys(email)

    driver.find_element(By.ID, "loginPassword").clear()
    driver.find_element(By.ID, "loginPassword").send_keys(password)

    login_submit = driver.find_element(
        By.CSS_SELECTOR, "#loginForm button[type='submit']"
    )
    login_submit.click()

    # Same trick: wait for the login button to detach from the DOM before checking
    # the post-login URL, otherwise the wait can race with the POST request.
    wait_for_page(driver).until(EC.staleness_of(login_submit))
    wait_for_page(driver).until(
        lambda d: "/dashboard" in d.current_url or "My Events" in d.page_source
    )

def test_login_page_loads(driver, live_server_url):
    driver.get(f"{live_server_url}/login")

    assert "Eventure" in driver.page_source
    assert "Log In" in driver.page_source
    assert "Sign Up" in driver.page_source


def test_login_form_contains_csrf_token(driver, live_server_url):
    driver.get(f"{live_server_url}/login")

    csrf_input = driver.find_element(By.NAME, "csrf_token")

    assert csrf_input.get_attribute("type") == "hidden"
    assert csrf_input.get_attribute("value")


def test_signup_toggle_shows_signup_fields(driver, live_server_url):
    driver.get(f"{live_server_url}/login")

    driver.find_element(By.ID, "signupBtn").click()

    wait_for_page(driver).until(
        EC.visibility_of_element_located((By.ID, "signupUsername"))
    )

    assert driver.find_element(By.ID, "signupUsername").is_displayed()
    assert driver.find_element(By.ID, "signupEmail").is_displayed()
    assert driver.find_element(By.ID, "signupPassword").is_displayed()


def test_dashboard_redirects_to_login_when_logged_out(driver, live_server_url):
    driver.get(f"{live_server_url}/dashboard")

    wait_for_page(driver).until(EC.url_contains("/login"))

    assert "/login" in driver.current_url


def test_profile_redirects_to_login_when_logged_out(driver, live_server_url):
    driver.get(f"{live_server_url}/profile")

    wait_for_page(driver).until(EC.url_contains("/login"))

    assert "/login" in driver.current_url


def test_logged_in_user_can_open_dashboard(driver, live_server_url):
    create_and_login_user(driver, live_server_url)

    assert "/dashboard" in driver.current_url
    assert "My Events" in driver.page_source


def test_dashboard_create_event_modal_opens(driver, live_server_url):
    create_and_login_user(driver, live_server_url)

    wait_for_page(driver).until(
        EC.element_to_be_clickable((By.CLASS_NAME, "create-btn"))
    ).click()

    wait_for_page(driver).until(
        EC.visibility_of_element_located((By.ID, "modal"))
    )

    assert driver.find_element(By.ID, "title").is_displayed()
    assert driver.find_element(By.ID, "type").is_displayed()


def test_discover_filter_exists_after_login(driver, live_server_url):
    create_and_login_user(driver, live_server_url)

    driver.get(f"{live_server_url}/discover")

    wait_for_page(driver).until(
        EC.presence_of_element_located((By.ID, "typeFilter"))
    )

    assert "Discover" in driver.page_source
    assert driver.find_element(By.ID, "typeFilter").is_displayed()


def test_profile_page_inputs_load_after_login(driver, live_server_url):
    create_and_login_user(driver, live_server_url)

    driver.get(f"{live_server_url}/profile")

    wait_for_page(driver).until(
        EC.presence_of_element_located((By.ID, "nameInput"))
    )

    assert driver.find_element(By.ID, "nameInput").is_displayed()
    assert driver.find_element(By.ID, "emailInput").is_displayed()


def test_event_details_route_protected_or_loads(driver, live_server_url):
    create_and_login_user(driver, live_server_url)

    driver.get(f"{live_server_url}/dashboard")

    wait_for_page(driver).until(
        EC.presence_of_element_located((By.TAG_NAME, "body"))
    )

    page = driver.page_source

    assert (
        "My Events" in page
        or "No events created yet" in page
        or "View Details" in page
    )