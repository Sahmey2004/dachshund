import React, { useState } from "react";
import { Link } from "react-router-dom";
import { BurnoutGauge } from "../components/BurnoutGauge.jsx";
import { AlertBanner } from "../components/AlertBanner.jsx";
import { ChatWidget } from "../components/ChatWidget.jsx";
import { LiveFeed } from "../components/LiveFeed.jsx";
import { TimelineChart } from "../components/TimelineChart.jsx";
import { SiteBreakdown } from "../components/SiteBreakdown.jsx";
import { RecommendationCards } from "../components/RecommendationCards.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useBurnoutScore } from "../hooks/useBurnoutScore.js";
import { useTabEvents } from "../hooks/useTabEvents.js";
import "./DashboardPage.css";

const BACKEND = "http://localhost:8000";

function MBIDimensions({ score }) {
  const dims = [
    {
      label: "Exhaustion",
      value: score?.exhaustion_score ?? 0,
      icon: "🔋",
      tone: "peach",
      detail: "Flags energy drain from passive time, long sessions, overwork, and late-night activity.",
    },
    {
      label: "Cynicism",
      value: score?.cynicism_score ?? 0,
      icon: "🌤",
      tone: "rose",
      detail: "Tracks doomscrolling and repeated switching that signal growing mental distance from work.",
    },
    {
      label: "Efficacy Loss",
      value: score?.efficacy_score ?? 0,
      icon: "🦴",
      tone: "lavender",
      detail: "Measures low productive time and fragmented attention that can erode a sense of effectiveness.",
    },
  ];

  return (
    <div className="dashboard-dimensions">
      {dims.map((dimension) => (
        <div className="dashboard-dimension" key={dimension.label}>
          <div className="dashboard-dimension__meta">
            <span className="dashboard-dimension__label">{dimension.icon} {dimension.label}</span>
            <span className={`dashboard-dimension__value dashboard-dimension__value--${dimension.tone}`}>
              {dimension.value.toFixed(1)}/33
            </span>
          </div>
          <div className="dashboard-dimension__track">
            <div
              className={`dashboard-dimension__bar dashboard-dimension__bar--${dimension.tone}`}
              style={{ width: `${Math.min(100, (dimension.value / 33) * 100)}%` }}
            />
          </div>
          <div className="dashboard-dimension__detail">{dimension.detail}</div>
        </div>
      ))}
    </div>
  );
}

function StatPill({ label, value, unit = "" }) {
  return (
    <div className="dashboard-stat">
      <div className="dashboard-stat__label">{label}</div>
      <div className="dashboard-stat__value">
        {value}
        {unit ? <span>{unit}</span> : null}
      </div>
    </div>
  );
}

async function seedAndRefresh(refresh) {
  await fetch(`${BACKEND}/seed`, { method: "POST" });
  refresh();
}

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const { score, error, refresh, clearLocal: clearLocalScore } = useBurnoutScore();
  const { events, refresh: refreshEvents, clearLocal: clearLocalEvents } = useTabEvents();
  const [seeding, setSeeding] = useState(false);

  async function handleSeed() {
    setSeeding(true);
    await seedAndRefresh(refresh);
    setSeeding(false);
  }

  async function handleClearSeed() {
    clearLocalScore();
    clearLocalEvents();
    await fetch(`${BACKEND}/all`, { method: "DELETE" });
    await Promise.all([refresh(), refreshEvents()]);
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__wash dashboard-page__wash--one" />
      <div className="dashboard-page__wash dashboard-page__wash--two" />
      <img className="dashboard-page__swiggle" src="/design/swiggle2.png" alt="" aria-hidden="true" />

      <header className="dashboard-header">
        <div className="dashboard-header__brand">
          <img src="/design/side.png" alt="Dachshund mascot" />
          <div>
            <div className="dashboard-header__title">Dachshund</div>
            <div className="dashboard-header__subtitle">Burnout Tracker</div>
          </div>
        </div>

        <div className="dashboard-header__actions">
          {user?.email ? <span className="dashboard-header__timestamp dashboard-header__timestamp--account">{user.email}</span> : null}
          {score ? (
            <span className="dashboard-header__timestamp">
              Last updated {new Date(score.computed_at).toLocaleTimeString()}
            </span>
          ) : null}
          <Link className="dashboard-header__button dashboard-header__button--secondary" to="/about">
            About
          </Link>
          <button className="dashboard-header__button dashboard-header__button--primary" onClick={handleSeed} disabled={seeding}>
            {seeding ? "Loading…" : "Load Demo Data"}
          </button>
          <button className="dashboard-header__button dashboard-header__button--secondary" onClick={handleClearSeed}>
            Clear Demo
          </button>
          <button className="dashboard-header__button dashboard-header__button--ghost" onClick={() => signOut()}>
            Log out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {error ? (
          <div className="dashboard-error">
            Backend offline. Start with: <code>cd backend && uvicorn server:app --reload --port 8000</code>
          </div>
        ) : null}

        <AlertBanner riskTier={score?.risk_tier ?? "BALANCED"} />

        <section className="dashboard-overview">
          <article className="dashboard-card dashboard-card--hero">
            <div className="dashboard-card__eyebrow">Burnout Risk</div>
            <div className="dashboard-card__content dashboard-card__content--hero">
              <div className="dashboard-card__hero-copy">
                <h1>Today’s emotional weather</h1>
                <p>
                  Track how focus, fatigue, and digital drift are shaping your day without changing the data behind
                  your score.
                </p>
              </div>
              <BurnoutGauge score={score?.total_score ?? 0} />
            </div>
          </article>

          <article className="dashboard-card">
            <div className="dashboard-card__eyebrow">MBI Dimensions</div>
            {score ? (
              <MBIDimensions score={score} />
            ) : (
              <div className="dashboard-empty">Loading…</div>
            )}
          </article>

          <article className="dashboard-card">
            <div className="dashboard-card__eyebrow">Session Stats</div>
            {score ? (
              <div className="dashboard-stats-grid">
                <StatPill label="Context Switches/hr" value={score.context_switch_rate} />
                <StatPill label="Active Hours" value={score.total_active_hours} unit="hr" />
                <StatPill label="Avg Session" value={score.avg_session_min} unit="min" />
                <StatPill label="Doomscroll" value={score.doomscroll_time_pct} unit="%" />
              </div>
            ) : (
              <div className="dashboard-empty">Loading…</div>
            )}
          </article>
        </section>

        <section className="dashboard-grid dashboard-grid--timeline">
          <article className="dashboard-card dashboard-card--wide">
            <div className="dashboard-card__eyebrow">Activity Timeline</div>
            <TimelineChart events={events} />
          </article>
          <article className="dashboard-card">
            <div className="dashboard-card__eyebrow">Live Feed</div>
            <LiveFeed events={events} />
          </article>
        </section>

        <section className="dashboard-grid dashboard-grid--insights">
          <article className="dashboard-card">
            <div className="dashboard-card__eyebrow">Time by Category</div>
            <SiteBreakdown events={events} />
          </article>
          <article className="dashboard-card dashboard-card--wide">
            <div className="dashboard-card__eyebrow">AI Recommendations</div>
            {score?.recommendations ? (
              <RecommendationCards recommendations={score.recommendations} />
            ) : (
              <div className="dashboard-empty">
                Load demo data or browse with the extension to get recommendations.
              </div>
            )}
          </article>
        </section>
      </main>

      <ChatWidget score={score} />
    </div>
  );
}
