from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


def wait_for_page(driver):
    return WebDriverWait(driver, 5)


def test_login_page_loads(driver, live_server_url):
    driver.get(f"{live_server_url}/login")

    page = driver.page_source
    assert "Eventure" in page
    assert "Log In" in page
    assert "Sign Up" in page


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
