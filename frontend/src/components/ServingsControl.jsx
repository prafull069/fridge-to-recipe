import React from "react";

export default function ServingsControl({ servings, baseServings, onChange }) {
  const dec = () => onChange(Math.max(1, servings - 1));
  const inc = () => onChange(Math.min(50, servings + 1));

  return (
    <div className="servings-control">
      <span className="servings-label">Servings</span>
      <div className="stepper">
        <button type="button" onClick={dec} aria-label="Decrease servings">
          −
        </button>
        <span className="stepper-value">{servings}</span>
        <button type="button" onClick={inc} aria-label="Increase servings">
          +
        </button>
      </div>
      {servings !== baseServings && (
        <button type="button" className="reset-link" onClick={() => onChange(baseServings)}>
          reset to {baseServings}
        </button>
      )}
    </div>
  );
}
