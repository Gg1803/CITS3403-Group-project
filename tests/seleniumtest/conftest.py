"""Pytest configuration for the Selenium UI test suite.

Design (kept deliberately simple to be robust on a developer machine):

  * ONE live Flask server is started for the whole pytest session, listening
    on a free local port. It is backed by a temporary SQLite database file
    that is created inside the project directory and cleaned up at the end.
  * Before EACH test the database tables are dropped and re-created, so every
    test sees an empty, isolated "virtual database". No data leaks between
    tests, but we don't pay the cost of restarting the server / browser per
    test.
  * Selenium starts a real (headless) Chrome browser per test. Selenium 4's
    built-in "Selenium Manager" downloads a matching chromedriver
    automatically, cached under ``.selenium-cache/`` in the project root.

Required local software (one-time setup):
  * Google Chrome (or Microsoft Edge as fallback) installed in the standard
    Applications folder.
  * No need to install chromedriver manually — Selenium Manager handles it.
"""

import os
import shutil
import socket
import tempfile
import threading
import time
from pathlib import Path
from urllib.request import urlopen

import pytest
import sqlalchemy as sa
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.edge.options import Options as EdgeOptions
from werkzeug.serving import make_server

# Set BEFORE importing app so CSRFProtect picks up a real secret.
os.environ.setdefault("SECRET_KEY", "selenium-test-secret-key")

from app import app
from models import db


BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
# Tell Selenium Manager / WebDriver Manager to cache drivers inside the project
# so we don't depend on the user's global $HOME state.
os.environ.setdefault("SE_CACHE_PATH", os.path.join(BASE_DIR, ".selenium-cache"))
os.environ.setdefault("WDM_LOCAL", "1")


def _free_port() -> int:
    """Ask the OS for a currently-unused TCP port on localhost."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def _browser_options(options_class, profile_dir: str):
    """Build hardened headless options that work in CI and on macOS."""
    options = options_class()
    # options.add_argument("--headless=new")
    options.add_argument("--window-size=1440,1000")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-first-run")
    options.add_argument("--disable-background-networking")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-popup-blocking")
    # Per-driver Chrome profile dir avoids "user data dir already in use"
    # when tests run sequentially.
    options.add_argument(f"--user-data-dir={profile_dir}")
    return options


def _replace_sqlalchemy_engine(database_uri: str) -> None:
    """Swap the cached Flask-SQLAlchemy engine for one bound to ``database_uri``.

    ``app.py`` already called ``db.init_app(app)`` at import time, which builds
    an engine for whatever ``SQLALCHEMY_DATABASE_URI`` was configured back then
    (``sqlite:///database.db`` by default). Flask refuses to run ``init_app``
    a second time, so we manually dispose the old engine and slot a new one
    keyed to the per-test DB into ``db._app_engines``.
    """
    for engine in list(db._app_engines.get(app, {}).values()):
        try:
            engine.dispose()
        except Exception:
            pass
    new_engine = sa.create_engine(
        database_uri,
        # SQLite needs this so the engine connection can be used by the
        # werkzeug server thread which is different from the test thread.
        connect_args={"check_same_thread": False},
    )
    db._app_engines[app] = {None: new_engine}


@pytest.fixture(scope="session")
def _selenium_live_server():
    """Start ONE Flask live server bound to a temp DB for the whole session."""
    db_dir = Path(tempfile.mkdtemp(prefix="selenium-db-", dir=BASE_DIR))
    test_db_path = db_dir / "selenium-test.db"

    app.config.update(
        TESTING=True,
        SECRET_KEY="selenium-test-secret-key",
        SQLALCHEMY_DATABASE_URI=f"sqlite:///{test_db_path}",
        # The real app uses Flask-WTF CSRF tokens; the templates render them
        # for us, so we leave CSRF enabled and let the browser fetch them.
        WTF_CSRF_ENABLED=True,
    )

    _replace_sqlalchemy_engine(app.config["SQLALCHEMY_DATABASE_URI"])

    with app.app_context():
        db.drop_all()
        db.create_all()

    port = _free_port()
    server = make_server("127.0.0.1", port, app)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    base_url = f"http://127.0.0.1:{port}"

    # Block until the server actually accepts requests (max ~5s).
    for _ in range(50):
        try:
            urlopen(f"{base_url}/login", timeout=1)
            break
        except Exception:
            time.sleep(0.1)
    else:
        server.shutdown()
        thread.join(timeout=2)
        pytest.fail(f"Selenium live server did not start on {base_url}")

    try:
        yield base_url
    finally:
        server.shutdown()
        thread.join(timeout=2)
        with app.app_context():
            db.session.remove()
            try:
                db.drop_all()
            except Exception:
                pass
        shutil.rmtree(db_dir, ignore_errors=True)


@pytest.fixture
def live_server_url(_selenium_live_server):
    """Each test gets a freshly-empty database on the shared live server."""
    with app.app_context():
        db.session.remove()
        db.drop_all()
        db.create_all()
    return _selenium_live_server


@pytest.fixture
def driver():
    """Headless browser. Prefers Chrome, falls back to Edge."""
    with tempfile.TemporaryDirectory(dir=BASE_DIR) as profile_dir:
        errors = []
        try:
            browser = webdriver.Chrome(options=_browser_options(Options, profile_dir))
        except Exception as exc:
            errors.append(f"Chrome: {exc}")
            try:
                browser = webdriver.Edge(
                    options=_browser_options(EdgeOptions, profile_dir)
                )
            except Exception as edge_exc:
                errors.append(f"Edge: {edge_exc}")
                pytest.skip(
                    "Selenium requires a local browser. "
                    "Install Chrome (recommended) or use Edge. Details: "
                    + " | ".join(errors)
                )

        try:
            yield browser
        finally:
            browser.quit()
