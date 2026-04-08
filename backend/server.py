"""
Dachshund — FastAPI Backend
"""
import os
from collections import Counter
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel
from typing import List, Optional
import data_store
import pipeline
import seed as seed_module

app = FastAPI(title="Dachshund API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Models ────────────────────────────────────────────────────────────────────

class TabEvent(BaseModel):
    domain: str
    title: Optional[str] = ""
    category: Optional[str] = "UNKNOWN"
    duration_ms: int
    hour: int
    timestamp: str
    is_seeded: Optional[bool] = False


class EventBatch(BaseModel):
    events: List[TabEvent]


class ChatRequest(BaseModel):
    message: str


def _site_minutes(events: list) -> list[str]:
    domain_durations = Counter()

    for event in events:
        domain = event.get("domain") or "unknown"
        domain_durations[domain] += max(0, event.get("duration_ms", 0))

    top_domains = domain_durations.most_common(5)
    return [f"{domain} ({round(duration / 60000)} min)" for domain, duration in top_domains]


def _category_minutes(events: list) -> list[str]:
    category_durations = Counter()

    for event in events:
        category = event.get("category") or "UNKNOWN"
        category_durations[category] += max(0, event.get("duration_ms", 0))

    top_categories = category_durations.most_common()
    return [f"{category}: {round(duration / 60000)} min" for category, duration in top_categories]


def _latest_score(events: list) -> dict:
    score = data_store.get_score()
    if score is None:
        score = pipeline.run_pipeline(events)
        data_store.set_score(score)
    return score


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "app": "dachshund"}


@app.post("/events")
def log_events(batch: EventBatch):
    """Receive tab events from the Chrome extension."""
    events = [e.model_dump() for e in batch.events]
    data_store.add_events(events)
    return {"received": len(events)}


@app.get("/events")
def get_events(limit: int = 50):
    """Return today's tab events for the live feed."""
    events = data_store.get_today_events()
    # Sort newest first
    events = sorted(events, key=lambda e: e.get("timestamp", ""), reverse=True)
    return {"events": events[:limit]}


@app.post("/analyze")
def analyze():
    """Run the full agent pipeline and return the burnout score."""
    events = data_store.get_today_events()
    score = pipeline.run_pipeline(events)
    data_store.set_score(score)
    return score


@app.get("/score")
def get_score():
    """Return the latest cached burnout score."""
    score = data_store.get_score()
    if score is None:
        # Run pipeline on demand if no score yet
        events = data_store.get_today_events()
        score = pipeline.run_pipeline(events)
        data_store.set_score(score)
    return score


@app.post("/seed")
def seed_data():
    """Insert demo seed data."""
    n = seed_module.seed()
    return {"seeded": n}


@app.delete("/seed")
def clear_seed():
    """Clear seed data."""
    data_store.clear_seeded()
    return {"cleared": True}


@app.delete("/all")
def clear_all():
    """Clear all data (for dev/testing)."""
    data_store.clear_all()
    return {"cleared": True}


@app.post("/chat")
def chat(request: ChatRequest):
    """Answer dashboard questions using today's live data."""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message is required.")

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not configured on the backend.")

    events = data_store.get_today_events()
    score = _latest_score(events)

    system_prompt = (
        "You are Burnout Buddy, a warm and concise assistant inside the Dachshund dashboard. "
        "Use the provided browsing and score context to answer clearly. "
        "Do not frame the score as a diagnosis. "
        "Suggest practical, low-pressure next steps. "
        "Keep answers under 180 words unless the user asks for more detail."
    )

    context_prompt = (
        f"Today's score: {score.get('total_score', 0)}/100\n"
        f"Risk tier: {score.get('risk_tier', 'BALANCED')}\n"
        f"Exhaustion: {score.get('exhaustion_score', 0)}\n"
        f"Cynicism: {score.get('cynicism_score', 0)}\n"
        f"Efficacy loss: {score.get('efficacy_score', 0)}\n"
        f"Context switch rate: {score.get('context_switch_rate', 0)} per hour\n"
        f"Active hours: {score.get('total_active_hours', 0)}\n"
        f"Average session: {score.get('avg_session_min', 0)} minutes\n"
        f"Doomscroll time: {score.get('doomscroll_time_pct', 0)}%\n"
        f"Passive time: {score.get('passive_time_pct', 0)}%\n"
        f"Productive time: {score.get('productive_time_pct', 0)}%\n"
        f"Events tracked today: {len(events)}\n"
        f"Top sites: {', '.join(_site_minutes(events)) or 'No browsing data yet'}\n"
        f"Time by category: {', '.join(_category_minutes(events)) or 'No category data yet'}\n"
        f"Current recommendations: {', '.join(score.get('recommendations', [])) or 'None yet'}"
    )

    try:
        client = OpenAI(api_key=api_key)
        completion = client.chat.completions.create(
            model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
            temperature=0.7,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"{context_prompt}\n\nUser question: {request.message.strip()}"},
            ],
        )
        reply = completion.choices[0].message.content or "I don't have a response yet. Please try asking again."
        return {"reply": reply}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Chat request failed: {exc}") from exc


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
