import { useState, useEffect, useCallback } from "react";

const BACKEND = "http://localhost:8000";
const POLL_MS = 10_000;

export function useTabEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async (cancelled = false) => {
    try {
      const res = await fetch(`${BACKEND}/events?limit=50`);
      if (!res.ok) return;
      const data = await res.json();
      if (!cancelled) {
        setEvents(data.events || []);
        setLoading(false);
      }
    } catch {
      if (!cancelled) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchEvents(cancelled);
    const interval = setInterval(() => fetchEvents(cancelled), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [fetchEvents]);

  return {
    events,
    loading,
    refresh: () => fetchEvents(false),
    clearLocal: () => {
      setEvents([]);
      setLoading(false);
    },
  };
}
