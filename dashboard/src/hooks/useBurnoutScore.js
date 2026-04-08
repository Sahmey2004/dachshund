import { useState, useEffect, useCallback } from "react";

const BACKEND = "http://localhost:8000";
const POLL_MS = 60_000;

const EMPTY_SCORE = {
  exhaustion_score: 0,
  cynicism_score: 0,
  efficacy_score: 0,
  total_score: 0,
  risk_tier: "BALANCED",
  context_switch_rate: 0,
  fragmentation_index: 0,
  total_active_hours: 0,
  avg_session_min: 0,
  doomscroll_time_pct: 0,
  passive_time_pct: 0,
  productive_time_pct: 0,
  sessions_over_90min: 0,
  recommendations: [],
  computed_at: new Date(0).toISOString(),
};

export function useBurnoutScore() {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const analyze = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/analyze`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setScore(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    analyze();
    const interval = setInterval(analyze, POLL_MS);
    return () => clearInterval(interval);
  }, [analyze]);

  return {
    score,
    loading,
    error,
    refresh: analyze,
    clearLocal: () => {
      setScore(EMPTY_SCORE);
      setError(null);
      setLoading(false);
    },
  };
}
