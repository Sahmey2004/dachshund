"""
Pipeline — Orchestrate the agent pipeline (following HackPrinceton pattern).

Stage 1 (sequential): Agent 1 — classify unknown domains
Stage 2 (parallel):   Agent 2A (fragmentation) + Agent 2B (burnout flags)
Stage 3 (sequential): Agent 3 — synthesis → final score
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

from agents.agent_1_classification import classify_events
from agents.agent_2a_fragmentation import compute_fragmentation
from agents.agent_2b_burnout import detect_burnout_flags
from agents.agent_3_synthesis import synthesize


def run_pipeline(events: list) -> dict:
    """
    Run full burnout analysis pipeline on a list of tab events.
    Returns a burnout score dict.
    """
    if not events:
        return _empty_score()

    # Stage 1 — classify unknown events
    events = classify_events(events)

    # Stage 2 — parallel fragmentation + burnout analysis
    frag_result = None
    burnout_result = None

    with ThreadPoolExecutor(max_workers=2) as executor:
        frag_future = executor.submit(compute_fragmentation, events)
        burnout_future = executor.submit(detect_burnout_flags, events)

        for future in as_completed([frag_future, burnout_future]):
            if future == frag_future:
                frag_result = future.result()
            else:
                burnout_result = future.result()

    # Stage 3 — synthesis
    score = synthesize(frag_result, burnout_result, events)
    score["computed_at"] = datetime.now().isoformat()

    return score


def _empty_score() -> dict:
    return {
        "exhaustion_score": 0.0,
        "cynicism_score": 0.0,
        "efficacy_score": 0.0,
        "total_score": 0.0,
        "risk_tier": "BALANCED",
        "context_switch_rate": 0.0,
        "fragmentation_index": 0.0,
        "total_active_hours": 0.0,
        "avg_session_min": 0.0,
        "doomscroll_time_pct": 0.0,
        "passive_time_pct": 0.0,
        "productive_time_pct": 0.0,
        "sessions_over_90min": 0,
        "recommendations": [
            "Start tracking your tabs to get personalized insights.",
            "Install the Dachshund Chrome extension to begin.",
            "Your burnout score will update as you browse.",
        ],
        "computed_at": datetime.now().isoformat(),
    }
