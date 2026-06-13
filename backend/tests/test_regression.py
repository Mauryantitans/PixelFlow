"""Regression tests for previously-fixed bugs."""

from datetime import datetime, timezone

from app.utils.datetime_utils import ensure_aware, utcnow
from app.utils.quota_manager import check_storage_quota
from app.utils.settings_manager import get_retention_policy, get_settings


def test_ensure_aware():
    assert ensure_aware(None) is None
    naive = datetime(2020, 1, 1)
    assert ensure_aware(naive).tzinfo == timezone.utc
    aware = datetime(2020, 1, 1, tzinfo=timezone.utc)
    assert ensure_aware(aware) is aware
    assert utcnow().tzinfo == timezone.utc


def test_retention_policy_reflects_db_settings(db):
    # defaults
    policy = get_retention_policy(db)
    assert policy["guest_upload"].total_seconds() == 24 * 3600
    assert policy["user_upload"].days == 7

    # editing the DB row changes enforcement (the headline admin-settings bug)
    s = get_settings(db)
    s.guest_upload_retention_hours = 1
    s.free_user_upload_retention_days = 30
    db.commit()
    policy = get_retention_policy(db)
    assert policy["guest_upload"].total_seconds() == 3600
    assert policy["user_upload"].days == 30


def test_quota_zero_does_not_crash_and_denies(db):
    s = get_settings(db)
    s.guest_storage_quota_mb = 0
    db.commit()

    result = check_storage_quota(
        db, user_id=None, session_id="sess-1", new_file_size=1000, is_admin=False
    )
    assert result["allowed"] is False
    assert result["percentage_used"] == 100.0  # no ZeroDivisionError


def test_admin_has_unlimited_quota(db):
    result = check_storage_quota(
        db, user_id=1, session_id="s", new_file_size=10_000_000, is_admin=True
    )
    assert result["allowed"] is True
    assert result.get("unlimited") is True
