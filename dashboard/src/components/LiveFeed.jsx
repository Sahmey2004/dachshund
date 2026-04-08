import React from "react";

const CAT_COLORS = {
  PRODUCTIVE:    { bg: "rgba(214,240,225,0.9)",  color: "#5f9c78"  },
  FRAGMENTATION: { bg: "rgba(248,225,227,0.9)",  color: "#bf6c6e"  },
  PASSIVE_ESCAPE:{ bg: "rgba(255,236,220,0.92)", color: "#cf8454"  },
  SHALLOW_WORK:  { bg: "rgba(255,245,221,0.92)", color: "#b6954d"  },
  COMMUNICATION: { bg: "rgba(224,238,247,0.92)", color: "#6994b7"  },
  RECOVERY:      { bg: "rgba(225,243,237,0.92)", color: "#65a08a"  },
  UNKNOWN:       { bg: "rgba(235,233,231,0.92)", color: "#8f8680"  },
};

function catStyle(cat) {
  return CAT_COLORS[cat] ?? CAT_COLORS.UNKNOWN;
}

function formatDuration(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function mergeFeedEvents(events) {
  if (!events.length) return [];

  const chronological = [...events].sort((a, b) => {
    const aTs = Date.parse(a.timestamp || "") || 0;
    const bTs = Date.parse(b.timestamp || "") || 0;
    return aTs - bTs;
  });

  const merged = [];

  for (const event of chronological) {
    const last = merged[merged.length - 1];
    const sameSnapshotStream =
      last &&
      last.domain === event.domain &&
      (last.title || "") === (event.title || "") &&
      (last.category || "UNKNOWN") === (event.category || "UNKNOWN");

    if (sameSnapshotStream) {
      last.duration_ms = (last.duration_ms || 0) + (event.duration_ms || 0);
      last.timestamp = event.timestamp;
    } else {
      merged.push({ ...event });
    }
  }

  return merged.reverse();
}

export function LiveFeed({ events = [] }) {
  const displayEvents = mergeFeedEvents(events);

  if (displayEvents.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🐾</div>
        <div style={{ color: "#7b6554" }}>No events yet. Browse some sites!</div>
      </div>
    );
  }

  return (
    <div style={styles.feed}>
      {displayEvents.slice(0, 50).map((evt, i) => {
        const cs = catStyle(evt.category);
        return (
          <div key={i} style={styles.row}>
            <div style={styles.favicon}>
              <img
                src={`https://www.google.com/s2/favicons?domain=${evt.domain}&sz=16`}
                alt=""
                style={{ width: 16, height: 16 }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
            <div style={styles.domain}>{evt.domain}</div>
            <span
              style={{
                ...styles.badge,
                background: cs.bg,
                color: cs.color,
              }}
            >
              {(evt.category || "UNKNOWN").replace("_", " ")}
            </span>
            <div style={styles.duration}>{formatDuration(evt.duration_ms)}</div>
            <div style={styles.time}>{formatTime(evt.timestamp)}</div>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  feed: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    maxHeight: 280,
    overflowY: "auto",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    borderRadius: 14,
    background: "rgba(255, 248, 236, 0.82)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55)",
    fontSize: 12,
  },
  favicon: {
    width: 16,
    flexShrink: 0,
  },
  domain: {
    flex: 1,
    color: "#5b4738",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  badge: {
    fontSize: 10,
    padding: "2px 6px",
    borderRadius: 20,
    fontWeight: 600,
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  duration: {
    color: "#8a6d59",
    fontSize: 11,
    flexShrink: 0,
    width: 36,
    textAlign: "right",
  },
  time: {
    color: "#9c806d",
    fontSize: 10,
    flexShrink: 0,
    width: 42,
    textAlign: "right",
  },
  empty: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#8a6d59",
  },
};
