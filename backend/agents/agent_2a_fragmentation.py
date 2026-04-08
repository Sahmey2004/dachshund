"""
Agent 2A — Fragmentation / Context Switch Analysis
Computes context switch rate and fragmentation index from tab events.
No OpenAI calls — pure Python math.
"""
from datetime import datetime, timedelta
from collections import defaultdict


def compute_fragmentation(events: list) -> dict:
    """
    Returns:
      - context_switch_rate: switches per active hour
      - fragmentation_index: 0-1 score (higher = more fragmented)
      - total_active_hours: total hours of tracked browsing
      - avg_session_min: mean session depth in minutes
      - switch_count: raw number of tab switches
    """
    if not events:
        return {
            "context_switch_rate": 0.0,
            "fragmentation_index": 0.0,
            "total_active_hours": 0.0,
            "avg_session_min": 0.0,
            "switch_count": 0,
        }

    # Sort by timestamp
    sorted_events = sorted(events, key=lambda e: e.get("timestamp", ""))

    total_duration_ms = sum(e.get("duration_ms", 0) for e in sorted_events)
    total_active_hours = total_duration_ms / 3_600_000

    # Count actual domain CHANGES (not raw entry count).
    # The new extension snapshots the same tab every 30s, so consecutive
    # entries with the same domain are NOT switches — only domain changes are.
    switch_count = _count_domain_switches(sorted_events)

    context_switch_rate = switch_count / total_active_hours if total_active_hours > 0 else 0.0

    # Aggregate consecutive same-domain runs into sessions, compute avg depth
    sessions_min = _session_depths_min(sorted_events)
    avg_session_min = sum(sessions_min) / len(sessions_min) if sessions_min else 0.0

    # Fragmentation index: domain switches per 10-min block, normalised to 0-1.
    # Theoretical ceiling: 10 different-domain switches in 10 minutes.
    max_window_switches = _max_domain_switches_in_window(sorted_events, window_minutes=10)
    fragmentation_index = min(1.0, max_window_switches / 10.0)

    return {
        "context_switch_rate": round(context_switch_rate, 2),
        "fragmentation_index": round(fragmentation_index, 4),
        "total_active_hours": round(total_active_hours, 2),
        "avg_session_min": round(avg_session_min, 2),
        "switch_count": switch_count,
    }


def _count_domain_switches(events: list) -> int:
    """Count the number of times the active domain changes between consecutive entries."""
    switches = 0
    prev_domain = None
    for e in events:
        domain = e.get("domain")
        if prev_domain is not None and domain != prev_domain:
            switches += 1
        prev_domain = domain
    return switches


def _session_depths_min(events: list) -> list:
    """
    Collapse consecutive same-domain runs into sessions.
    Returns list of session durations in minutes.
    """
    if not events:
        return []
    sessions = []
    current_domain = events[0].get("domain")
    current_ms = events[0].get("duration_ms", 0)
    for e in events[1:]:
        if e.get("domain") == current_domain:
            current_ms += e.get("duration_ms", 0)
        else:
            sessions.append(current_ms / 60_000)
            current_domain = e.get("domain")
            current_ms = e.get("duration_ms", 0)
    sessions.append(current_ms / 60_000)
    return sessions


def _max_domain_switches_in_window(events: list, window_minutes: int) -> int:
    """
    Find the max number of domain *changes* within any rolling time window.
    Uses a two-pointer approach on the switch-point timestamps.
    """
    if len(events) < 2:
        return 0

    # Build list of (timestamp, domain) for entries where domain changed
    switch_times = []
    prev = None
    for e in events:
        domain = e.get("domain")
        if prev is not None and domain != prev:
            try:
                switch_times.append(datetime.fromisoformat(e["timestamp"]).replace(tzinfo=None))
            except Exception:
                pass
        prev = domain

    if not switch_times:
        return 0

    window = timedelta(minutes=window_minutes)
    max_count = 0
    left = 0
    for right in range(len(switch_times)):
        while switch_times[right] - switch_times[left] > window:
            left += 1
        max_count = max(max_count, right - left + 1)

    return max_count
