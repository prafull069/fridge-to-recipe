import React from "react";

export default function StepList({ steps, checked, onToggle }) {
  const doneCount = steps.filter((s) => checked[s.id]).length;

  return (
    <div className="steps-block">
      <div className="steps-header">
        <h3>Steps</h3>
        <span className="steps-progress">
          {doneCount}/{steps.length} done
        </span>
      </div>
      <ol className="step-list">
        {steps.map((step, i) => (
          <li key={step.id} className={checked[step.id] ? "step-row done" : "step-row"}>
            <button
              type="button"
              className="step-check"
              onClick={() => onToggle(step.id)}
              aria-pressed={!!checked[step.id]}
              aria-label={checked[step.id] ? "Mark step as not done" : "Mark step as done"}
            >
              {checked[step.id] ? "✓" : i + 1}
            </button>
            <span className="step-text">{step.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
