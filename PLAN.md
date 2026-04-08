# Dachshund — Build Plan

> Mental health / burnout detection hackathon project.
> Chrome Extension + FastAPI backend + React dashboard.
> Name: **dachshund** 🐾

---

## Stack

| Layer | Technology |
|---|---|
| Chrome Extension | Manifest V3, Vanilla JS |
| Backend | Python, FastAPI, port 8000 |
| AI Agents | OpenAI GPT-4o-mini |
| Storage | In-memory + `backend/data.json` (no auth, single user) |
| Frontend | React + Vite, port 5173 |

---

## Project Structure

```
dachshund/
├── extension/
│   ├── manifest.json        # MV3 manifest — permissions, content_scripts
│   ├── background.js        # Snapshots active tab every 30s → chrome.storage.local
│   ├── bridge.js            # Content script on localhost:5173 → syncs storage to backend
│   ├── popup.html           # Extension popup UI
│   ├── popup.js             # Popup logic — reads storage, shows local score
│   └── icon.png
│
├── backend/
│   ├── server.py            # FastAPI app — all routes
│   ├── pipeline.py          # Orchestrates agents (ThreadPoolExecutor)
│   ├── data_store.py        # In-memory event list + latest score, backed by data.json
│   ├── seed.py              # 31-event demo dataset → AT_RISK ~74
│   ├── agents/
│   │   ├── agent_1_classification.py   # Classify domain → category (local dict + OpenAI fallback)
│   │   ├── agent_2a_fragmentation.py  # Context switch rate, fragmentation index, session depth
│   │   ├── agent_2b_burnout.py        # Doomscroll%, passive%, 90min sessions, late-night flags
│   │   └── agent_3_synthesis.py       # Final score (0-100) + 3 AI recommendations
│   └── requirements.txt
│
├── dashboard/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                      # Main layout, "Load Demo Data" button
│       ├── index.css                    # Dark theme design tokens
│       ├── components/
│       │   ├── BurnoutGauge.jsx         # SVG arc dial 0-100, color-coded
│       │   ├── AlertBanner.jsx          # Risk tier banner, pulses on AT_RISK/CRITICAL
│       │   ├── LiveFeed.jsx             # Newest-first tab event stream
│       │   ├── TimelineChart.jsx        # Recharts stacked area chart by hour
│       │   ├── SiteBreakdown.jsx        # Recharts pie chart by category
│       │   └── RecommendationCards.jsx  # 3 AI-generated recommendation cards
│       └── hooks/
│           ├── useBurnoutScore.js       # Polls POST /analyze every 60s
│           └── useTabEvents.js          # Polls GET /events every 10s
│
├── PLAN.md
├── README.md
└── .gitignore
```

---

## How It Works

### Data Flow

```
background.js
  Every 30s → snapshots active tab → chrome.storage.local["YYYY-MM-DD"]
  { entries: [{ url, title, duration: 30, category, timestamp }], tabSwitches: N }

bridge.js  (content script, runs when dashboard tab is open)
  Every 30s → reads chrome.storage.local
           → transforms entries to backend format
           → POST http://localhost:8000/events
           → tracks synced pointer (bridge_synced_YYYY-MM-DD) to avoid duplicates

FastAPI Backend
  POST /events  → stores events in data_store
  POST /analyze → runs agent pipeline → returns score
  GET  /events  → returns today's events (newest first)
  GET  /score   → returns cached score
  POST /seed    → inserts demo data (31 events, 8h story)
  DELETE /seed  → clears seeded events

React Dashboard
  useBurnoutScore  → POST /analyze every 60s
  useTabEvents     → GET /events every 10s
  "Load Demo Data" → POST /seed then POST /analyze
```

### Agent Pipeline

```
Stage 1 — Sequential
  Agent 1: classify UNKNOWN domains via OpenAI GPT-4o-mini
           (known domains resolved from local dict — no API call needed)

Stage 2 — Parallel (ThreadPoolExecutor, 2 workers)
  Agent 2A: fragmentation analysis
    - switch_count  = domain CHANGES between consecutive entries (not raw entry count)
    - context_switch_rate = switches / active_hours
    - fragmentation_index = max domain switches in any 10-min window / 10
    - avg_session_min = mean of consecutive same-domain run durations

  Agent 2B: burnout pattern flags
    - doomscroll_time_pct  = % time on FRAGMENTATION sites
    - passive_time_pct     = % time on PASSIVE_ESCAPE sites
    - productive_time_pct  = % time on PRODUCTIVE sites
    - sessions_over_90min  = count of single-domain runs > 90 consecutive minutes
    - late_night_events    = count of events after 22:00

Stage 3 — Sequential
  Agent 3: synthesis → deterministic score + GPT-4o-mini recommendations
```

---

## Burnout Score Formula

Each sub-score capped at 33. Sum = 0–99 (rounds to 0–100).

```
Exhaustion  = (passive_time_pct / 100) × 25
            + sessions_over_90min × 14
            + max(0, total_active_hours − 8) × 5
            + late_night_events × 2
            [cap 33]

Cynicism    = (doomscroll_time_pct / 100) × 45
            + switch_count × 0.35
            [cap 33]

Efficacy    = (1 − productive_time_pct / 100) × 30
            + min(context_switch_rate / 12, 1) × 5
            [cap 33]

Total       = Exhaustion + Cynicism + Efficacy
```

| Score | Risk Tier |
|---|---|
| 0 – 35 | 🟢 BALANCED |
| 36 – 65 | 🟡 CAUTION |
| 66 – 85 | 🟠 AT_RISK |
| 86 – 100 | 🔴 CRITICAL |

Demo seed data scores **~74 (AT_RISK)**.

---

## Category Map

### Extension categories → Backend categories

| Extension | Backend | Sites |
|---|---|---|
| `social` | `FRAGMENTATION` | Twitter, TikTok, Reddit, Instagram, Facebook |
| `entertainment` | `PASSIVE_ESCAPE` | Netflix, Twitch, Disney+, Hulu |
| `productivity` | `PRODUCTIVE` | GitHub, Notion, Figma, Docs |
| `news` | `SHALLOW_WORK` | CNN, BBC, NYT |
| `other` | `UNKNOWN` | → Agent 1 classifies |

Bridge.js applies a more precise **domain-level override** (e.g. YouTube → `PASSIVE_ESCAPE`, not `FRAGMENTATION`) before falling back to the coarse extension category.

---

## Extension → Dashboard Bridge

The new extension stores data in `chrome.storage.local` and never POSTs to the backend.
`bridge.js` is a **content script** injected into the dashboard page (`localhost:5173`).
It runs in extension context (has access to `chrome.storage`) and bridges data to the backend via fetch.

Key details:
- Runs every 30s, same cadence as the background snapshot
- Tracks `bridge_synced_YYYY-MM-DD` index in storage to send only NEW entries
- Filters out `chrome://` and `chrome-extension://` URLs
- Domain-level category classification (mirrors `agent_1_classification.py`)

---

## Running the Project

```bash
# Terminal 1 — Backend
cd dachshund/backend
# Set OPENAI_API_KEY in .env (optional — fallback recs work without it)
uvicorn server:app --reload --port 8000

# Terminal 2 — Dashboard
cd dachshund/dashboard
npm install
npm run dev
# → http://localhost:5173

# Chrome — Load Extension
# chrome://extensions → Developer Mode → Load unpacked → select /extension
# Reload extension after any changes to background.js, bridge.js, manifest.json
```

---

## Demo Script (2 minutes)

1. Start backend + dashboard
2. Click **"Load Demo Data"** → score jumps to **~74 AT_RISK**
3. Show the orange pulsing **AlertBanner** — "Burnout is building"
4. Point to **BurnoutGauge** — explain Exhaustion / Cynicism / Efficacy (MBI dimensions)
5. Show **TimelineChart** — doomscrolling spiral visible in 14:30–16:30 block
6. Show **SiteBreakdown** pie — Doomscroll + Passive = nearly half the day
7. Show **RecommendationCards** — AI-generated from real browsing data
8. Show extension **popup** — score, tab switches, sites visited, live tracking
9. Browse any site → watch **LiveFeed** update in real time within 30s

---

## Environment

```bash
# backend/.env
OPENAI_API_KEY=sk-...   # For AI recommendations (fallback recs work without it)
PORT=8000
```

---

## What's Done ✅

- [x] Chrome Extension (MV3) — tab snapshot every 30s, tab switch counter
- [x] `bridge.js` content script — syncs storage to backend automatically
- [x] FastAPI backend — all routes, in-memory store, JSON persistence
- [x] 4-agent pipeline — classification, fragmentation, burnout flags, synthesis
- [x] Seed data — 31-event 8h demo story, AT_RISK score ~74
- [x] React dashboard — Gauge, AlertBanner, LiveFeed, TimelineChart, SiteBreakdown, RecommendationCards
- [x] "Load Demo Data" + "Clear Demo" buttons in dashboard header
- [x] Extension popup → "Open Dashboard" links to localhost:5173

## What's Next 🔲

- [ ] Designs / styling pass (currently functional dark theme prototype)
- [ ] AI chat interface (ask "why is my score high?")
- [ ] Historical data view (yesterday, last 7 days)
- [ ] Notifications / alerts when score crosses threshold
- [ ] Package for production (remove localhost hardcoding)
