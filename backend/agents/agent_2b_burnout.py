"""
Agent 2B — Burnout Pattern Detection
Detects doomscrolling, passive escape, 90-min hyper-focus, and late-night flags.
No OpenAI calls — pure Python analysis.
"""
from datetime import datetime


DOOMSCROLL_CATS = {"FRAGMENTATION"}
PASSIVE_CATS = {"PASSIVE_ESCAPE"}
PRODUCTIVE_CATS = {"PRODUCTIVE"}


def detect_burnout_flags(events: list) -> dict:
    """
    Returns:
      - doomscroll_time_pct: % of total time on fragmentation/doomscroll sites
      - passive_time_pct: % of total time on passive escape sites
      - productive_time_pct: % of total time on productive sites
      - sessions_over_90min: count of single-site sessions > 90 min
      - late_night_events: count of events after 10pm
      - doomscroll_ms: raw ms on doomscroll sites
      - passive_ms: raw ms on passive sites
      - total_ms: total tracked ms
    """
    if not events:
        return {
            "doomscroll_time_pct": 0.0,
            "passive_time_pct": 0.0,
            "productive_time_pct": 0.0,
            "sessions_over_90min": 0,
            "late_night_events": 0,
            "doomscroll_ms": 0,
            "passive_ms": 0,
            "total_ms": 0,
        }

    total_ms = sum(e.get("duration_ms", 0) for e in events)
    doomscroll_ms = sum(e.get("duration_ms", 0) for e in events if e.get("category") in DOOMSCROLL_CATS)
    passive_ms = sum(e.get("duration_ms", 0) for e in events if e.get("category") in PASSIVE_CATS)
    productive_ms = sum(e.get("duration_ms", 0) for e in events if e.get("category") in PRODUCTIVE_CATS)

    doomscroll_pct = (doomscroll_ms / total_ms * 100) if total_ms > 0 else 0.0
    passive_pct = (passive_ms / total_ms * 100) if total_ms > 0 else 0.0
    productive_pct = (productive_ms / total_ms * 100) if total_ms > 0 else 0.0

    # Detect 90-min continuous blocks on any single domain
    sessions_over_90 = _count_long_sessions(events, threshold_min=90)

    # Late night (after 22:00)
    late_night = sum(1 for e in events if _is_late_night(e))

    return {
        "doomscroll_time_pct": round(doomscroll_pct, 2),
        "passive_time_pct": round(passive_pct, 2),
        "productive_time_pct": round(productive_pct, 2),
        "sessions_over_90min": sessions_over_90,
        "late_night_events": late_night,
        "doomscroll_ms": doomscroll_ms,
        "passive_ms": passive_ms,
        "total_ms": total_ms,
    }


def _count_long_sessions(events: list, threshold_min: int) -> int:
    """
    Count consecutive same-domain blocks that exceed threshold_min total minutes.
    """
    if not events:
        return 0

    sorted_events = sorted(events, key=lambda e: e.get("timestamp", ""))
    count = 0
    i = 0
    while i < len(sorted_events):
        domain = sorted_events[i].get("domain")
        block_ms = sorted_events[i].get("duration_ms", 0)
        j = i + 1
        while j < len(sorted_events) and sorted_events[j].get("domain") == domain:
            block_ms += sorted_events[j].get("duration_ms", 0)
            j += 1
        if block_ms / 60_000 >= threshold_min:
            count += 1
        i = j if j > i else i + 1

    return count


def _is_late_night(event: dict) -> bool:
    hour = event.get("hour")
    if hour is not None:
        return hour >= 22
    try:
        ts = datetime.fromisoformat(event.get("timestamp", ""))
        return ts.hour >= 22
    except Exception:
        return False
