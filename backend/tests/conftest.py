"""Shared pytest fixtures.

Sets a safe dev environment BEFORE any app module is imported (app.core.config
calls sys.exit(1) in production mode with the default SECRET_KEY), and provides
an isolated in-memory SQLite session.
"""

import os

os.environ.setdefault("DEBUG", "True")
os.environ.setdefault("USE_SQLITE", "True")
os.environ.setdefault("SECRET_KEY", "test-secret-key")

import pytest  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

import app.models.db_models  # noqa: E402,F401  (register tables on Base.metadata)
from app.core.database import Base  # noqa: E402


@pytest.fixture()
def db():
    """An isolated in-memory SQLite session with all tables created."""
    # StaticPool shares one connection so the in-memory DB is visible across
    # threads (TestClient runs sync routes in a worker thread).
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db):
    """FastAPI TestClient with get_db overridden to the in-memory session.

    Built without the lifespan context manager so startup side effects (file
    cleanup, background task) don't run. Works now that FastAPI/Starlette were
    bumped to a httpx-0.28-compatible version (Phase 6b)."""
    from fastapi.testclient import TestClient

    from app.core.database import get_db
    from app.main import app

    app.dependency_overrides[get_db] = lambda: db
    test_client = TestClient(app)
    try:
        yield test_client
    finally:
        app.dependency_overrides.clear()
