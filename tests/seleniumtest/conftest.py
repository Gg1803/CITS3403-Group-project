import os
import socket
import tempfile
import threading
import time
from pathlib import Path
from urllib.request import urlopen

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.edge.options import Options as EdgeOptions
from werkzeug.serving import make_server

os.environ.setdefault("SECRET_KEY", "selenium-test-secret-key")

from app import app
from models import db


BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
os.environ.setdefault("SE_CACHE_PATH", os.path.join(BASE_DIR, ".selenium-cache"))
os.environ.setdefault("WDM_LOCAL", "1")


def _free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def _browser_options(options_class, profile_dir):
    options = options_class()
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
    return options


@pytest.fixture(scope="session")
def live_server_url():
    with tempfile.TemporaryDirectory(dir=BASE_DIR) as db_dir:
        test_db_path = Path(db_dir) / "selenium-test.db"
        app.config.update(
            TESTING=True,
            SECRET_KEY="selenium-test-secret-key",
            SQLALCHEMY_DATABASE_URI=f"sqlite:///{test_db_path}",
        )

        with app.app_context():
            db.drop_all()
            db.create_all()

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

        with app.app_context():
            db.session.remove()
            db.drop_all()


@pytest.fixture
def driver():
    with tempfile.TemporaryDirectory(dir=BASE_DIR) as profile_dir:
        errors = []
        try:
            browser = webdriver.Chrome(options=_browser_options(Options, profile_dir))
        except Exception as exc:
            errors.append(f"Chrome: {exc}")
            try:
                browser = webdriver.Edge(options=_browser_options(EdgeOptions, profile_dir))
            except Exception as edge_exc:
                errors.append(f"Edge: {edge_exc}")
                pytest.skip(
                    "Selenium requires a local browser engine. "
                    "Install Chrome or use Windows built-in Edge. "
                    + " | ".join(errors)
                )

        try:
            yield browser
        finally:
            browser.quit()
