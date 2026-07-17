import React, { useMemo, useState } from "react";
import ServingsControl from "./ServingsControl.jsx";
import IngredientList from "./IngredientList.jsx";
import StepList from "./StepList.jsx";

export default function RecipeView({ recipe, onRegenerate }) {
  const [servings, setServings] = useState(recipe.baseServings);
  const [checked, setChecked] = useState({});

  const scale = servings / recipe.baseServings;

  const toggleStep = (id) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const allDone = useMemo(
    () => recipe.steps.length > 0 && recipe.steps.every((s) => checked[s.id]),
    [checked, recipe.steps]
  );

  return (
    <article className="recipe-card">
      <div className="recipe-header">
        <div>
          <h2>{recipe.title}</h2>
          <p className="recipe-desc">{recipe.description}</p>
        </div>
        <button type="button" className="ghost-btn" onClick={onRegenerate}>
          Regenerate
        </button>
      </div>

      <div className="recipe-meta">
        <span className="meta-pill">⏱ {recipe.totalTimeMinutes} min</span>
        <ServingsControl servings={servings} baseServings={recipe.baseServings} onChange={setServings} />
      </div>

      <div className="recipe-body">
        <section>
          <h3>Ingredients</h3>
          <IngredientList ingredients={recipe.ingredients} scale={scale} />
        </section>

        <section>
          <StepList steps={recipe.steps} checked={checked} onToggle={toggleStep} />
        </section>
      </div>

      {allDone && (
        <div className="done-banner" role="status">
          🎉 All steps done — enjoy your {recipe.title.toLowerCase()}.
        </div>
      )}

      {recipe.notes && (
        <p className="recipe-notes">
          <strong>Note:</strong> {recipe.notes}
        </p>
      )}
    </article>
  );
}
