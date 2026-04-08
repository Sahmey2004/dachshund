const SOCIAL_DOMAINS = ["youtube.com", "tiktok.com", "reddit.com", "twitter.com", "x.com", "instagram.com", "facebook.com"];
const ENTERTAINMENT_DOMAINS = ["netflix.com", "twitch.tv", "disneyplus.com", "hulu.com", "primevideo.com"];
const PRODUCTIVITY_DOMAINS = ["github.com", "docs.google.com", "notion.so", "stackoverflow.com", "figma.com", "slack.com", "linear.app"];

function categorize(url) {
  try {
    const hostname = new URL(url).hostname;
    if (SOCIAL_DOMAINS.some(d => hostname.includes(d))) return "social";
    if (ENTERTAINMENT_DOMAINS.some(d => hostname.includes(d))) return "entertainment";
    if (PRODUCTIVITY_DOMAINS.some(d => hostname.includes(d))) return "productivity";
    if (hostname.includes("news") || hostname.includes("cnn") || hostname.includes("bbc") || hostname.includes("nytimes")) return "news";
    return "other";
  } catch { return "other"; }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Track active tab every 30 seconds
chrome.alarms.create("trackTab", { periodInMinutes: 0.5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "trackTab") return;
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs[0]?.url) return;

  const key = todayKey();
  const data = await chrome.storage.local.get(key);
  const dayData = data[key] || { entries: [], tabSwitches: 0 };

  dayData.entries.push({
    timestamp: new Date().toISOString(),
    url: tabs[0].url,
    title: tabs[0].title || "",
    duration: 30,
    category: categorize(tabs[0].url),
  });

  await chrome.storage.local.set({ [key]: dayData });
});

// Track tab switches
chrome.tabs.onActivated.addListener(async () => {
  const key = todayKey();
  const data = await chrome.storage.local.get(key);
  const dayData = data[key] || { entries: [], tabSwitches: 0 };
  dayData.tabSwitches = (dayData.tabSwitches || 0) + 1;
  await chrome.storage.local.set({ [key]: dayData });
});
