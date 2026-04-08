/**
 * Dachshund — Bridge Content Script
 * Runs on the dashboard page (localhost:5173).
 * Reads chrome.storage.local and syncs new entries to the FastAPI backend every 30s.
 */

const BACKEND = "http://localhost:8000";

// Maps extension categories → backend categories
const CAT_MAP = {
  social:        "FRAGMENTATION",
  entertainment: "PASSIVE_ESCAPE",
  productivity:  "PRODUCTIVE",
  news:          "SHALLOW_WORK",
  other:         "UNKNOWN",
};

// More precise domain-level overrides (mirrors agent_1_classification.py)
const DOMAIN_MAP = {
  // Social / doomscroll
  "twitter.com":   "FRAGMENTATION",
  "x.com":         "FRAGMENTATION",
  "reddit.com":    "FRAGMENTATION",
  "tiktok.com":    "FRAGMENTATION",
  "instagram.com": "FRAGMENTATION",
  "facebook.com":  "FRAGMENTATION",
  "snapchat.com":  "FRAGMENTATION",
  "threads.net":   "FRAGMENTATION",
  // Passive escape
  "youtube.com":    "PASSIVE_ESCAPE",
  "netflix.com":    "PASSIVE_ESCAPE",
  "twitch.tv":      "PASSIVE_ESCAPE",
  "hulu.com":       "PASSIVE_ESCAPE",
  "disneyplus.com": "PASSIVE_ESCAPE",
  "primevideo.com": "PASSIVE_ESCAPE",
  // Productive
  "github.com":         "PRODUCTIVE",
  "stackoverflow.com":  "PRODUCTIVE",
  "notion.so":          "PRODUCTIVE",
  "figma.com":          "PRODUCTIVE",
  "docs.google.com":    "PRODUCTIVE",
  "linear.app":         "PRODUCTIVE",
  "developer.mozilla.org": "PRODUCTIVE",
  // Communication
  "gmail.com":           "COMMUNICATION",
  "mail.google.com":     "COMMUNICATION",
  "slack.com":           "COMMUNICATION",
  "zoom.us":             "COMMUNICATION",
  "calendar.google.com": "COMMUNICATION",
  "discord.com":         "COMMUNICATION",
  // Shallow work / news
  "cnn.com":     "SHALLOW_WORK",
  "bbc.com":     "SHALLOW_WORK",
  "nytimes.com": "SHALLOW_WORK",
  "medium.com":  "SHALLOW_WORK",
  // Recovery
  "spotify.com":  "RECOVERY",
  "calm.com":     "RECOVERY",
  "headspace.com":"RECOVERY",
};

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function classifyEntry(entry) {
  const domain = getDomain(entry.url);
  if (domain && domain in DOMAIN_MAP) return DOMAIN_MAP[domain];
  // Check parent domain
  if (domain) {
    const parts = domain.split(".");
    if (parts.length >= 2) {
      const parent = parts.slice(-2).join(".");
      if (parent in DOMAIN_MAP) return DOMAIN_MAP[parent];
    }
    if (domain === "localhost" || domain.startsWith("127.")) return "PRODUCTIVE";
  }
  return CAT_MAP[entry.category] || "UNKNOWN";
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function syncToBackend() {
  const dateKey = todayKey();
  const syncKey = `bridge_synced_${dateKey}`;

  let stored;
  try {
    stored = await chrome.storage.local.get([dateKey, syncKey]);
  } catch (e) {
    return; // Extension context unavailable
  }

  const dayData = stored[dateKey] || { entries: [], tabSwitches: 0 };
  const lastSynced = stored[syncKey] || 0;

  const newEntries = dayData.entries.slice(lastSynced);
  if (newEntries.length === 0) return;

  // Transform to backend format
  const events = newEntries
    .filter(e => e.url && !e.url.startsWith("chrome://") && !e.url.startsWith("chrome-extension://"))
    .map(e => {
      const domain = getDomain(e.url) || "unknown";
      const ts = new Date(e.timestamp);
      return {
        domain,
        title: e.title || "",
        category: classifyEntry(e),
        duration_ms: (e.duration || 30) * 1000,
        hour: ts.getHours(),
        timestamp: e.timestamp,
        is_seeded: false,
      };
    });

  if (events.length === 0) {
    // Still advance pointer even if all filtered (chrome:// etc.)
    await chrome.storage.local.set({ [syncKey]: lastSynced + newEntries.length });
    return;
  }

  try {
    const res = await fetch(`${BACKEND}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
    });

    if (res.ok) {
      // Advance synced pointer
      await chrome.storage.local.set({ [syncKey]: lastSynced + newEntries.length });
      console.log(`[Dachshund Bridge] Synced ${events.length} events to backend.`);
    }
  } catch {
    // Backend not running — silently retry next cycle
  }
}

// Initial sync + every 30s
syncToBackend();
setInterval(syncToBackend, 30_000);

console.log("[Dachshund Bridge] Content script active on dashboard.");
