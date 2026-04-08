import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./AuthPage.css";

const MODE_COPY = {
  "sign-in": {
    title: "Welcome back",
    body: "Sign in to see your live burnout dashboard, synced browsing insights, and Buddy chat.",
    button: "Sign In",
  },
  "sign-up": {
    title: "Create your account",
    body: "Start with a simple email and password so your dashboard experience feels personal from day one.",
    button: "Create Account",
  },
  "reset": {
    title: "Reset your password",
    body: "We’ll send you a password reset email through Supabase so you can get back in gently.",
    button: "Send Reset Link",
  },
};

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [mode, setMode] = useState("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectPath = useMemo(() => location.state?.from?.pathname || "/dashboard", [location.state]);

  useEffect(() => {
    if (!loading && user) {
      navigate(redirectPath, { replace: true });
    }
  }, [loading, navigate, redirectPath, user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (mode === "sign-in") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        navigate(redirectPath, { replace: true });
      }

      if (mode === "sign-up") {
        const { error: authError, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: fullName ? { full_name: fullName } : undefined,
          },
        });

        if (authError) throw authError;

        if (data.session) {
          navigate(redirectPath, { replace: true });
        } else {
          setMessage("Account created. Check your inbox to confirm your email before signing in.");
        }
      }

      if (mode === "reset") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });

        if (authError) throw authError;

        setMessage("Password reset email sent. Follow the link in your inbox to choose a new password.");
      }
    } catch (authError) {
      setError(authError.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const copy = MODE_COPY[mode];

  return (
    <main className="auth-page">
      <div className="auth-page__wash auth-page__wash--one" />
      <div className="auth-page__wash auth-page__wash--two" />

      <header className="auth-page__header">
        <Link className="auth-page__brand" to="/">
          <img alt="Dachshund mascot" src="/design/side.png" />
          <div>
            <strong>Dachshund</strong>
            <span>Your personal burnout buddy</span>
          </div>
        </Link>
        <Link className="auth-page__home" to="/">
          Back Home
        </Link>
      </header>

      <section className="auth-shell">
        <article className="auth-card auth-card--copy">
          <span className="auth-card__eyebrow">Account</span>
          <h1>{copy.title}</h1>
          <p>{copy.body}</p>

          <div className="auth-benefits">
            <div className="auth-benefit">
              <strong>Protected dashboard</strong>
              <span>Your dashboard route checks for a real Supabase session before loading sensitive product views.</span>
            </div>
            <div className="auth-benefit">
              <strong>Persistent sessions</strong>
              <span>Supabase keeps you signed in across refreshes so the experience feels continuous instead of fragile.</span>
            </div>
            <div className="auth-benefit">
              <strong>Buddy chat</strong>
              <span>Once you are inside, the OpenAI-powered Buddy can explain score changes and suggest next steps.</span>
            </div>
          </div>
        </article>

        <article className="auth-card auth-card--form">
          <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              className={`auth-tabs__item${mode === "sign-in" ? " is-active" : ""}`}
              onClick={() => setMode("sign-in")}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tabs__item${mode === "sign-up" ? " is-active" : ""}`}
              onClick={() => setMode("sign-up")}
            >
              Sign Up
            </button>
            <button
              type="button"
              className={`auth-tabs__item${mode === "reset" ? " is-active" : ""}`}
              onClick={() => setMode("reset")}
            >
              Reset
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "sign-up" ? (
              <label className="auth-field">
                <span>Full name</span>
                <input onChange={(event) => setFullName(event.target.value)} type="text" value={fullName} />
              </label>
            ) : null}

            <label className="auth-field">
              <span>Email</span>
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>

            {mode !== "reset" ? (
              <label className="auth-field">
                <span>Password</span>
                <input
                  autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                  minLength={6}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </label>
            ) : null}

            {error ? <div className="auth-form__error">{error}</div> : null}
            {message ? <div className="auth-form__message">{message}</div> : null}

            <button className="auth-form__submit" disabled={submitting} type="submit">
              {submitting ? "Working..." : copy.button}
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}
