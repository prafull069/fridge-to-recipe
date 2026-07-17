import React, { useState } from "react";

export default function IngredientInput({ onSubmit, disabled, examples, initialValue }) {
  const [value, setValue] = useState(initialValue || "");

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(value);
  }

  return (
    <form className="input-card" onSubmit={handleSubmit}>
      <label htmlFor="ingredients" className="input-label">
        What's in your fridge, freezer, or pantry?
      </label>
      <textarea
        id="ingredients"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. two chicken breasts, half a bag of spinach, garlic, some rice, a lemon..."
        rows={3}
        disabled={disabled}
      />
      <div className="input-row">
        <div className="examples">
          <span>Try:</span>
          {examples.map((ex) => (
            <button
              type="button"
              key={ex}
              className="example-chip"
              disabled={disabled}
              onClick={() => setValue(ex)}
            >
              {ex.split(",")[0]}…
            </button>
          ))}
        </div>
        <button type="submit" className="primary-btn" disabled={disabled}>
          {disabled ? "Cooking up ideas…" : "Get a recipe"}
        </button>
      </div>
    </form>
  );
}
