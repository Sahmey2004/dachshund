import React from "react";

const ICONS = ["💡", "🧠", "🌿"];

const COLORS = [
  { border: "rgba(154, 184, 234, 0.35)", bg: "rgba(233, 241, 255, 0.84)", text: "#6a83ae" },
  { border: "rgba(228, 175, 131, 0.35)", bg: "rgba(255, 240, 227, 0.88)", text: "#c98652" },
  { border: "rgba(159, 208, 174, 0.35)", bg: "rgba(233, 246, 237, 0.88)", text: "#63936f" },
];

export function RecommendationCards({ recommendations = [] }) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div style={styles.grid}>
      {recommendations.slice(0, 3).map((rec, i) => {
        const c = COLORS[i % COLORS.length];
        return (
          <div
            key={i}
            style={{
              ...styles.card,
              background: c.bg,
              border: `1px solid ${c.border}`,
            }}
          >
            <div style={{ color: c.text, fontSize: 22, marginBottom: 8 }}>{ICONS[i]}</div>
            <div style={{ color: "#5e493b", fontSize: 13, lineHeight: 1.6 }}>{rec}</div>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 12,
  },
  card: {
    borderRadius: 20,
    padding: "18px",
    boxShadow: "0 16px 28px rgba(93,72,54,0.08)",
  },
};
