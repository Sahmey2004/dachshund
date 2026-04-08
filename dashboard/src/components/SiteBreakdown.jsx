import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CAT_COLORS = {
  PRODUCTIVE:    "#7ab8bb",
  FRAGMENTATION: "#d89ba1",
  PASSIVE_ESCAPE:"#e4af83",
  SHALLOW_WORK:  "#dcc57d",
  COMMUNICATION: "#9ab8ea",
  RECOVERY:      "#9fd0ae",
  UNKNOWN:       "#b3a8a1",
};

const CAT_LABELS = {
  PRODUCTIVE:    "Productive",
  FRAGMENTATION: "Doomscroll",
  PASSIVE_ESCAPE:"Passive",
  SHALLOW_WORK:  "Shallow",
  COMMUNICATION: "Comms",
  RECOVERY:      "Recovery",
  UNKNOWN:       "Unknown",
};

function buildPieData(events) {
  const totals = {};
  for (const evt of events) {
    const cat = evt.category || "UNKNOWN";
    totals[cat] = (totals[cat] || 0) + evt.duration_ms;
  }
  return Object.entries(totals)
    .filter(([, ms]) => ms > 0)
    .map(([cat, ms]) => ({
      name: CAT_LABELS[cat] ?? cat,
      value: Math.round(ms / 60_000),
      color: CAT_COLORS[cat] ?? "#9ca3af",
    }))
    .sort((a, b) => b.value - a.value);
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: "rgba(255, 250, 243, 0.95)", border: "1px solid rgba(105,80,60,0.12)",
      borderRadius: 16, padding: "8px 12px", fontSize: 12, boxShadow: "0 14px 28px rgba(93,72,54,0.08)",
    }}>
      <div style={{ color: d.payload.color, fontWeight: 600 }}>{d.name}</div>
      <div style={{ color: "#8a6d59" }}>{d.value} min</div>
    </div>
  );
};

export function SiteBreakdown({ events = [] }) {
  const data = useMemo(() => buildPieData(events), [events]);

  if (data.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#555", padding: 40 }}>
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "#8a6d59" }}
          formatter={(value) => <span style={{ color: "#8a6d59" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
