import React from "react";

const FRIENDLY_MESSAGES = {
  EMPTY_INPUT: "Add at least one ingredient before generating a recipe.",
  TIMEOUT: "The model took too long to respond. It happens with slower models — try again.",
  MODEL_UNAVAILABLE: "Couldn't reach the model right now. Check your connection and try again.",
  INVALID_MODEL_OUTPUT: "The model kept returning something that didn't look like a proper recipe, even after a couple of retries.",
  MISSING_API_KEY: "The server isn't configured with an API key yet — check backend/.env.",
  BAD_RESPONSE: "The server sent back something the app couldn't understand.",
  SERVER_ERROR: "Something went wrong on the server.",
};

export default function ErrorState({ info, onRetry }) {
  const message = FRIENDLY_MESSAGES[info?.code] || info?.message || "Something went wrong.";

  return (
    <div className="state-card error-state">
      <div className="state-icon" aria-hidden="true">
        ⚠️
      </div>
      <h2>Couldn't get a recipe</h2>
      <p>{message}</p>
      {info?.code && <p className="error-code">Error code: {info.code}</p>}
      {onRetry && (
        <button className="primary-btn" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
