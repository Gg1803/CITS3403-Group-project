import os
import socket
import tempfile
import threading
import time
from pathlib import Path
from urllib.request import urlopen

import pytest
from selenium import webdriver
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from werkzeug.serving import make_server

os.environ.setdefault("SECRET_KEY", "selenium-test-secret-key")

from app import app


BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
os.environ.setdefault("SE_CACHE_PATH", os.path.join(BASE_DIR, ".selenium-cache"))
os.environ.setdefault("WDM_LOCAL", "1")


def _chromedriver_path():
    cached_drivers = sorted(
        Path(BASE_DIR).glob("tests/seleniumtest/.wdm/**/chromedriver")
    )
    if cached_drivers:
        return str(cached_drivers[-1])

    return ChromeDriverManager().install()


def _free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


@pytest.fixture(scope="session")
def live_server_url():
    app.config.update(
        TESTING=True,
        SECRET_KEY="selenium-test-secret-key",
    )

    port = _free_port()
    server = make_server("127.0.0.1", port, app)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    base_url = f"http://127.0.0.1:{port}"
    for _ in range(30):
        try:
            urlopen(f"{base_url}/login", timeout=1)
            break
        except Exception:
            time.sleep(0.1)
    else:
        server.shutdown()
        pytest.fail("Selenium live server did not start")

    yield base_url

    server.shutdown()
    thread.join(timeout=2)


@pytest.fixture
def driver():
    with tempfile.TemporaryDirectory(dir=BASE_DIR) as profile_dir:
        options = Options()
        chrome_binary = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        if not os.path.exists(chrome_binary):
            pytest.fail("Google Chrome is required for Selenium tests.")

        options.binary_location = chrome_binary
        options.add_argument("--headless=new")
        options.add_argument("--window-size=1440,1000")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-first-run")
        options.add_argument("--disable-background-networking")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-popup-blocking")
        options.add_argument("--remote-debugging-port=0")
        options.add_argument(f"--user-data-dir={profile_dir}")

        try:
            service = Service(_chromedriver_path())
            browser = webdriver.Chrome(service=service, options=options)
        except Exception as exc:
            pytest.skip(f"Chrome could not start in this environment: {exc}")

        try:
            yield browser
        finally:
            browser.quit()
