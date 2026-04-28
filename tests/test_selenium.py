import os
import signal
import subprocess
import time

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager


BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BASE_URL = "http://127.0.0.1:5001"


@pytest.fixture(scope="session", autouse=True)
def live_flask_server():
    subprocess.run(["python", "seed.py"], cwd=BASE_DIR, check=True)

    env = os.environ.copy()
    env["PYTHONPATH"] = BASE_DIR

    process = subprocess.Popen(
        [
            "python",
            "-c",
            "from app import app; app.run(debug=False, port=5001, use_reloader=False)"
        ],
        cwd=BASE_DIR,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        preexec_fn=os.setsid
    )

    time.sleep(4)

    yield

    try:
        os.killpg(os.getpgid(process.pid), signal.SIGTERM)
    except ProcessLookupError:
        pass


@pytest.fixture
def driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1400,1000")
    options.add_argument("--disable-gpu")

    service = Service(ChromeDriverManager().install())
    browser = webdriver.Chrome(service=service, options=options)

    yield browser

    browser.quit()


def login(driver):
    driver.get(f"{BASE_URL}/login")
    time.sleep(1)

    driver.find_element(By.ID, "loginEmail").clear()
    driver.find_element(By.ID, "loginEmail").send_keys("gargi@example.com")

    driver.find_element(By.ID, "loginPassword").clear()
    driver.find_element(By.ID, "loginPassword").send_keys("password123")

    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    time.sleep(2)


def test_login_page_loads(driver):
    driver.get(f"{BASE_URL}/login")

    assert "Log In" in driver.page_source
    assert "Sign Up" in driver.page_source


def test_user_can_login(driver):
    login(driver)

    assert "My Events" in driver.page_source


def test_dashboard_page_loads(driver):
    login(driver)

    driver.get(f"{BASE_URL}/dashboard")
    time.sleep(1)

    assert "My Events" in driver.page_source


def test_discover_page_loads(driver):
    login(driver)

    driver.get(f"{BASE_URL}/discover")
    time.sleep(1)

    assert "Discover" in driver.page_source


def test_profile_page_loads(driver):
    login(driver)

    driver.get(f"{BASE_URL}/profile")
    time.sleep(1)

    assert "My Profile" in driver.page_source


def test_invitations_page_loads(driver):
    login(driver)

    driver.get(f"{BASE_URL}/invitations")
    time.sleep(1)

    assert "My Invitations" in driver.page_source


def test_logout_redirects(driver):
    login(driver)

    driver.get(f"{BASE_URL}/logout")
    time.sleep(1)

    assert "Log In" in driver.page_source