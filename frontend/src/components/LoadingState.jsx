import React from "react";

export default function LoadingState() {
  return (
    <div className="state-card loading-state" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <h2>Working out a recipe…</h2>
      <p>This usually takes a few seconds. Slower models can take longer — we'll keep waiting up to 25s.</p>
      <div className="skeleton-block">
        <div className="skeleton-line w-60" />
        <div className="skeleton-line w-40" />
        <div className="skeleton-line w-80" />
        <div className="skeleton-line w-70" />
      </div>
    </div>
  );
}
