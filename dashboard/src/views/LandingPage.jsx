import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useBurnoutScore } from "../hooks/useBurnoutScore.js";
import { useTabEvents } from "../hooks/useTabEvents.js";
import "./LandingPage.css";

const features = [
  {
    title: "Track your browsing patterns",
    body: "See how your day actually unfolds with passive tab tracking that turns habits into a clear story.",
  },
  {
    title: "See your burnout risk live",
    body: "Open the dashboard to spot context switching, passive scrolling, and energy dips before they stack up.",
  },
  {
    title: "Get practical recovery suggestions",
    body: "Translate raw activity into small, grounded actions that help you reset without overhauling your workflow.",
  },
];

const fallbackRecommendations = [
  "Try a tiny reset when your tabs start multiplying.",
  "Feeling tense? Try the 20-20-20 rule. Look 20 feet away every 20 minutes for 20 seconds.",
  "A short screen break can help your focus bounce back faster.",
];

function formatMinutes(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

function buildBreakdown(events) {
  const totals = {
    work: 0,
    social: 0,
    rest: 0,
  };

  for (const event of events) {
    const minutes = Math.round((event.duration_ms || 0) / 60000);
    if (event.category === "PRODUCTIVE" || event.category === "COMMUNICATION") {
      totals.work += minutes;
    } else if (event.category === "FRAGMENTATION" || event.category === "PASSIVE_ESCAPE") {
      totals.social += minutes;
    } else {
      totals.rest += minutes;
    }
  }

  const totalMinutes = totals.work + totals.social + totals.rest;
  const safeTotal = totalMinutes || 1;
  const workPct = (totals.work / safeTotal) * 100;
  const socialPct = (totals.social / safeTotal) * 100;
  const restPct = (totals.rest / safeTotal) * 100;

  return {
    totalMinutes,
    items: [
      { key: "work", label: "Work", minutes: totals.work, pct: workPct, color: "#9ab8ea" },
      { key: "social", label: "Social", minutes: totals.social, pct: socialPct, color: "#7ab8bb" },
      { key: "rest", label: "Rest", minutes: totals.rest, pct: restPct, color: "#d1bddc" },
    ],
    gradient: `conic-gradient(#9ab8ea 0 ${workPct}%, #7ab8bb ${workPct}% ${workPct + socialPct}%, #d1bddc ${workPct + socialPct}% 100%)`,
  };
}

function recommendationSet(score) {
  return score?.recommendations?.length ? score.recommendations : fallbackRecommendations;
}

function riskLabel(score) {
  if (!score) return "Waiting for today’s data";
  return `${Math.round(score.total_score || 0)}/100 ${score.risk_tier?.replace("_", " ") || "BALANCED"}`;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const screentimeRef = useRef(null);
  const { user, signOut } = useAuth();

  const [showRibbonNav, setShowRibbonNav] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const { score } = useBurnoutScore();
  const { events } = useTabEvents();

  const breakdown = useMemo(() => buildBreakdown(events), [events]);
  const recommendations = useMemo(() => recommendationSet(score), [score]);
  const scoreNeedle = useMemo(() => {
    const total = Math.max(0, Math.min(100, score?.total_score ?? 0));
    return -70 + (total / 100) * 140;
  }, [score]);

  useEffect(() => {
    function handleScroll() {
      const y = window.scrollY;
      setShowRibbonNav(y > window.innerHeight * 0.72);

      const screentimeTop = screentimeRef.current?.offsetTop ?? Number.POSITIVE_INFINITY;

      if (y >= screentimeTop - 160) {
        setActiveSection("screen");
      } else {
        setActiveSection("home");
      }
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToSection(ref) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleAuthAction() {
    if (user) {
      await signOut();
      navigate("/");
      return;
    }

    navigate("/auth");
  }

  return (
    <main className="landing-page">
      <div className={`landing-ribbon-nav${showRibbonNav ? " is-visible" : ""}`}>
        <div className="landing-ribbon-nav__shell">
          <div className="landing-ribbon-nav__items">
            <button
              type="button"
              className="landing-ribbon-nav__brand"
              onClick={() => scrollToSection(heroRef)}
              aria-label="Go to top"
            >
              Dachshund
            </button>
            <button
              type="button"
              className={`landing-ribbon-nav__item${activeSection === "home" ? " is-active" : ""}`}
              onClick={() => scrollToSection(heroRef)}
            >
              Home
            </button>
            <button
              type="button"
              className={`landing-ribbon-nav__item${activeSection === "screen" ? " is-active" : ""}`}
              onClick={() => scrollToSection(screentimeRef)}
            >
              My Screentime
            </button>
            <button
              type="button"
              className="landing-ribbon-nav__item"
              onClick={() => navigate("/about")}
            >
              About
            </button>
            <button type="button" className="landing-ribbon-nav__item" onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>
            <button type="button" className="landing-ribbon-nav__item" onClick={handleAuthAction}>
              {user ? "Log out" : "Log in"}
            </button>
            <a className="landing-ribbon-nav__item" href="/downloads/dachshund-extension.zip" download="dachshund-extension.zip">
              Download
            </a>
          </div>
        </div>
      </div>

      <section className="landing-hero" ref={heroRef}>
        <div className="landing-hero__glow landing-hero__glow--left" />
        <div className="landing-hero__glow landing-hero__glow--right" />
        <div className="landing-hero__stack">
          <div className="landing-hero__content">
            <div className="landing-hero__eyebrow">Personal burnout tracking for busy builders</div>
            <h1 className="landing-hero__title">Dachshund</h1>
            <p className="landing-hero__subtitle">Your Personal Burnout Buddy</p>
            <div className="landing-hero__actions">
              <Link className="landing-button landing-button--primary" to="/dashboard">
                Dashboard
              </Link>
              <a
                className="landing-button landing-button--secondary"
                href="/downloads/dachshund-extension.zip"
                download="dachshund-extension.zip"
              >
                Download Extension
              </a>
            </div>
          </div>
          <div className="landing-hero__mascot-wrap">
            <img className="landing-hero__mascot" src="/design/side.png" alt="Dachshund mascot" />
          </div>
        </div>
      </section>

      <section className="landing-features">
        <div className="landing-features__swiggle" aria-hidden="true">
          <img src="/design/swiggle2.png" alt="" />
        </div>
        <div className="landing-features__top">
          <div className="landing-features__intro">
            <span className="landing-features__label">Why it works</span>
            <h2 className="landing-features__title">A calmer way to notice burnout before it bites.</h2>
            <p className="landing-features__copy">
              Dachshund watches for the subtle signals hiding in your browser activity and turns them into a clearer,
              kinder picture of how your workday feels.
            </p>
          </div>

          <div className="landing-features__chips" aria-hidden="true">
            <div className="landing-pill landing-pill--focus">Focus Session</div>
            <div className="landing-pill landing-pill--break">Take a 5-min Break</div>
            <div className="landing-pill landing-pill--tip">Tip of the Day</div>
          </div>
        </div>

        <div className="landing-showcase" ref={screentimeRef}>
          <div className="landing-showcase__chrome">
            <div className="landing-showcase__brand">
              <img src="/design/side.png" alt="Dachshund mascot" />
              <div>
                <strong>Burnout Buddy</strong>
                <span>live from your actual dashboard data</span>
              </div>
            </div>
            <div className="landing-showcase__status">{events.length ? `${events.length} recent events synced` : "No live events yet"}</div>
          </div>

          <div className="landing-showcase__controls">
            <button type="button" className="landing-showcase__toggle landing-showcase__toggle--active">Focus</button>
            <button type="button" className="landing-showcase__toggle">Break</button>
          </div>

          <div className="landing-showcase__grid">
            <article className="landing-panel landing-panel--chart">
              <div className="landing-panel__heading">Daily Screentime Breakdown</div>
              <div className="landing-panel__chart-wrap">
                <div className="landing-donut" style={{ background: breakdown.gradient }}>
                  <div className="landing-donut__hole">
                    <span>{breakdown.totalMinutes ? formatMinutes(breakdown.totalMinutes) : "0m"}</span>
                  </div>
                </div>
                <div className="landing-legend">
                  {breakdown.items.map((item) => (
                    <span key={item.key}>
                      <i className={`dot dot--${item.key}`} />
                      {item.label} {item.minutes ? `· ${formatMinutes(item.minutes)}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            </article>

            <article className="landing-panel landing-panel--score">
              <div className="landing-panel__heading">Current Burnout Score</div>
              <div className="landing-score-arch">
                <div className="landing-score-arch__bone" style={{ transform: `translate(-50%, -50%) rotate(${scoreNeedle}deg)` }} />
                <span className="landing-score-arch__low">Low</span>
                <span className="landing-score-arch__high">High</span>
              </div>
              <div className="landing-panel__scoreline">{riskLabel(score)}</div>
              <img className="landing-panel__mascot" src="/design/side.png" alt="Dachshund mascot" />
            </article>

            <article className="landing-panel landing-panel--tips">
              <div className="landing-tip-card">
                <div className="landing-tip-card__title">Related Tips</div>
                <p>{recommendations[0]}</p>
              </div>
              <div className="landing-tip-card landing-tip-card--large">
                <div className="landing-tip-card__title">Tip of the Day</div>
                <p>{recommendations[1]}</p>
              </div>
            </article>

            <article className="landing-panel landing-panel--chat">
              <div className="landing-chat">
                <div className="landing-chat__header">Burnout Buddy Chat</div>
                <div className="landing-chat__bubble">
                  Buddy: {score ? `You’re ${score.risk_tier?.toLowerCase().replace("_", " ")} today. Want a quick reset?` : "Need a quick check-in?"}
                </div>
                <div className="landing-chat__bubble landing-chat__bubble--self">You: Show me what changed today.</div>
                <div className="landing-chat__input">{recommendations[2]}</div>
              </div>
            </article>
          </div>
        </div>

        <div className="landing-features__grid">
          {features.map((feature, index) => (
            <article className="landing-card" key={feature.title}>
              <div className="landing-card__index">0{index + 1}</div>
              <h3 className="landing-card__title">{feature.title}</h3>
              <p className="landing-card__body">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
