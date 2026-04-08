import React, { useEffect, useRef, useState } from "react";
import "./ChatWidget.css";

const BACKEND = "http://localhost:8000";

function buildGreeting(score) {
  if (!score) {
    return "I can help you interpret your dashboard and suggest a calmer next step once your score loads.";
  }

  const tier = score.risk_tier?.toLowerCase().replaceAll("_", " ") || "balanced";
  return `You look ${tier} right now. Ask me what changed, what the score means, or what tiny reset might help today.`;
}

export function ChatWidget({ score }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: buildGreeting(score) },
  ]);
  const threadRef = useRef(null);

  useEffect(() => {
    setMessages((current) => {
      if (current.length !== 1 || current[0].role !== "assistant") {
        return current;
      }

      return [{ role: "assistant", content: buildGreeting(score) }];
    });
  }, [score]);

  useEffect(() => {
    if (!threadRef.current) return;
    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, open]);

  async function handleSubmit(event) {
    event.preventDefault();
    const message = input.trim();
    if (!message || sending) return;

    setInput("");
    setSending(true);
    setMessages((current) => [...current, { role: "user", content: message }]);

    try {
      const response = await fetch(`${BACKEND}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.reply || "I couldn't think of a response just yet, but try asking again.",
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: `I hit a snag reaching the chat service: ${error.message}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`chat-widget${open ? " is-open" : ""}`}>
      <button className="chat-widget__fab" onClick={() => setOpen((current) => !current)} type="button">
        {open ? "Close Buddy" : "Chat with Buddy"}
      </button>

      {open ? (
        <section className="chat-widget__panel" aria-label="Burnout Buddy chat">
          <header className="chat-widget__header">
            <div>
              <strong>Burnout Buddy</strong>
              <span>OpenAI-powered check-ins using your live dashboard data</span>
            </div>
          </header>

          <div className="chat-widget__thread" ref={threadRef}>
            {messages.map((message, index) => (
              <div
                className={`chat-widget__message chat-widget__message--${message.role}`}
                key={`${message.role}-${index}`}
              >
                {message.content}
              </div>
            ))}
          </div>

          <form className="chat-widget__composer" onSubmit={handleSubmit}>
            <input
              className="chat-widget__input"
              disabled={sending}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask what changed today or what to do next..."
              type="text"
              value={input}
            />
            <button className="chat-widget__send" disabled={sending || !input.trim()} type="submit">
              {sending ? "Thinking..." : "Send"}
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
