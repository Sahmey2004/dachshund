import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./AboutPage.css";

const formulaRows = [
  {
    title: "Exhaustion",
    formula: "(passive_time_pct / 100) * 25 + sessions_over_90min * 14 + max(0, total_active_hours - 8) * 5 + late_night_events * 2",
    note: "This factor reacts to passive escape time, very long sessions, overwork, and late-night browsing.",
  },
  {
    title: "Cynicism",
    formula: "(doomscroll_time_pct / 100) * 45 + switch_count * 0.35",
    note: "This factor reacts to doomscrolling and frequent switching, which the app treats as disengagement signals.",
  },
  {
    title: "Efficacy Loss",
    formula: "(1 - productive_time_pct / 100) * 30 + min(context_switch_rate / 12, 1) * 5",
    note: "This factor reacts to low productive time and fragmented attention that can make work feel less effective.",
  },
];

const sources = [
  {
    label: "WHO ICD-11 burnout definition",
    href: "https://www.who.int/news/item/28-05-2019-burn-out-an-occupational-phenomenon-international-classification-of-diseases",
    text: "WHO describes burnout as an occupational phenomenon with three dimensions: exhaustion, cynicism or mental distance, and reduced professional efficacy.",
  },
  {
    label: "MBI cutoff caveat",
    href: "https://www.mindgarden.com/documents/MBI-Cutoff-Caveat.pdf",
    text: "The Maslach Burnout Inventory authors note that burnout is best treated as a continuum and that old cutoff bands were not meant to diagnose individuals.",
  },
  {
    label: "Burnout profiles paper",
    href: "https://www.sciencedirect.com/science/article/pii/S221305861630007X",
    text: "Leiter and Maslach discuss burnout profiles as patterns across the dimensions rather than a single official diagnostic score.",
  },
];

export default function AboutPage() {
  const { user, signOut } = useAuth();

  return (
    <main className="about-page">
      <div className="about-page__wash about-page__wash--one" />
      <div className="about-page__wash about-page__wash--two" />
      <img className="about-page__swiggle" src="/design/swiggle2.png" alt="" aria-hidden="true" />

      <header className="about-header">
        <div className="about-header__brand">
          <img src="/design/side.png" alt="Dachshund mascot" />
          <div>
            <div className="about-header__title">Dachshund</div>
            <div className="about-header__subtitle">About the Score</div>
          </div>
        </div>
        <nav className="about-header__nav">
          <Link to="/">Home</Link>
          <Link to="/dashboard">Dashboard</Link>
          {user ? (
            <button type="button" onClick={() => signOut()}>
              Log out
            </button>
          ) : (
            <Link to="/auth">Log in</Link>
          )}
        </nav>
      </header>

      <section className="about-hero">
        <span className="about-hero__eyebrow">Methodology</span>
        <h1>How Dachshund calculates burnout risk.</h1>
        <p>
          Dachshund uses a custom, MBI-inspired score. It is not an official Maslach Burnout Inventory diagnosis.
          Instead, it converts browsing patterns into three burnout dimensions that mirror the burnout structure
          described by WHO and the MBI literature.
        </p>
      </section>

      <section className="about-grid">
        <article className="about-card about-card--wide">
          <div className="about-card__eyebrow">What we implement</div>
          <h2>A project-specific score built on burnout dimensions.</h2>
          <p>
            The app models <strong>Exhaustion</strong>, <strong>Cynicism</strong>, and{" "}
            <strong>Efficacy Loss</strong>. Those are aligned with the three-dimension burnout structure used by WHO
            and the Maslach framework, but the actual weights, caps, and thresholds in Dachshund are custom heuristics
            defined in the backend formula.
          </p>
          <div className="about-card__callout">
            Important: Dachshund is implementing a product heuristic, not a clinical scoring standard or diagnosis.
          </div>
        </article>

        <article className="about-card">
          <div className="about-card__eyebrow">Risk tiers</div>
          <ul className="about-list">
            <li><strong>0-35</strong> Balanced</li>
            <li><strong>36-65</strong> Caution</li>
            <li><strong>66-85</strong> At Risk</li>
            <li><strong>86-100</strong> Critical</li>
          </ul>
        </article>
      </section>

      <section className="about-formula">
        <div className="about-formula__intro">
          <div className="about-card__eyebrow">Formula</div>
          <h2>The exact score used in this app</h2>
          <p>
            Each sub-score is capped at 33 points. The dashboard total is the sum of those capped components, which is
            why the final score behaves like a 0-100 scale.
          </p>
        </div>

        <div className="about-formula__grid">
          {formulaRows.map((row) => (
            <article className="about-card" key={row.title}>
              <h3>{row.title}</h3>
              <code>{row.formula}</code>
              <p>{row.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-sources">
        <div className="about-card__eyebrow">Sources</div>
        <h2>Research and policy references</h2>
        <div className="about-sources__list">
          {sources.map((source) => (
            <article className="about-card" key={source.href}>
              <h3>{source.label}</h3>
              <p>{source.text}</p>
              <a href={source.href} target="_blank" rel="noreferrer">Open source</a>
            </article>
          ))}
        </div>
      </section>

      <section className="about-auth">
        <div className="about-card__eyebrow">Account flow</div>
        <h2>How login works in this app</h2>
        <div className="about-auth__panel">
          <p className="about-auth__message">
            Dachshund now uses Supabase Auth for email and password sign-up, sign-in, session persistence, and
            password reset emails. The dashboard route checks for a session before it loads.
          </p>
          <ul className="about-auth__list">
            <li><strong>Auth provider:</strong> Supabase email/password authentication</li>
            <li><strong>Protected route:</strong> `/dashboard` redirects to `/auth` when no session is present</li>
            <li><strong>Current session:</strong> {user?.email || "Not signed in right now"}</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
