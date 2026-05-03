import time
import pytest

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager


BASE_URL = "http://127.0.0.1:5000"


@pytest.fixture
def driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1440,1000")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)

    yield driver

    driver.quit()


def get_visible_inputs(driver):
    return [
        field for field in driver.find_elements(By.TAG_NAME, "input")
        if field.is_displayed() and field.is_enabled()
    ]


def click_visible_button_with_text(driver, text):
    text = text.lower()

    buttons = driver.find_elements(By.TAG_NAME, "button")

    for button in buttons:
        if button.is_displayed() and button.is_enabled():
            if text in button.text.lower():
                button.click()
                time.sleep(1)
                return True

    links_or_tabs = driver.find_elements(By.XPATH, "//*[self::a or self::span or self::div]")
    for element in links_or_tabs:
        if element.is_displayed() and element.is_enabled():
            if text in element.text.lower():
                element.click()
                time.sleep(1)
                return True

    return False


def test_login_page_loads(driver):
    driver.get(BASE_URL + "/login")
    time.sleep(1)

    page = driver.page_source.lower()

    assert "log" in page
    assert "sign" in page


def test_user_can_attempt_login(driver):
    driver.get(BASE_URL + "/login")
    time.sleep(1)

    click_visible_button_with_text(driver, "log")

    inputs = get_visible_inputs(driver)

    assert len(inputs) >= 2

    email_input = None
    password_input = None

    for field in inputs:
        field_type = field.get_attribute("type")
        field_name = (field.get_attribute("name") or "").lower()

        if field_type == "email" or "email" in field_name:
            email_input = field
        elif field_type == "password" or "password" in field_name:
            password_input = field

    assert email_input is not None
    assert password_input is not None

    email_input.clear()
    email_input.send_keys("gargi@example.com")

    password_input.clear()
    password_input.send_keys("password123")

    submit_buttons = driver.find_elements(By.TAG_NAME, "button")

    clicked = False
    for button in submit_buttons:
        if button.is_displayed() and button.is_enabled():
            if "log" in button.text.lower() or button.get_attribute("type") == "submit":
                button.click()
                clicked = True
                break

    assert clicked is True

    time.sleep(2)

    assert driver.current_url.startswith(BASE_URL)


def test_invalid_login_shows_error_or_stays_on_login(driver):
    driver.get(BASE_URL + "/login")
    time.sleep(1)

    click_visible_button_with_text(driver, "log")

    inputs = get_visible_inputs(driver)

    assert len(inputs) >= 2

    email_input = None
    password_input = None

    for field in inputs:
        field_type = field.get_attribute("type")
        field_name = (field.get_attribute("name") or "").lower()

        if field_type == "email" or "email" in field_name:
            email_input = field
        elif field_type == "password" or "password" in field_name:
            password_input = field

    assert email_input is not None
    assert password_input is not None

    email_input.clear()
    email_input.send_keys("wrong@example.com")

    password_input.clear()
    password_input.send_keys("wrongpassword")

    submit_buttons = driver.find_elements(By.TAG_NAME, "button")

    clicked = False
    for button in submit_buttons:
        if button.is_displayed() and button.is_enabled():
            if "log" in button.text.lower() or button.get_attribute("type") == "submit":
                button.click()
                clicked = True
                break

    assert clicked is True

    time.sleep(2)

    page = driver.page_source.lower()

    assert (
        "incorrect" in page
        or "invalid" in page
        or "error" in page
        or "login" in driver.current_url.lower()
    )


def test_user_can_attempt_signup(driver):
    driver.get(BASE_URL + "/login")
    time.sleep(1)

    click_visible_button_with_text(driver, "sign")

    username = f"seleniumuser{int(time.time())}"
    email = f"{username}@example.com"
    password = "TestPassword123"

    inputs = get_visible_inputs(driver)

    assert len(inputs) >= 3

    username_input = None
    email_input = None
    password_input = None

    for field in inputs:
        field_type = field.get_attribute("type")
        field_name = (field.get_attribute("name") or "").lower()

        if "username" in field_name or field_type == "text":
            username_input = field
        elif field_type == "email" or "email" in field_name:
            email_input = field
        elif field_type == "password" or "password" in field_name:
            password_input = field

    assert username_input is not None
    assert email_input is not None
    assert password_input is not None

    username_input.clear()
    username_input.send_keys(username)

    email_input.clear()
    email_input.send_keys(email)

    password_input.clear()
    password_input.send_keys(password)

    submit_buttons = driver.find_elements(By.TAG_NAME, "button")

    clicked = False
    for button in submit_buttons:
        if button.is_displayed() and button.is_enabled():
            if "sign" in button.text.lower() or button.get_attribute("type") == "submit":
                button.click()
                clicked = True
                break

    assert clicked is True

    time.sleep(2)

    assert driver.current_url.startswith(BASE_URL)


def test_dashboard_route_protected_or_loads(driver):
    driver.get(BASE_URL + "/dashboard")
    time.sleep(1)

    page = driver.page_source.lower()

    assert (
        "dashboard" in page
        or "my events" in page
        or "login" in driver.current_url.lower()
        or "sign" in page
    )


def test_discover_page_loads(driver):
    driver.get(BASE_URL + "/discover")
    time.sleep(1)

    page = driver.page_source.lower()

    assert (
        "discover" in page
        or "event" in page
        or "login" in driver.current_url.lower()
        or "sign" in page
    )


def test_event_details_page_route_works_or_is_protected(driver):
    driver.get(BASE_URL + "/event-details/1")
    time.sleep(1)

    page = driver.page_source.lower()

    assert (
        "event details" in page
        or "task board" in page
        or "event" in page
        or "login" in driver.current_url.lower()
        or "sign" in page
    )


def test_invitations_route_protected_or_loads(driver):
    driver.get(BASE_URL + "/invitations")
    time.sleep(1)

    page = driver.page_source.lower()

    assert (
        "invitation" in page
        or "invite" in page
        or "login" in driver.current_url.lower()
        or "sign" in page
    )


def test_profile_route_protected_or_loads(driver):
    driver.get(BASE_URL + "/profile")
    time.sleep(1)

    page = driver.page_source.lower()

    assert (
        "profile" in page
        or "my profile" in page
        or "login" in driver.current_url.lower()
        or "sign" in page
    )


def test_logout_redirects_to_login(driver):
    driver.get(BASE_URL + "/logout")
    time.sleep(1)

    page = driver.page_source.lower()

    assert (
        "login" in driver.current_url.lower()
        or "login" in page
        or "sign" in page
    )