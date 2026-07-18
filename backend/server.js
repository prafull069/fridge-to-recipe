import "dotenv/config";
import express from "express";
import cors from "cors";
import { safeParseRecipe } from "./schema.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const { BASE_URL, MODEL, API_KEY, PORT = 8787 } = process.env;
console.log("DEBUG ENV:", { BASE_URL, MODEL, hasKey: !!API_KEY, keyPrefix: API_KEY?.slice(0,8), PORT });

const SYSTEM_PROMPT = `You are a recipe generator. Given a free-form list of ingredients (and optionally dietary notes) from the user, invent ONE realistic recipe that mostly uses those ingredients (a few common pantry staples like salt, oil, water are fine to add).

Respond with ONLY a single JSON object. No markdown, no code fences, no commentary before or after. The JSON MUST match this exact shape:

{
  "title": string,
  "description": string (max ~2 sentences),
  "baseServings": integer (how many servings the amounts below feed),
  "totalTimeMinutes": integer,
  "ingredients": [
    { "name": string, "amount": number, "unit": string (e.g. "g", "cup", "tsp", "" for whole items), "swaps": [string, string] }
  ],
  "steps": [
    { "text": string }
  ],
  "notes": string (optional tip, can be "")
}

Rules:
- "amount" must be a plain number (no fractions like "1/2", use 0.5) because the app scales it by servings.
- Give 2-3 sensible ingredient substitutions in "swaps" for ingredients where a swap is common; empty array if none.
- Steps should be clear, actionable, imperative sentences, one action per step.
- Do not wrap the JSON in backticks. Do not add trailing commas. Output valid JSON only.`;

function extractJson(raw) {
  if (!raw) return null;
  // Strip common code-fence wrapping some models add despite instructions.
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const text = fenced ? fenced[1] : raw;
  // Grab the first {...} block in case there's stray prose around it.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  const slice = text.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

async function callModel(messages, signal) {
  console.log("callModel: about to fetch, time =", new Date().toISOString());
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      // Most OpenAI-compatible providers (OpenAI, Groq) support this and it
      // meaningfully cuts down on malformed JSON. If a provider ignores it,
      // our manual extraction/validation below is the real safety net.
      response_format: { type: "json_object" },
    }),
  });
  console.log("callModel: fetch resolved, time =", new Date().toISOString());
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`Model API error ${res.status}: ${body.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

app.post("/api/generate-recipe", async (req, res) => {
  const { ingredients } = req.body || {};

  if (!ingredients || typeof ingredients !== "string" || !ingredients.trim()) {
    return res.status(400).json({ error: "EMPTY_INPUT", message: "Tell me what's in your fridge first." });
  }
  if (!API_KEY || API_KEY === "your-api-key-here") {
    return res.status(500).json({ error: "MISSING_API_KEY", message: "Server is missing an API key. See backend/.env.example." });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  //req.on("close", () => controller.abort());

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Ingredients I have: ${ingredients}` },
  ];

  const MAX_ATTEMPTS = 3;
  let lastError = "Unknown error";

  try {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      let raw;
      try {
        raw = await callModel(messages, controller.signal);
      } catch (err) {
        if (err.name === "AbortError") {
          return res.status(504).json({ error: "TIMEOUT", message: "The model took too long to respond. Please try again." });
        }
        lastError = err.message;
        console.error(`[callModel attempt ${attempt}] failed:`, err.message);
        // Network/API error: retry once more unless we're out of attempts.
        if (attempt === MAX_ATTEMPTS) {
          return res.status(502).json({ error: "MODEL_UNAVAILABLE", message: "Couldn't reach the model. Please try again." });
        }
        continue;
      }

      const candidate = extractJson(raw);
      if (!candidate) {
        lastError = "Response was not valid JSON.";
        messages.push({ role: "assistant", content: raw });
        messages.push({
          role: "user",
          content: "That was not valid JSON. Reply again with ONLY the JSON object, no other text.",
        });
        continue;
      }

      const parsed = safeParseRecipe(candidate);
      if (!parsed.success) {
        lastError = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
        messages.push({ role: "assistant", content: raw });
        messages.push({
          role: "user",
          content: `That JSON didn't match the required shape (${lastError}). Reply again with ONLY corrected JSON matching the exact shape described.`,
        });
        continue;
      }

      // Success. Attach a light-weight id to each ingredient/step so the
      // frontend has stable React keys without trusting the model for them.
      const recipe = {
        ...parsed.data,
        ingredients: parsed.data.ingredients.map((ing, i) => ({ id: `ing-${i}`, ...ing })),
        steps: parsed.data.steps.map((s, i) => ({ id: `step-${i}`, ...s })),
      };

      clearTimeout(timeout);
      return res.json({ recipe });
    }

    clearTimeout(timeout);
    return res.status(422).json({
      error: "INVALID_MODEL_OUTPUT",
      message: `The model couldn't produce a usable recipe after ${MAX_ATTEMPTS} attempts (${lastError}).`,
    });
  } catch (err) {
    clearTimeout(timeout);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Something went wrong on the server." });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Fridge-to-Recipe backend listening on http://localhost:${PORT}`);
});
