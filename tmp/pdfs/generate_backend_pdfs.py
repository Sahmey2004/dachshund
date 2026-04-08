from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = ROOT / "output" / "pdf"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


PALETTE = {
    "ink": colors.HexColor("#3f291d"),
    "muted": colors.HexColor("#6f5847"),
    "teal": colors.HexColor("#6daeb1"),
    "cream": colors.HexColor("#fff8ef"),
    "lavender": colors.HexColor("#e7dcf3"),
    "peach": colors.HexColor("#ffe4cf"),
    "sky": colors.HexColor("#dceff2"),
    "border": colors.HexColor("#dbc8b8"),
    "rose": colors.HexColor("#d58982"),
}


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="DocTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=26,
        leading=30,
        textColor=PALETTE["ink"],
        alignment=TA_CENTER,
        spaceAfter=10,
    )
)
styles.add(
    ParagraphStyle(
        name="DocSubtitle",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=14,
        textColor=PALETTE["muted"],
        alignment=TA_CENTER,
        spaceAfter=18,
    )
)
styles.add(
    ParagraphStyle(
        name="SectionTitle",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=PALETTE["ink"],
        spaceBefore=8,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="SubTitle",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=PALETTE["ink"],
        spaceBefore=6,
        spaceAfter=4,
    )
)
styles.add(
    ParagraphStyle(
        name="BodyCopy",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10.2,
        leading=14.5,
        textColor=PALETTE["ink"],
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="SmallCopy",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9,
        leading=12.2,
        textColor=PALETTE["muted"],
        spaceAfter=4,
    )
)
styles.add(
    ParagraphStyle(
        name="Callout",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=14,
        textColor=PALETTE["ink"],
        backColor=PALETTE["peach"],
        borderPadding=10,
        borderColor=PALETTE["border"],
        borderWidth=0.5,
        borderRadius=8,
        spaceBefore=8,
        spaceAfter=10,
    )
)
styles.add(
    ParagraphStyle(
        name="Mono",
        parent=styles["BodyText"],
        fontName="Courier",
        fontSize=8.8,
        leading=12,
        textColor=PALETTE["ink"],
        backColor=colors.HexColor("#faf4ec"),
        borderPadding=8,
        borderColor=PALETTE["border"],
        borderWidth=0.5,
        borderRadius=6,
        spaceBefore=4,
        spaceAfter=8,
    )
)


def p(text, style="BodyCopy"):
    return Paragraph(text, styles[style])


def bullets(items):
    return ListFlowable(
        [
            ListItem(Paragraph(item, styles["BodyCopy"]), leftIndent=4)
            for item in items
        ],
        bulletType="bullet",
        bulletFontName="Helvetica",
        bulletFontSize=9,
        leftIndent=18,
        bulletOffsetY=1,
        spaceAfter=8,
    )


def table(data, widths):
    wrapped = []
    for row_index, row in enumerate(data):
        wrapped_row = []
        for cell in row:
            cell_text = str(cell)
            style = styles["SmallCopy"] if row_index > 0 else styles["BodyCopy"]
            wrapped_row.append(Paragraph(cell_text, style))
        wrapped.append(wrapped_row)

    tbl = Table(wrapped, colWidths=widths, hAlign="LEFT")
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), PALETTE["sky"]),
                ("TEXTCOLOR", (0, 0), (-1, 0), PALETTE["ink"]),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [PALETTE["cream"], colors.white]),
                ("BOX", (0, 0), (-1, -1), 0.5, PALETTE["border"]),
                ("INNERGRID", (0, 0), (-1, -1), 0.35, PALETTE["border"]),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return tbl


def build_doc(filename, title, subtitle, story):
    path = OUTPUT_DIR / filename
    doc = SimpleDocTemplate(
        str(path),
        pagesize=letter,
        leftMargin=0.68 * inch,
        rightMargin=0.68 * inch,
        topMargin=0.72 * inch,
        bottomMargin=0.62 * inch,
        title=title,
        author="OpenAI Codex",
    )

    def decorate(canvas, document):
        canvas.saveState()
        width, height = letter
        canvas.setFillColor(PALETTE["cream"])
        canvas.rect(0, 0, width, height, fill=1, stroke=0)
        canvas.setFillColor(PALETTE["sky"])
        canvas.circle(width - 58, height - 44, 24, fill=1, stroke=0)
        canvas.setFillColor(PALETTE["lavender"])
        canvas.circle(48, 48, 16, fill=1, stroke=0)
        canvas.setStrokeColor(PALETTE["border"])
        canvas.setLineWidth(0.5)
        canvas.line(doc.leftMargin, height - 34, width - doc.rightMargin, height - 34)
        canvas.setFont("Helvetica-Bold", 9)
        canvas.setFillColor(PALETTE["ink"])
        canvas.drawString(doc.leftMargin, height - 28, "Dachshund Hackathon Prep")
        canvas.setFont("Helvetica", 8.5)
        canvas.setFillColor(PALETTE["muted"])
        canvas.drawRightString(width - doc.rightMargin, 22, f"Page {document.page}")
        canvas.restoreState()

    full_story = [Spacer(1, 0.2 * inch), p(title, "DocTitle"), p(subtitle, "DocSubtitle")] + story
    doc.build(full_story, onFirstPage=decorate, onLaterPages=decorate)
    return path


def architecture_story():
    return [
        p("1. System in One Sentence", "SectionTitle"),
        p(
            "Dachshund is a local-first burnout tracking demo: the Chrome extension records browsing behavior, the FastAPI backend stores the resulting tab events and computes a burnout score, and the React dashboard polls the backend to visualize the result.",
        ),
        p(
            "Important framing for judges: the backend is the scoring brain. It does not drive browser collection directly; it receives normalized events from the extension bridge and turns them into analysis.",
            "Callout",
        ),
        p("2. Backend Responsibilities", "SectionTitle"),
        bullets(
            [
                "<b>API layer:</b> exposes the routes in <font name='Courier'>backend/server.py</font> for ingesting events, running analysis, seeding demo data, clearing data, fetching cached scores, and chatting with the Buddy assistant.",
                "<b>Persistence layer:</b> stores today's events and the latest score in process memory, mirrored into <font name='Courier'>backend/data.json</font> so restarts do not wipe the demo instantly.",
                "<b>Analysis orchestration:</b> runs a three-stage pipeline in <font name='Courier'>backend/pipeline.py</font> using parallel workers where it makes sense.",
                "<b>Agent execution:</b> performs deterministic metrics in agents 2A and 2B, and LLM-backed classification/recommendation generation in agents 1 and 3.",
                "<b>Demo support:</b> injects a prebuilt eight-hour story via <font name='Courier'>backend/seed.py</font> so the dashboard has something impressive to show instantly.",
            ]
        ),
        p("3. File-by-File Backend Map", "SectionTitle"),
        table(
            [
                ["File", "What it does", "Why it matters in Q&A"],
                ["server.py", "FastAPI app, Pydantic request models, route handlers, CORS, and the OpenAI-backed /chat endpoint.", "This is the entry point and the easiest file to walk through live."],
                ["data_store.py", "Thread-safe in-memory state with JSON persistence and helper methods for events and score.", "Explains the single-user prototype nature of the backend."],
                ["pipeline.py", "Orchestrates classification, fragmentation, burnout flagging, and synthesis.", "Shows why this is framed as a multi-agent pipeline rather than one big function."],
                ["agents/agent_1_classification.py", "Classifies unknown domains with a local map first and GPT fallback second.", "Good answer for judges asking how you avoid expensive LLM calls."],
                ["agents/agent_2a_fragmentation.py", "Calculates context switching and fragmentation from ordered events.", "This is where the productivity-loss reasoning becomes concrete."],
                ["agents/agent_2b_burnout.py", "Computes doomscrolling, passive escape, productive ratio, long sessions, and late-night flags.", "This is the behavior-engineered signal layer."],
                ["agents/agent_3_synthesis.py", "Turns metrics into scores and recommendations.", "This is the scoring formula and recommendation generator judges will ask about."],
                ["seed.py", "Builds the curated demo day that reliably lands in AT_RISK territory.", "Lets you explain how the demo is calibrated and reproducible."],
            ],
            [1.35 * inch, 2.75 * inch, 2.35 * inch],
        ),
        Spacer(1, 0.12 * inch),
        p("4. End-to-End Data Flow", "SectionTitle"),
        p(
            "The extension background script snapshots the active tab every 30 seconds into Chrome local storage. The bridge script, which runs only when the dashboard is open, reads unsynced entries from that storage and POSTs them to the backend. The backend stores them, the dashboard polls <font name='Courier'>/events</font> and <font name='Courier'>/analyze</font>, and the charts update.",
        ),
        p(
            "The backend itself does <b>not</b> deduplicate raw events. It trusts the extension bridge to sync only unsent items using a pointer stored in Chrome storage.",
            "Callout",
        ),
        p("5. Request Lifecycle for Core Routes", "SectionTitle"),
        bullets(
            [
                "<b>POST /events:</b> accepts a batch of <font name='Courier'>TabEvent</font> objects, converts them with Pydantic <font name='Courier'>model_dump()</font>, and appends them to storage.",
                "<b>GET /events:</b> fetches only today's events, sorts newest-first, and returns up to a limit parameter, defaulting to 50.",
                "<b>POST /analyze:</b> reads today's events, runs the full pipeline, stores the resulting score as the latest score, and returns it.",
                "<b>GET /score:</b> returns the cached score if present, otherwise lazily runs the pipeline once and caches that result.",
                "<b>POST /seed:</b> inserts the demo storyline.",
                "<b>DELETE /seed:</b> removes only entries marked with <font name='Courier'>is_seeded=True</font>.",
                "<b>DELETE /all:</b> clears every event and score, which is what the dashboard's Clear Demo button now uses.",
                "<b>POST /chat:</b> loads today's events plus the latest score, builds a contextual prompt, and asks OpenAI for a concise answer grounded in the current dashboard state.",
            ]
        ),
        p("6. Storage Model and Constraints", "SectionTitle"),
        table(
            [
                ["Concern", "Current implementation", "Tradeoff"],
                ["Scope", "Single-user global store in module state", "Fast for a hackathon, but not multi-tenant or user-aware."],
                ["Persistence", "JSON file at backend/data.json", "Very simple, but not transactional and not ideal for concurrent writes at scale."],
                ["Safety", "threading.Lock around reads and writes", "Enough for the current in-process app and ThreadPoolExecutor usage."],
                ["Date filtering", "Only today's events are used by get_today_events()", "Keeps the story focused, but means historical analytics are not implemented yet."],
                ["Auth", "No backend auth or per-user ownership", "Important honesty point: frontend auth exists, backend storage is still global."],
            ],
            [1.25 * inch, 2.6 * inch, 2.6 * inch],
        ),
        Spacer(1, 0.12 * inch),
        p("7. Reliability and Failure Behavior", "SectionTitle"),
        bullets(
            [
                "If there are no events, <font name='Courier'>pipeline._empty_score()</font> returns a balanced zero-state score instead of failing.",
                "If OpenAI classification fails in agent 1, unknown domains fall back to <font name='Courier'>UNKNOWN</font>.",
                "If OpenAI recommendation generation fails in agent 3, the backend returns deterministic fallback recommendations.",
                "If the chat endpoint lacks an OpenAI key, it returns HTTP 503 with a clear message rather than silently failing.",
                "Because CORS allows all origins and auth is not enforced server-side, this backend is built for demo speed rather than production hardening.",
            ]
        ),
        p("8. Honest Technical Limitations", "SectionTitle"),
        bullets(
            [
                "Scores are heuristic and MBI-inspired, not clinical diagnosis.",
                "The backend is still globally scoped rather than per authenticated user.",
                "The bridge plus background cadence means real-time updates are near-real-time at 30-second granularity, not instant event streaming.",
                "Domain classification is only as good as the category map plus GPT fallback, so some ambiguous domains may be simplified.",
                "JSON persistence is great for demos but should become a database before scaling.",
            ]
        ),
    ]


def scoring_story():
    return [
        p("1. Pipeline Overview", "SectionTitle"),
        p(
            "The scoring engine is intentionally split into stages. Stage 1 classifies unknown domains. Stage 2 runs two pure-Python analyses in parallel. Stage 3 synthesizes the metrics into sub-scores, a total risk tier, and recommendations.",
        ),
        p(
            "If a judge asks why this is called a multi-agent system, the answer is: each stage has a distinct task boundary, input/output contract, and reasoning style. Only the tasks that benefit from an LLM use one.",
            "Callout",
        ),
        p("2. Agent 1 - Classification", "SectionTitle"),
        bullets(
            [
                "Input: list of tab events that may include <font name='Courier'>UNKNOWN</font> categories.",
                "Local first: strips <font name='Courier'>www.</font>, checks a hardcoded <font name='Courier'>CATEGORY_MAP</font>, then checks the parent domain.",
                "LLM fallback: if still unknown, asks GPT-4o-mini to return exactly one category from PRODUCTIVE, COMMUNICATION, FRAGMENTATION, PASSIVE_ESCAPE, SHALLOW_WORK, RECOVERY, or UNKNOWN.",
                "Why it matters: most common domains are cheap and deterministic; only true unknowns hit the model.",
            ]
        ),
        p("3. Agent 2A - Fragmentation Analysis", "SectionTitle"),
        bullets(
            [
                "<b>switch_count:</b> number of times the domain changes between consecutive entries. Repeated 30-second snapshots of the same tab do not count as switches.",
                "<b>context_switch_rate:</b> switches divided by total active hours.",
                "<b>avg_session_min:</b> average duration of collapsed same-domain runs.",
                "<b>fragmentation_index:</b> maximum number of domain changes in any rolling 10-minute window, normalized by dividing by 10 and capped at 1.0.",
            ]
        ),
        p(
            "This is one of the strongest technical answers in the project: the app does not confuse 'many snapshots' with 'many switches'. It explicitly collapses same-domain runs and only counts actual changes.",
            "Callout",
        ),
        p("4. Agent 2B - Burnout Pattern Flags", "SectionTitle"),
        bullets(
            [
                "<b>doomscroll_time_pct:</b> percentage of time in FRAGMENTATION categories.",
                "<b>passive_time_pct:</b> percentage of time in PASSIVE_ESCAPE categories.",
                "<b>productive_time_pct:</b> percentage of time in PRODUCTIVE categories.",
                "<b>sessions_over_90min:</b> count of single-domain blocks at or above 90 minutes.",
                "<b>late_night_events:</b> count of events at 22:00 or later, using explicit hour if available, otherwise timestamp parsing.",
            ]
        ),
        p("5. Agent 3 - Synthesis Formula", "SectionTitle"),
        p(
            "Each sub-score is capped at 33, so the total behaves like a 0-100 score. The backend computes the score deterministically and only uses GPT for recommendation wording.",
        ),
        p(
            "Exhaustion = (passive_time_pct / 100) * 25 + sessions_over_90min * 14 + max(0, total_active_hours - 8) * 5 + late_night_events * 2",
            "Mono",
        ),
        p(
            "Cynicism = (doomscroll_time_pct / 100) * 45 + switch_count * 0.35",
            "Mono",
        ),
        p(
            "Efficacy Loss = (1 - productive_time_pct / 100) * 30 + min(context_switch_rate / 12, 1) * 5",
            "Mono",
        ),
        table(
            [
                ["Tier", "Range", "Meaning in the demo"],
                ["BALANCED", "0-35", "Signals look healthy or low intensity."],
                ["CAUTION", "36-65", "Some stress signals are building."],
                ["AT_RISK", "66-85", "Multiple burnout indicators are active."],
                ["CRITICAL", "86-100", "Strong warning state that deserves intervention."],
            ],
            [1.5 * inch, 1.0 * inch, 3.6 * inch],
        ),
        Spacer(1, 0.12 * inch),
        p("6. Recommendation Generation", "SectionTitle"),
        bullets(
            [
                "Agent 3 builds a top-sites summary from the five most time-consuming domains.",
                "It prompts GPT-4o-mini for exactly three short actionable recommendations as a JSON array.",
                "If parsing or the model call fails, the app falls back to deterministic recommendations based on score and burnout metrics.",
                "This means the score is robust even if OpenAI is down; only the wording quality of recommendations degrades.",
            ]
        ),
        p("7. Chat Endpoint Logic", "SectionTitle"),
        bullets(
            [
                "The chat endpoint in <font name='Courier'>server.py</font> is separate from the pipeline, but it uses the same underlying events and latest score.",
                "It loads today's events, gets the cached score or computes it if missing, summarizes top domains and category minutes, and injects current recommendations.",
                "The system prompt explicitly tells the model not to present itself as diagnosis and to stay concise and practical.",
                "This is a strong story for judges: the chat is grounded in real session metrics, not generic wellness advice.",
            ]
        ),
        p("8. Demo Seed Storyline", "SectionTitle"),
        p(
            "The demo data in <font name='Courier'>seed.py</font> is carefully authored to tell an emotionally believable workday: early productivity, meetings, creeping fragmentation, passive lunch escape, shallow work drift, a doomscrolling spiral, then a long late-day GitHub block.",
        ),
        bullets(
            [
                "Morning: productive and communication-heavy, which keeps the score from looking unrealistically bad immediately.",
                "Late morning through afternoon: repeated Twitter, Reddit, Instagram, TikTok, YouTube, and Netflix usage drives cynicism and exhaustion.",
                "Late afternoon: a 90-minute GitHub block creates an exhaustion signal from prolonged single-domain work.",
                "Result: a score that usually lands around AT_RISK, which is visually compelling on the dashboard.",
            ]
        ),
        p("9. Questions You Can Answer With Confidence", "SectionTitle"),
        bullets(
            [
                "Why not one model call? Because most metrics are faster, cheaper, and more reliable as deterministic computation.",
                "Why is GPT still useful? It handles ambiguous domain classification and turns metrics into human-readable recommendations and chat responses.",
                "Why these dimensions? They mirror the three-part burnout framing: exhaustion, cynicism, and reduced efficacy.",
                "Why cap each sub-score at 33? It keeps the total bounded and makes the three dimensions comparably influential.",
            ]
        ),
    ]


def qa_story():
    return [
        p("1. Thirty-Second Pitch", "SectionTitle"),
        p(
            "Dachshund is a burnout early-warning system for builders. A Chrome extension passively tracks tab behavior, our FastAPI backend converts that behavior into fragmentation and burnout signals, and the dashboard surfaces a live score plus concrete recovery suggestions. The key idea is that burnout often shows up in browsing patterns before people consciously label it.",
        ),
        p("2. Recommended Demo Script", "SectionTitle"),
        bullets(
            [
                "Open the dashboard and explain that the browser extension records active-tab snapshots every 30 seconds.",
                "Click Load Demo Data to instantly show an AT_RISK story without relying on live browsing during the pitch.",
                "Point to the burnout score and say it is built from three interpretable dimensions: exhaustion, cynicism, and efficacy loss.",
                "Show the timeline and category breakdown to make the doomscrolling and passive-escape pattern visible.",
                "Open the chat widget and ask why the score is high; this demonstrates that the OpenAI layer is grounded in current backend metrics.",
                "If time allows, browse a site and explain that the bridge syncs events to the backend while the dashboard polls for updates.",
            ]
        ),
        p("3. Judge Questions and Strong Answers", "SectionTitle"),
        table(
            [
                ["Question", "Strong answer"],
                ["Why FastAPI?", "It let us ship typed request models, simple route handlers, and a clean Python backend quickly. That mattered for a hackathon where iteration speed was critical."],
                ["Why not make the whole thing AI?", "We only use AI where it adds value. Metrics and scores are deterministic for speed and reliability; OpenAI is reserved for ambiguous classification, recommendations, and chat."],
                ["Is this diagnosing burnout?", "No. It is a heuristic early-warning product inspired by burnout dimensions, not a clinical diagnostic tool. We are explicit about that in both the UI and the prompts."],
                ["How do you protect privacy?", "The current prototype is local-first in collection and stores to a local JSON-backed backend. For a production version we would add explicit consent, retention controls, and per-user secure storage."],
                ["How do you avoid duplicate events?", "The extension bridge stores a synced pointer in Chrome local storage and only POSTs new entries. The backend assumes the bridge has already handled deduplication."],
                ["How scalable is this backend?", "The architecture is intentionally simple for a demo. The next step would be replacing the in-memory JSON store with a database and introducing per-user auth on the backend."],
            ],
            [2.0 * inch, 4.6 * inch],
        ),
        Spacer(1, 0.12 * inch),
        p("4. Likely Follow-Up Questions", "SectionTitle"),
        bullets(
            [
                "<b>What if OpenAI is unavailable?</b> Unknown domains become UNKNOWN, recommendations fall back to static logic, and chat returns a clear error if the key is missing.",
                "<b>Why poll instead of websockets?</b> Polling was simpler and stable for hackathon time, especially because the extension already works on a 30-second cadence.",
                "<b>Why use today's events only?</b> It keeps the story immediate and reduces complexity. Historical analytics are a clear next step and already listed in the project roadmap.",
                "<b>What is the cleverest technical detail?</b> The fragmentation logic counts actual domain changes, not raw 30-second snapshots, which avoids inflating switch rates.",
            ]
        ),
        p("5. Backend Commands to Remember", "SectionTitle"),
        p("Start the backend:", "SubTitle"),
        p("cd backend && pip3 install -r requirements.txt && uvicorn server:app --reload --port 8000", "Mono"),
        p("Useful manual API calls:", "SubTitle"),
        p("curl -X POST http://localhost:8000/seed", "Mono"),
        p("curl -X POST http://localhost:8000/analyze", "Mono"),
        p("curl http://localhost:8000/score", "Mono"),
        p("curl http://localhost:8000/events?limit=10", "Mono"),
        p("curl -X DELETE http://localhost:8000/all", "Mono"),
        p("6. Technical Risks to Mention Honestly", "SectionTitle"),
        bullets(
            [
                "Backend auth is not yet enforced, even though the frontend now has Supabase auth.",
                "The backend is global and single-user; multiple people hitting the same server would share the same event pool.",
                "The scoring formula is calibrated for interpretability and demo usefulness, not validated clinical inference.",
                "The bridge is currently hardcoded to localhost patterns and a dashboard-open workflow.",
            ]
        ),
        p("7. Best Closing Line", "SectionTitle"),
        p(
            "This project is strongest when presented as a behavioral signal layer for burnout prevention: not a diagnosis engine, but a tool that makes digital work patterns legible early enough to support better interventions.",
            "Callout",
        ),
        PageBreak(),
        p("8. Endpoint Cheat Sheet", "SectionTitle"),
        table(
            [
                ["Route", "Method", "Purpose", "Notes"],
                ["/", "GET", "Health/status response", "Returns app=status ok."],
                ["/events", "POST", "Ingest batch of events", "Payload is EventBatch with list of TabEvent objects."],
                ["/events", "GET", "Fetch today's newest-first events", "Optional limit query, default 50."],
                ["/analyze", "POST", "Run full pipeline", "Always recomputes and caches latest score."],
                ["/score", "GET", "Fetch cached score", "If none exists yet, computes on demand."],
                ["/seed", "POST", "Insert demo data", "Returns count seeded."],
                ["/seed", "DELETE", "Remove seeded-only data", "Leaves real events untouched."],
                ["/all", "DELETE", "Wipe all stored data", "Used by Clear Demo in the dashboard."],
                ["/chat", "POST", "Grounded OpenAI answer", "Requires OPENAI_API_KEY and a non-empty message."],
            ],
            [0.95 * inch, 0.7 * inch, 1.8 * inch, 3.2 * inch],
        ),
        Spacer(1, 0.15 * inch),
        p("9. Environment Variables", "SectionTitle"),
        table(
            [
                ["Variable", "Used by", "Purpose"],
                ["OPENAI_API_KEY", "agent 1, agent 3, /chat", "Enables domain classification fallback, recommendation generation, and chat."],
                ["OPENAI_MODEL", "/chat", "Overrides the chat model, defaulting to gpt-4o-mini."],
                ["PORT", "server.py", "Controls uvicorn port, default 8000."],
            ],
            [1.8 * inch, 1.7 * inch, 3.0 * inch],
        ),
    ]


def main():
    build_doc(
        "dachshund_backend_architecture.pdf",
        "Dachshund Backend Architecture",
        "A technical walkthrough of the FastAPI service, storage model, and end-to-end request flow.",
        architecture_story(),
    )
    build_doc(
        "dachshund_scoring_and_agents.pdf",
        "Dachshund Scoring and Agent Pipeline",
        "How the burnout score is computed, how each agent works, and how the OpenAI pieces fit into the system.",
        scoring_story(),
    )
    build_doc(
        "dachshund_hackathon_qa_cheatsheet.pdf",
        "Dachshund Hackathon Q&A Cheat Sheet",
        "Short, presentation-friendly answers, commands, route references, and honest tradeoffs to remember under pressure.",
        qa_story(),
    )


if __name__ == "__main__":
    main()
