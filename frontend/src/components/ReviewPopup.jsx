"use client";
import { useState, useEffect } from "react";

const StarIcon = ({ filled, hovered }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled || hovered ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={1.5}
    style={{ width: "2rem", height: "2rem", transition: "all 0.15s ease" }}
  >
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
);

export default function ReviewPopup({ isOpen, onClose, onSubmit, actionLabel = "your booking" }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
      setTimeout(() => {
        setRating(0);
        setHovered(0);
        setSubmitted(false);
        setSubmitting(false);
        setError("");
      }, 300);
    }
  }, [isOpen]);

  const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
  const colors = ["", "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];

  const handleSubmit = async () => {
    if (!rating) return;
    setSubmitting(true);
    setError("");

    try {
      await onSubmit?.({ rating, label: labels[rating] });
      setSubmitted(true);
      setTimeout(() => onClose?.(), 1800);
    } catch (submitError) {
      setError(submitError?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(3px)", zIndex: 999,
          opacity: visible ? 1 : 0, transition: "opacity 0.3s ease",
        }}
      />
      <div
        style={{
          position: "fixed", bottom: "2rem", right: "2rem", zIndex: 1000,
          width: "min(22rem, calc(100vw - 2rem))", background: "#0f0f0f",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1.25rem",
          padding: "1.75rem", fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
          boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(1.5rem) scale(0.96)",
          transition: "opacity 0.35s cubic-bezier(0.16,1,0.3,1), transform 0.35s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: "1rem", right: "1rem", background: "none",
            border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer",
            fontSize: "1.1rem", lineHeight: 1, padding: "0.2rem", borderRadius: "50%",
            transition: "color 0.2s",
          }}
          onMouseEnter={e => (e.target.style.color = "rgba(255,255,255,0.7)")}
          onMouseLeave={e => (e.target.style.color = "rgba(255,255,255,0.3)")}
        >✕</button>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🎉</div>
            <p style={{ color: "#fff", fontWeight: 600, fontSize: "1.05rem", margin: 0 }}>Thanks for your feedback!</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", marginTop: "0.35rem" }}>It really helps us improve.</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "1.25rem" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 0.3rem" }}>Quick Review</p>
              <h3 style={{ color: "#fff", fontSize: "1rem", fontWeight: 600, margin: 0, lineHeight: 1.4 }}>How was {actionLabel}?</h3>
            </div>

            <div style={{ display: "flex", gap: "0.3rem", justifyContent: "center", marginBottom: "0.6rem" }} onMouseLeave={() => setHovered(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} onMouseEnter={() => setHovered(star)}
                  style={{
                    background: "none", border: "none", cursor: "pointer", padding: "0.2rem",
                    color: star <= (hovered || rating) ? colors[hovered || rating] : "rgba(255,255,255,0.15)",
                    transform: star <= (hovered || rating) ? "scale(1.15)" : "scale(1)",
                    transition: "all 0.15s ease",
                  }}>
                  <StarIcon filled={star <= rating} hovered={star <= hovered} />
                </button>
              ))}
            </div>

            <p style={{ textAlign: "center", fontSize: "0.8rem", fontWeight: 500, color: colors[hovered || rating] || "transparent", minHeight: "1.2rem", margin: "0 0 1.25rem", transition: "color 0.15s ease" }}>
              {labels[hovered || rating]}
            </p>

            {error ? (
              <p style={{ color: "#fca5a5", fontSize: "0.8rem", textAlign: "center", margin: "0 0 1rem" }}>
                {error}
              </p>
            ) : null}

            <button onClick={handleSubmit} disabled={!rating || submitting}
              style={{
                width: "100%", padding: "0.7rem", borderRadius: "0.65rem", border: "none",
                background: rating ? colors[rating] : "rgba(255,255,255,0.07)",
                color: rating ? "#000" : "rgba(255,255,255,0.25)",
                fontWeight: 600, fontSize: "0.9rem", cursor: rating && !submitting ? "pointer" : "not-allowed",
                transition: "all 0.2s ease", fontFamily: "inherit",
              }}>
              {submitting ? "Submitting..." : "Submit Review"}
            </button>

            <button onClick={onClose}
              style={{ display: "block", margin: "0.75rem auto 0", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => (e.target.style.color = "rgba(255,255,255,0.5)")}
              onMouseLeave={e => (e.target.style.color = "rgba(255,255,255,0.25)")}
            >Maybe later</button>
          </>
        )}
      </div>
    </>
  );
}
