import React from "react";

const RADIUS = 80;
const STROKE = 14;
const C = 100; // SVG viewBox center
const CIRCUMFERENCE = Math.PI * RADIUS; // half circle

function scoreColor(score) {
  if (score < 36) return "#76af8e";
  if (score < 66) return "#d1b06d";
  if (score < 86) return "#d88a5a";
  return "#c97779";
}

export function BurnoutGauge({ score = 0 }) {
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const dashOffset = CIRCUMFERENCE * (1 - pct);
  const color = scoreColor(score);

  return (
    <div style={styles.wrapper}>
      <svg viewBox="0 0 200 120" style={styles.svg}>
        {/* Background arc */}
        <path
          d={`M ${C - RADIUS},${C} A ${RADIUS},${RADIUS} 0 0,1 ${C + RADIUS},${C}`}
          fill="none"
          stroke="rgba(217, 204, 190, 0.9)"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        {/* Foreground arc */}
        <path
          d={`M ${C - RADIUS},${C} A ${RADIUS},${RADIUS} 0 0,1 ${C + RADIUS},${C}`}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s ease" }}
        />
        {/* Score text */}
        <text x={C} y={C - 4} textAnchor="middle" fill={color} fontSize="36" fontWeight="700">
          {Math.round(score)}
        </text>
        <text x={C} y={C + 18} textAnchor="middle" fill="#8a6d59" fontSize="10">
          BURNOUT RISK SCORE
        </text>
        {/* Labels */}
        <text x={C - RADIUS + 2} y={C + 18} fill="#8a6d59" fontSize="9">0</text>
        <text x={C + RADIUS - 10} y={C + 18} fill="#8a6d59" fontSize="9">100</text>
      </svg>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    width: "100%",
    maxWidth: 220,
    overflow: "visible",
    filter: "drop-shadow(0 14px 24px rgba(94,72,53,0.10))",
  },
};
