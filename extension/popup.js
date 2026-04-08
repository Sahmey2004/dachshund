const todayKey = new Date().toISOString().slice(0, 10);

function getScoreClass(score) {
  if (score < 30) return "green";
  if (score < 55) return "yellow";
  if (score < 75) return "orange";
  return "red";
}

function getLabel(score) {
  if (score < 30) return "😊 You're doing great!";
  if (score < 55) return "😐 Mild stress detected";
  if (score < 75) return "😟 Burnout risk rising";
  return "😰 High burnout risk!";
}

function calcScore(data) {
  if (!data || !data.entries || data.entries.length === 0) return 0;
  const total = data.entries.reduce((s, e) => s + (e.duration || 30), 0);
  const social = data.entries.filter(e => e.category === "social").reduce((s, e) => s + (e.duration || 30), 0);
  const doomscroll = Math.min(100, Math.round((social / total) * 150));
  const hours = total / 3600;
  const contextSwitch = Math.min(100, Math.round(((data.tabSwitches || 0) / Math.max(hours, 0.5)) * 1.5));
  const entertainment = data.entries.filter(e => e.category === "entertainment" || e.category === "social");
  const longest = entertainment.reduce((m, e) => Math.max(m, e.duration || 30), 0);
  const hyperfocus = Math.min(100, Math.round((longest / 7200) * 100));
  return Math.round(doomscroll * 0.4 + contextSwitch * 0.35 + hyperfocus * 0.25);
}

async function render() {
  const result = await chrome.storage.local.get(todayKey);
  const data = result[todayKey] || { entries: [], tabSwitches: 0 };
  const totalMinutes = Math.round(data.entries.reduce((s, e) => s + (e.duration || 30), 0) / 60);
  const uniqueSites = new Set(data.entries.map(e => { try { return new URL(e.url).hostname; } catch { return e.url; } })).size;
  const score = calcScore(data);

  document.getElementById("score-ring").textContent = score;
  document.getElementById("score-ring").className = "score-ring " + getScoreClass(score);
  document.getElementById("status-label").textContent = getLabel(score);
  document.getElementById("minutes").textContent = totalMinutes;
  document.getElementById("switches").textContent = data.tabSwitches || 0;
  document.getElementById("sites").textContent = uniqueSites;
  document.getElementById("entries").textContent = data.entries.length;
}

document.getElementById("export").addEventListener("click", async () => {
  const result = await chrome.storage.local.get(todayKey);
  const data = result[todayKey] || { entries: [], tabSwitches: 0 };
  const exportData = [{
    date: todayKey,
    entries: data.entries,
    tabSwitches: data.tabSwitches || 0,
    totalBrowsingMinutes: Math.round(data.entries.reduce((s, e) => s + (e.duration || 30), 0) / 60),
  }];
  await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
  document.getElementById("export").textContent = "✅ Copied!";
  setTimeout(() => { document.getElementById("export").textContent = "📋 Copy Data to Clipboard"; }, 2000);
});

document.getElementById("open-dashboard").addEventListener("click", () => {
  chrome.tabs.create({ url: "http://localhost:5173" });
});

document.getElementById("clear").addEventListener("click", async () => {
  await chrome.storage.local.remove(todayKey);
  render();
});

render();
