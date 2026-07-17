// Thin wrapper around the backend call. Kept separate from components so the
// "what does calling the model actually look like" logic is in one place.
export async function generateRecipe(ingredients, signal) {
  const res = await fetch("/api/generate-recipe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingredients }),
    signal,
  });

  let body;
  try {
    body = await res.json();
  } catch {
    throw { code: "BAD_RESPONSE", message: "The server sent back something unreadable." };
  }

  if (!res.ok) {
    throw { code: body.error || "UNKNOWN", message: body.message || "Something went wrong." };
  }

  return body.recipe;
}
