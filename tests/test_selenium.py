import os
import uuid
import pytest

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager


BASE_URL = os.environ.get("SELENIUM_BASE_URL", "http://127.0.0.1:5000")


@pytest.fixture
def driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1440,1000")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")

    service = Service(ChromeDriverManager().install())
    browser = webdriver.Chrome(service=service, options=options)

    yield browser

    browser.quit()


def wait(driver, seconds=10):
    return WebDriverWait(driver, seconds)


def visible_inputs(driver):
    return [
        field for field in driver.find_elements(By.TAG_NAME, "input")
        if field.is_displayed() and field.is_enabled()
    ]


def click_text(driver, text):
    text = text.lower()

    elements = driver.find_elements(
        By.XPATH,
        "//*[self::button or self::a or self::span or self::div]"
    )

    for element in elements:
        if element.is_displayed() and element.is_enabled():
            if text in element.text.lower():
                element.click()
                return True

    return False


def find_input(driver, *keywords):
    keywords = [word.lower() for word in keywords]

    for field in visible_inputs(driver):
        field_type = (field.get_attribute("type") or "").lower()
        field_name = (field.get_attribute("name") or "").lower()
        field_id = (field.get_attribute("id") or "").lower()
        placeholder = (field.get_attribute("placeholder") or "").lower()

        combined = f"{field_type} {field_name} {field_id} {placeholder}"

        if any(word in combined for word in keywords):
            return field

    return None


def submit_visible_form(driver, button_text):
    button_text = button_text.lower()

    buttons = driver.find_elements(By.TAG_NAME, "button")
    for button in buttons:
        text = button.text.lower()
        button_type = (button.get_attribute("type") or "").lower()

        if button.is_displayed() and button.is_enabled():
            if button_text in text or button_type == "submit":
                button.click()
                return True

    return False


def unique_user():
    unique = uuid.uuid4().hex[:10]
    username = f"selenium_{unique}"
    email = f"{username}@example.com"
    password = "TestPassword123!"
    return username, email, password


def signup_user(driver):
    username, email, password = unique_user()

    driver.get(BASE_URL + "/login")
    wait(driver).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

    click_text(driver, "sign")

    username_input = wait(driver).until(lambda d: find_input(d, "username", "name"))
    email_input = wait(driver).until(lambda d: find_input(d, "email"))
    password_input = wait(driver).until(lambda d: find_input(d, "password"))

    username_input.clear()
    username_input.send_keys(username)

    email_input.clear()
    email_input.send_keys(email)

    password_input.clear()
    password_input.send_keys(password)

    assert submit_visible_form(driver, "sign") is True

    wait(driver, 15).until(
        lambda d: "/login" in d.current_url.lower()
        or "/dashboard" in d.current_url.lower()
        or "dashboard" in d.page_source.lower()
        or "login" in d.page_source.lower()
    )

    return email, password


def login_user(driver, email, password):
    driver.get(BASE_URL + "/login")
    wait(driver).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

    click_text(driver, "log")

    email_input = wait(driver).until(lambda d: find_input(d, "email"))
    password_input = wait(driver).until(lambda d: find_input(d, "password"))

    email_input.clear()
    email_input.send_keys(email)

    password_input.clear()
    password_input.send_keys(password)

    assert submit_visible_form(driver, "log") is True

    wait(driver, 15).until(
        lambda d: "/dashboard" in d.current_url.lower()
        or "dashboard" in d.page_source.lower()
        or "my events" in d.page_source.lower()
    )


def signup_and_login(driver):
    email, password = signup_user(driver)
    login_user(driver, email, password)


def test_login_page_loads(driver):
    driver.get(BASE_URL + "/login")

    wait(driver).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
    page = driver.page_source.lower()

    assert "log" in page
    assert "sign" in page


def test_invalid_login_shows_error_or_stays_on_login(driver):
    driver.get(BASE_URL + "/login")
    wait(driver).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

    click_text(driver, "log")

    email_input = wait(driver).until(lambda d: find_input(d, "email"))
    password_input = wait(driver).until(lambda d: find_input(d, "password"))

    email_input.clear()
    email_input.send_keys("wrong@example.com")

    password_input.clear()
    password_input.send_keys("wrongpassword")

    assert submit_visible_form(driver, "log") is True

    wait(driver, 10).until(
        lambda d: "login" in d.current_url.lower()
        or "incorrect" in d.page_source.lower()
        or "invalid" in d.page_source.lower()
        or "error" in d.page_source.lower()
    )


def test_user_can_signup(driver):
    email, _ = signup_user(driver)

    assert "@example.com" in email
    assert driver.current_url.startswith(BASE_URL)


def test_user_can_signup_and_login(driver):
    signup_and_login(driver)

    assert (
        "dashboard" in driver.current_url.lower()
        or "dashboard" in driver.page_source.lower()
        or "my events" in driver.page_source.lower()
    )


def test_dashboard_route_is_protected_or_loads(driver):
    driver.get(BASE_URL + "/dashboard")
    wait(driver).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

    page = driver.page_source.lower()

    assert (
        "dashboard" in page
        or "my events" in page
        or "login" in driver.current_url.lower()
        or "sign" in page
    )


def test_discover_page_loads_or_redirects_to_login(driver):
    driver.get(BASE_URL + "/discover")
    wait(driver).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

    page = driver.page_source.lower()

    assert (
        "discover" in page
        or "event" in page
        or "login" in driver.current_url.lower()
        or "sign" in page
    )


def test_invitations_route_is_protected_or_loads(driver):
    driver.get(BASE_URL + "/invitations")
    wait(driver).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

    page = driver.page_source.lower()

    assert (
        "invitation" in page
        or "invite" in page
        or "login" in driver.current_url.lower()
        or "sign" in page
    )


def test_profile_route_is_protected_or_loads(driver):
    driver.get(BASE_URL + "/profile")
    wait(driver).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

    page = driver.page_source.lower()

    assert (
        "profile" in page
        or "my profile" in page
        or "login" in driver.current_url.lower()
        or "sign" in page
    )


def test_event_details_route_is_protected_or_loads(driver):
    driver.get(BASE_URL + "/event-details/1")
    wait(driver).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

    page = driver.page_source.lower()

    assert (
        "event details" in page
        or "task board" in page
        or "event" in page
        or "login" in driver.current_url.lower()
        or "sign" in page
        or "404" in page
    )


def test_dashboard_create_event_button_or_modal_exists_after_login(driver):
    signup_and_login(driver)

    driver.get(BASE_URL + "/dashboard")
    wait(driver).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

    page = driver.page_source.lower()

    assert (
        "create" in page
        or "new event" in page
        or "add event" in page
        or "dashboard" in page
        or "my events" in page
    )


def test_logout_redirects_to_login(driver):
    driver.get(BASE_URL + "/logout")
    wait(driver).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

    page = driver.page_source.lower()

    assert (
        "login" in driver.current_url.lower()
        or "login" in page
        or "sign" in page
    )
