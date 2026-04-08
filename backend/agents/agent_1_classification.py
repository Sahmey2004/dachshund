"""
Agent 1 — URL Classification
Classifies UNKNOWN domains using OpenAI GPT-4o-mini.
Known domains are pre-classified locally (same dict as the Chrome extension).
"""
import os
import json
import openai

CATEGORY_MAP = {
    # Fragmentation / doomscrolling
    "twitter.com":   "FRAGMENTATION",
    "x.com":         "FRAGMENTATION",
    "reddit.com":    "FRAGMENTATION",
    "tiktok.com":    "FRAGMENTATION",
    "instagram.com": "FRAGMENTATION",
    "facebook.com":  "FRAGMENTATION",
    "snapchat.com":  "FRAGMENTATION",
    "threads.net":   "FRAGMENTATION",

    # Passive escape
    "youtube.com":   "PASSIVE_ESCAPE",
    "netflix.com":   "PASSIVE_ESCAPE",
    "twitch.tv":     "PASSIVE_ESCAPE",
    "hulu.com":      "PASSIVE_ESCAPE",
    "disneyplus.com": "PASSIVE_ESCAPE",
    "primevideo.com": "PASSIVE_ESCAPE",

    # Shallow work / news
    "cnn.com":       "SHALLOW_WORK",
    "bbc.com":       "SHALLOW_WORK",
    "nytimes.com":   "SHALLOW_WORK",
    "medium.com":    "SHALLOW_WORK",
    "buzzfeed.com":  "SHALLOW_WORK",
    "theverge.com":  "SHALLOW_WORK",
    "hackernews.com": "SHALLOW_WORK",
    "news.ycombinator.com": "SHALLOW_WORK",

    # Productive
    "github.com":         "PRODUCTIVE",
    "stackoverflow.com":  "PRODUCTIVE",
    "notion.so":          "PRODUCTIVE",
    "figma.com":          "PRODUCTIVE",
    "docs.google.com":    "PRODUCTIVE",
    "sheets.google.com":  "PRODUCTIVE",
    "slides.google.com":  "PRODUCTIVE",
    "drive.google.com":   "PRODUCTIVE",
    "localhost":          "PRODUCTIVE",
    "127.0.0.1":          "PRODUCTIVE",
    "linear.app":         "PRODUCTIVE",
    "jira.atlassian.com": "PRODUCTIVE",
    "confluence.atlassian.com": "PRODUCTIVE",
    "trello.com":         "PRODUCTIVE",
    "code.visualstudio.com": "PRODUCTIVE",
    "developer.mozilla.org": "PRODUCTIVE",

    # Communication
    "gmail.com":             "COMMUNICATION",
    "mail.google.com":       "COMMUNICATION",
    "slack.com":             "COMMUNICATION",
    "zoom.us":               "COMMUNICATION",
    "calendar.google.com":   "COMMUNICATION",
    "teams.microsoft.com":   "COMMUNICATION",
    "discord.com":           "COMMUNICATION",
    "outlook.live.com":      "COMMUNICATION",

    # Recovery
    "spotify.com":    "RECOVERY",
    "calm.com":       "RECOVERY",
    "headspace.com":  "RECOVERY",
}

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    return _client


def classify_domain(domain: str) -> str:
    """Return category for a domain. Uses local dict first, then OpenAI."""
    # Strip www. prefix
    domain = domain.replace("www.", "")

    # Check local map
    if domain in CATEGORY_MAP:
        return CATEGORY_MAP[domain]

    # Check parent domain (e.g. maps.google.com → google.com)
    parts = domain.split(".")
    if len(parts) >= 2:
        parent = ".".join(parts[-2:])
        if parent in CATEGORY_MAP:
            return CATEGORY_MAP[parent]

    # Fallback to OpenAI
    try:
        client = _get_client()
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You classify website domains into exactly one of these categories: "
                        "PRODUCTIVE, COMMUNICATION, FRAGMENTATION, PASSIVE_ESCAPE, SHALLOW_WORK, RECOVERY, UNKNOWN. "
                        "Respond with ONLY the category name, nothing else."
                    ),
                },
                {"role": "user", "content": f"Domain: {domain}"},
            ],
            max_tokens=10,
            temperature=0,
        )
        result = resp.choices[0].message.content.strip().upper()
        valid = {"PRODUCTIVE", "COMMUNICATION", "FRAGMENTATION", "PASSIVE_ESCAPE", "SHALLOW_WORK", "RECOVERY", "UNKNOWN"}
        return result if result in valid else "UNKNOWN"
    except Exception:
        return "UNKNOWN"


def classify_events(events: list) -> list:
    """Classify any UNKNOWN events in the list. Returns updated list."""
    for event in events:
        if event.get("category") in (None, "UNKNOWN", ""):
            event["category"] = classify_domain(event.get("domain", ""))
    return events
