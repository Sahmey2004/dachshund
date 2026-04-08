"""
In-memory data store for tab events and burnout scores.
Single-user, no auth. Backed by a JSON file for persistence across restarts.
"""
import json
import os
from datetime import datetime, date
from threading import Lock

DATA_FILE = os.path.join(os.path.dirname(__file__), "data.json")

_lock = Lock()
_state = {
    "events": [],       # list of tab event dicts
    "latest_score": None,  # latest burnout score dict
}


def _load():
    """Load state from JSON file if it exists."""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r") as f:
                loaded = json.load(f)
                _state["events"] = loaded.get("events", [])
                _state["latest_score"] = loaded.get("latest_score")
        except Exception:
            pass


def _save():
    """Persist state to JSON file."""
    try:
        with open(DATA_FILE, "w") as f:
            json.dump(_state, f)
    except Exception:
        pass


_load()


def add_events(events: list):
    with _lock:
        _state["events"].extend(events)
        _save()


def get_today_events() -> list:
    today = date.today().isoformat()
    with _lock:
        return [
            e for e in _state["events"]
            if e.get("timestamp", "").startswith(today)
        ]


def get_all_events() -> list:
    with _lock:
        return list(_state["events"])


def set_score(score: dict):
    with _lock:
        _state["latest_score"] = score
        _save()


def get_score() -> dict | None:
    with _lock:
        return _state["latest_score"]


def clear_seeded():
    with _lock:
        _state["events"] = [e for e in _state["events"] if not e.get("is_seeded")]
        _save()


def clear_all():
    with _lock:
        _state["events"] = []
        _state["latest_score"] = None
        _save()
