"""
Seed 8 hours of realistic demo data that tells a burnout story.
Expected score: 72-82 (AT_RISK tier).
"""
from datetime import datetime, date, timedelta
import data_store


def build_seed_events() -> list:
    today = date.today()
    events = []

    def evt(hour, minute, domain, title, category, duration_min):
        ts = datetime(today.year, today.month, today.day, hour, minute, 0)
        return {
            "domain": domain,
            "title": title,
            "category": category,
            "duration_ms": duration_min * 60 * 1000,
            "hour": hour,
            "timestamp": ts.isoformat(),
            "is_seeded": True,
        }

    # 08:00 – 09:30 | Deep work
    events += [
        evt(8,  0,  "github.com",         "Pull Request Review",     "PRODUCTIVE",    45),
        evt(8,  45, "stackoverflow.com",   "Stack Overflow",          "PRODUCTIVE",    20),
        evt(9,  5,  "notion.so",           "Sprint Notes",            "PRODUCTIVE",    15),
        evt(9,  20, "docs.google.com",     "Design Doc",              "PRODUCTIVE",    10),
    ]

    # 09:30 – 10:30 | Meetings + comms
    events += [
        evt(9,  30, "zoom.us",             "Standup",                 "COMMUNICATION", 30),
        evt(10, 0,  "gmail.com",           "Inbox",                   "COMMUNICATION", 20),
        evt(10, 20, "slack.com",           "Team Chat",               "COMMUNICATION", 10),
    ]

    # 10:30 – 12:00 | Fragmentation begins
    events += [
        evt(10, 30, "github.com",          "Code Review",             "PRODUCTIVE",    10),
        evt(10, 40, "twitter.com",         "Twitter / X",             "FRAGMENTATION", 15),
        evt(10, 55, "reddit.com",          "Reddit",                  "FRAGMENTATION", 12),
        evt(11, 7,  "github.com",          "Code Review",             "PRODUCTIVE",    8),
        evt(11, 15, "youtube.com",         "YouTube",                 "PASSIVE_ESCAPE", 20),
        evt(11, 35, "reddit.com",          "Reddit",                  "FRAGMENTATION", 10),
        evt(11, 45, "twitter.com",         "Twitter / X",             "FRAGMENTATION", 5),
        evt(11, 50, "github.com",          "Code Review",             "PRODUCTIVE",    10),
    ]

    # 12:00 – 13:00 | Lunch + passive escape
    events += [
        evt(12, 0,  "youtube.com",         "YouTube – Tech Videos",   "PASSIVE_ESCAPE", 35),
        evt(12, 35, "netflix.com",         "Netflix",                 "PASSIVE_ESCAPE", 25),
    ]

    # 13:00 – 14:30 | Attempted recovery → drifts into shallow work
    events += [
        evt(13, 0,  "notion.so",           "Todo List",               "PRODUCTIVE",    15),
        evt(13, 15, "medium.com",          "Medium Article",          "SHALLOW_WORK",  20),
        evt(13, 35, "cnn.com",             "CNN News",                "SHALLOW_WORK",  15),
        evt(13, 50, "twitter.com",         "Twitter / X",             "FRAGMENTATION", 10),
        evt(14, 0,  "medium.com",          "Medium Article",          "SHALLOW_WORK",  10),
        evt(14, 10, "reddit.com",          "Reddit",                  "FRAGMENTATION", 10),
        evt(14, 20, "twitter.com",         "Twitter / X",             "FRAGMENTATION", 10),
    ]

    # 14:30 – 16:30 | Doomscrolling spiral (peak cynicism signal)
    events += [
        evt(14, 30, "twitter.com",         "Twitter / X",             "FRAGMENTATION", 20),
        evt(14, 50, "reddit.com",          "Reddit",                  "FRAGMENTATION", 25),
        evt(15, 15, "instagram.com",       "Instagram",               "FRAGMENTATION", 15),
        evt(15, 30, "tiktok.com",          "TikTok",                  "FRAGMENTATION", 20),
        evt(15, 50, "youtube.com",         "YouTube – Shorts",        "PASSIVE_ESCAPE", 25),
        evt(16, 15, "reddit.com",          "Reddit",                  "FRAGMENTATION", 15),
    ]

    # 16:30 – 18:00 | Late push — 90 min github block → exhaustion signal
    events += [
        evt(16, 30, "github.com",          "Feature Branch",          "PRODUCTIVE",    90),
    ]

    return events


def seed():
    data_store.clear_seeded()
    events = build_seed_events()
    data_store.add_events(events)
    return len(events)


if __name__ == "__main__":
    n = seed()
    print(f"Seeded {n} events.")
