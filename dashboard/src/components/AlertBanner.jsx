import React from "react";

const TIERS = {
  BALANCED: {
    color: "#5f9c78",
    bg: "rgba(226, 245, 231, 0.86)",
    border: "rgba(121, 176, 135, 0.28)",
    icon: "🌿",
    label: "BALANCED",
    message: "Your digital habits look healthy today. Keep it up!",
  },
  CAUTION: {
    color: "#b6954d",
    bg: "rgba(255, 246, 221, 0.9)",
    border: "rgba(211, 184, 119, 0.34)",
    icon: "☀️",
    label: "CAUTION",
    message: "Early warning signs detected. Consider a short break.",
  },
  AT_RISK: {
    color: "#cf8454",
    bg: "rgba(255, 237, 223, 0.9)",
    border: "rgba(224, 157, 110, 0.34)",
    icon: "🫖",
    label: "AT RISK",
    message: "Burnout is building. Step away and reset.",
    pulse: true,
  },
  CRITICAL: {
    color: "#bf6c6e",
    bg: "rgba(255, 232, 234, 0.92)",
    border: "rgba(203, 119, 127, 0.35)",
    icon: "🩹",
    label: "CRITICAL",
    message: "Active burnout pattern detected. Please step away now.",
    pulse: true,
  },
};

export function AlertBanner({ riskTier = "BALANCED" }) {
  const tier = TIERS[riskTier] ?? TIERS.BALANCED;

  return (
    <div
      style={{
        background: tier.bg,
        border: `1px solid ${tier.border}`,
        borderRadius: 22,
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        animation: tier.pulse ? "pulse 2s infinite" : "none",
        boxShadow: "0 18px 32px rgba(96, 74, 53, 0.08)",
        backdropFilter: "blur(10px)",
      }}
    >
      <span style={{ fontSize: 22 }}>{tier.icon}</span>
      <div>
        <div style={{ color: tier.color, fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 2 }}>
          {tier.label}
        </div>
        <div style={{ color: "#6b5545", fontSize: 13 }}>{tier.message}</div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
}
