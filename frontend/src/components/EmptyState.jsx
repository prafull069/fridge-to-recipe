import React from "react";

export default function EmptyState() {
  return (
    <div className="state-card empty-state">
      <div className="state-icon" aria-hidden="true">
        🧊
      </div>
      <h2>Nothing cooking yet</h2>
      <p>Type in a few ingredients above and hit "Get a recipe" — your interactive recipe card will show up here.</p>
    </div>
  );
}
