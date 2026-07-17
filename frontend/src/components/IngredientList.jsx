import React, { useState } from "react";

function formatAmount(amount) {
  if (!isFinite(amount)) return "";
  const rounded = Math.round(amount * 100) / 100;
  // Prefer simple fractions for common cooking amounts so it doesn't read as "0.33 cup".
  const fraction = toNiceFraction(rounded);
  return fraction ?? String(rounded);
}

function toNiceFraction(n) {
  const whole = Math.floor(n);
  const rem = n - whole;
  const fractions = [
    [0.25, "¼"],
    [0.33, "⅓"],
    [0.5, "½"],
    [0.66, "⅔"],
    [0.67, "⅔"],
    [0.75, "¾"],
  ];
  for (const [val, symbol] of fractions) {
    if (Math.abs(rem - val) < 0.02) {
      return `${whole > 0 ? whole + " " : ""}${symbol}`;
    }
  }
  return null;
}

function Ingredient({ ingredient, scale }) {
  const [open, setOpen] = useState(false);
  const scaledAmount = ingredient.amount * scale;
  const hasSwaps = ingredient.swaps && ingredient.swaps.length > 0;

  return (
    <li className="ingredient-row">
      <div className="ingredient-main">
        <span className="ingredient-amount">
          {formatAmount(scaledAmount)} {ingredient.unit}
        </span>
        <span className="ingredient-name">{ingredient.name}</span>
        {hasSwaps && (
          <button
            type="button"
            className="swap-toggle"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            swap
          </button>
        )}
      </div>
      {open && hasSwaps && (
        <ul className="swap-list">
          {ingredient.swaps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function IngredientList({ ingredients, scale }) {
  return (
    <ul className="ingredient-list">
      {ingredients.map((ing) => (
        <Ingredient key={ing.id} ingredient={ing} scale={scale} />
      ))}
    </ul>
  );
}
