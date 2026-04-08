"""
Agent 3 — Synthesis
Combines fragmentation + burnout flag data into a final burnout score.
Uses GPT-4o-mini to generate the risk tier and 3 recommendations.
"""
import os
import json
import openai

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    return _client


def _compute_raw_scores(frag: dict, burnout: dict) -> dict:
    """
    Compute sub-scores deterministically. Each capped at 33, sum → 0-100.

    Calibrated so the demo seed data (27% doomscroll, 17% passive, 90min session,
    10hr day, 30 switches) scores ~70-75 (AT_RISK tier).

    Exhaustion: passive escape + 90-min hyper-focus sessions + overwork hours
    Cynicism: doomscrolling time + raw context switch count
    Efficacy: low productive ratio + high context switch rate
    """
    # Exhaustion (max 33)
    exhaustion = (
        (burnout["passive_time_pct"] / 100) * 25
        + burnout["sessions_over_90min"] * 14
        + max(0, frag["total_active_hours"] - 8) * 5
        + burnout["late_night_events"] * 2
    )
    exhaustion = min(33.0, exhaustion)

    # Cynicism (max 33)
    cynicism = (
        (burnout["doomscroll_time_pct"] / 100) * 45
        + frag["switch_count"] * 0.35
    )
    cynicism = min(33.0, cynicism)

    # Efficacy loss (max 33)
    productive_ratio = burnout["productive_time_pct"] / 100
    efficacy = (
        (1 - productive_ratio) * 30
        + min(frag["context_switch_rate"] / 12, 1) * 5
    )
    efficacy = min(33.0, efficacy)

    total = exhaustion + cynicism + efficacy

    if total < 36:
        risk_tier = "BALANCED"
    elif total < 66:
        risk_tier = "CAUTION"
    elif total < 86:
        risk_tier = "AT_RISK"
    else:
        risk_tier = "CRITICAL"

    return {
        "exhaustion_score": round(exhaustion, 2),
        "cynicism_score": round(cynicism, 2),
        "efficacy_score": round(efficacy, 2),
        "total_score": round(total, 2),
        "risk_tier": risk_tier,
    }


def synthesize(frag: dict, burnout: dict, events: list) -> dict:
    """
    Run synthesis: compute scores + get AI recommendations.
    Returns full burnout score object.
    """
    scores = _compute_raw_scores(frag, burnout)

    # Build top sites summary for AI context
    from collections import Counter
    domain_time = Counter()
    for e in events:
        domain_time[e.get("domain", "unknown")] += e.get("duration_ms", 0)
    top_sites = ", ".join(
        f"{d} ({round(ms/60000)}min)" for d, ms in domain_time.most_common(5)
    )

    recommendations = _get_recommendations(scores, frag, burnout, top_sites)

    return {
        **scores,
        "context_switch_rate": frag["context_switch_rate"],
        "fragmentation_index": frag["fragmentation_index"],
        "total_active_hours": frag["total_active_hours"],
        "avg_session_min": frag["avg_session_min"],
        "doomscroll_time_pct": burnout["doomscroll_time_pct"],
        "passive_time_pct": burnout["passive_time_pct"],
        "productive_time_pct": burnout["productive_time_pct"],
        "sessions_over_90min": burnout["sessions_over_90min"],
        "recommendations": recommendations,
    }


def _get_recommendations(scores: dict, frag: dict, burnout: dict, top_sites: str) -> list:
    """Get 3 AI recommendations from GPT-4o-mini."""
    try:
        client = _get_client()
        prompt = f"""You are a cognitive health analyst. Based on this user's browsing data, give exactly 3 short, actionable recommendations.

BURNOUT SCORE: {scores['total_score']}/100 ({scores['risk_tier']})
- Exhaustion: {scores['exhaustion_score']}/33
- Cynicism: {scores['cynicism_score']}/33
- Efficacy Loss: {scores['efficacy_score']}/33

STATS:
- Context switches/hr: {frag['context_switch_rate']}
- Fragmentation index: {frag['fragmentation_index']}
- Doomscrolling time: {burnout['doomscroll_time_pct']}% of day
- Passive escape time: {burnout['passive_time_pct']}% of day
- Productive time: {burnout['productive_time_pct']}% of day
- Sessions over 90min: {burnout['sessions_over_90min']}
- Top sites: {top_sites}

Return ONLY a JSON array of exactly 3 strings. Each string is one specific, actionable recommendation (max 20 words). No preamble.
Example: ["Block Twitter for 2 hours after lunch.", "Take a 5-minute walk every 90 minutes.", "Batch your Slack to 3 times per day."]"""

        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.7,
        )
        text = resp.choices[0].message.content.strip()
        # Strip markdown code blocks if present
        text = text.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(text)
        if isinstance(parsed, list) and len(parsed) == 3:
            return parsed
    except Exception:
        pass

    # Fallback recommendations
    return _fallback_recommendations(scores, burnout)


def _fallback_recommendations(scores: dict, burnout: dict) -> list:
    recs = []
    if burnout["doomscroll_time_pct"] > 20:
        recs.append("Block social media apps during work hours to reduce doomscrolling.")
    if burnout["passive_time_pct"] > 15:
        recs.append("Replace YouTube/Netflix during breaks with a short walk instead.")
    if scores["efficacy_score"] > 15:
        recs.append("Try the Pomodoro technique: 25-min focus blocks with 5-min breaks.")
    if scores["exhaustion_score"] > 15:
        recs.append("Cap screen time at 8 hours and avoid screens after 10pm.")
    if len(recs) < 3:
        recs.append("Schedule a 15-minute no-screen break every 2 hours.")
    return recs[:3]
