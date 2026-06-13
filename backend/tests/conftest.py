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

import app.models.db_models  # noqa: E402,F401  (register tables on Base.metadata)
from app.core.database import Base  # noqa: E402


@pytest.fixture()
def db():
    """An isolated in-memory SQLite session with all tables created."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
