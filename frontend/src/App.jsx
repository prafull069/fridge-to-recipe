import React, { useRef, useState, useCallback } from "react";
import { generateRecipe } from "./api.js";
import IngredientInput from "./components/IngredientInput.jsx";
import RecipeView from "./components/RecipeView.jsx";
import LoadingState from "./components/LoadingState.jsx";
import ErrorState from "./components/ErrorState.jsx";
import EmptyState from "./components/EmptyState.jsx";

const EXAMPLES = [
  "eggs, spinach, feta, half an onion, stale bread",
  "chicken thighs, rice, soy sauce, garlic, frozen peas",
  "chickpeas, canned tomatoes, coconut milk, cumin, spinach",
];

export default function App() {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [recipe, setRecipe] = useState(null);
  const [recipeKey, setRecipeKey] = useState(0);
  const [errorInfo, setErrorInfo] = useState(null);
  const [lastQuery, setLastQuery] = useState("");

  // Guards against a slow, stale request overwriting a newer one: every
  // submit gets an incrementing id, and only the response matching the
  // *current* id is allowed to update state. The AbortController on top of
  // that actually cancels the in-flight network request.
  const requestIdRef = useRef(0);
  const controllerRef = useRef(null);

  const submit = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setStatus("error");
      setErrorInfo({ code: "EMPTY_INPUT", message: "Add at least one ingredient before generating a recipe." });
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const thisRequestId = ++requestIdRef.current;

    setStatus("loading");
    setErrorInfo(null);
    setLastQuery(trimmed);

    try {
      const result = await generateRecipe(trimmed, controller.signal);
      if (requestIdRef.current !== thisRequestId) return; // a newer request has since started
      setRecipe(result);
      setRecipeKey((k) => k + 1);
      setStatus("success");
    } catch (err) {
      if (err?.name === "AbortError") return; // superseded by a newer request, not a real error
      if (requestIdRef.current !== thisRequestId) return;
      setErrorInfo({ code: err.code || "UNKNOWN", message: err.message || "Something went wrong." });
      setStatus("error");
    }
  }, []);

  const retry = useCallback(() => {
    if (lastQuery) submit(lastQuery);
  }, [lastQuery, submit]);

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">fridge → recipe</p>
        <h1>What's rattling around in there?</h1>
        <p className="hero-sub">
          List whatever you've got — half an onion, leftover rice, three eggs — and get a real recipe you can cook,
          scale, and swap your way through.
        </p>
      </header>

      <IngredientInput
        onSubmit={submit}
        disabled={status === "loading"}
        examples={EXAMPLES}
        initialValue={lastQuery}
      />

      <main className="result-area">
        {status === "idle" && <EmptyState />}
        {status === "loading" && <LoadingState />}
        {status === "error" && <ErrorState info={errorInfo} onRetry={lastQuery ? retry : undefined} />}
        {status === "success" && recipe && (
          <RecipeView key={recipeKey} recipe={recipe} onRegenerate={retry} />
        )}
      </main>
    </div>
  );
}
