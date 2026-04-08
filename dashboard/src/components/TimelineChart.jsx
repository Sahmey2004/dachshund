import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const CATEGORIES = [
  { key: "PRODUCTIVE",    color: "#7ab8bb",  label: "Productive"    },
  { key: "FRAGMENTATION", color: "#d89ba1",  label: "Doomscroll"    },
  { key: "PASSIVE_ESCAPE",color: "#e4af83",  label: "Passive"       },
  { key: "SHALLOW_WORK",  color: "#dcc57d",  label: "Shallow"       },
  { key: "COMMUNICATION", color: "#9ab8ea",  label: "Comms"         },
  { key: "RECOVERY",      color: "#9fd0ae",  label: "Recovery"      },
];

function buildHourlyData(events) {
  // Build a map: hour → { PRODUCTIVE: min, FRAGMENTATION: min, ... }
  const hourMap = {};
  for (let h = 0; h < 24; h++) {
    hourMap[h] = {};
    CATEGORIES.forEach((c) => { hourMap[h][c.key] = 0; });
  }

  for (const evt of events) {
    const hour = evt.hour ?? new Date(evt.timestamp).getHours();
    const cat = evt.category in hourMap[0] ? evt.category : "SHALLOW_WORK";
    hourMap[hour][cat] = (hourMap[hour][cat] || 0) + (evt.duration_ms / 60_000);
  }

  return Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}:00`,
    ...Object.fromEntries(CATEGORIES.map((c) => [c.label, Math.round(hourMap[h][c.key] * 10) / 10])),
  }));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(255, 250, 243, 0.95)", border: "1px solid rgba(105,80,60,0.12)",
      borderRadius: 16, padding: "8px 12px", fontSize: 12, boxShadow: "0 14px 28px rgba(93,72,54,0.08)",
    }}>
      <div style={{ color: "#8a6d59", marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {p.value}m
        </div>
      ))}
    </div>
  );
};

export function TimelineChart({ events = [] }) {
  const data = useMemo(() => buildHourlyData(events), [events]);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          {CATEGORIES.map((c) => (
            <linearGradient key={c.key} id={`grad-${c.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={c.color} stopOpacity={0.5} />
              <stop offset="95%" stopColor={c.color} stopOpacity={0}   />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(146,118,97,0.16)" />
        <XAxis dataKey="hour" tick={{ fill: "#8a6d59", fontSize: 10 }} interval={3} />
        <YAxis tick={{ fill: "#8a6d59", fontSize: 10 }} unit="m" />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: "#8a6d59" }} />
        {CATEGORIES.map((c) => (
          <Area
            key={c.key}
            type="monotone"
            dataKey={c.label}
            stackId="1"
            stroke={c.color}
            fill={`url(#grad-${c.key})`}
            strokeWidth={1.5}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
