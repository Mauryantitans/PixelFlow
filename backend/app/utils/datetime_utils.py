"""
Datetime helpers for timezone-safe comparisons.

All DB columns are declared as ``DateTime(timezone=True)``. PostgreSQL returns
timezone-aware datetimes, but SQLite (used for local dev via ``USE_SQLITE``)
ignores the timezone and returns *naive* datetimes. Comparing a naive value
read from the DB against ``datetime.now(timezone.utc)`` raises
``TypeError: can't compare offset-naive and offset-aware datetimes``.

Use :func:`ensure_aware` whenever a datetime read from the database is compared
in Python (SQL-level ``.filter()`` comparisons are unaffected).
"""

from datetime import datetime, timezone
from typing import Optional


def utcnow() -> datetime:
    """Timezone-aware current time in UTC."""
    return datetime.now(timezone.utc)


def ensure_aware(dt: Optional[datetime]) -> Optional[datetime]:
    """
    Return ``dt`` as a timezone-aware UTC datetime.

    Naive datetimes (e.g. read back from SQLite) are assumed to be UTC and
    tagged accordingly. ``None`` passes through unchanged.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt
