## Live Demo

- **Live app:** https://fridge-to-recipe-nine.vercel.app
- **Backend API:** https://fridge-to-recipe-xlm5.onrender.com

# Fridge → Recipe

Type in whatever's in your fridge/pantry, get back a real recipe: checkable
steps, servings you can scale up or down (amounts recalculate live), and
tap-to-expand ingredient swaps. Not a chatbot — the model returns structured
JSON, and the app renders that as interactive React components.

## Stack

- **Frontend:** React 18 (hooks, functional components) + Vite, plain CSS.
- **Backend:** a tiny Express server (`backend/`) that holds the API key and
  proxies the LLM call. The key never reaches the browser.
- **Model:** any OpenAI-compatible chat-completions endpoint. Configured by
  default for **Groq's free tier** (`llama-3.3-70b-versatile`), but works
  unchanged with OpenAI, OpenRouter, or a local Ollama server exposing an
  OpenAI-compatible API — just change three env vars.

## Setup

Requires Node 18+.

**1. Backend**

```bash
cd backend
npm install
cp .env.example .env
# edit .env and paste in your API key (get a free one at console.groq.com)
npm start
# -> listening on http://localhost:8787
```

**2. Frontend** (separate terminal)

```bash
cd frontend
npm install
npm start
# -> http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:8787`, so just open
the frontend URL — no CORS setup needed. `npm install && npm start` works in
each folder independently, as required.

To use a different provider, only `backend/.env` changes:

```
BASE_URL=https://api.openai.com/v1
MODEL=gpt-4o-mini
API_KEY=sk-...
```

## How the data flow works

1. User types ingredients, submits.
2. Frontend POSTs to `/api/generate-recipe` with an `AbortController` and an
   incrementing request id (see "handling bad output" below).
3. Backend sends a system prompt that hard-specifies the JSON shape, plus
   `response_format: { type: "json_object" }` (supported by OpenAI and Groq)
   to bias the model toward valid JSON in the first place.
4. Backend parses the response, strips any stray code fences, and validates
   it against a **Zod schema** (`backend/schema.js`) — the actual contract
   the frontend is built against.
5. If validation fails, the backend automatically **retries up to 3 times**,
   feeding the model its own broken output plus the specific validation
   error, and asking it to fix it. This alone fixed the large majority of
   malformed responses in testing with a small/free model.
6. Only a schema-valid recipe is ever sent to the frontend. Everything else
   comes back as a typed error (`{ error: "CODE", message }`), never a raw
   crash or half-a-JSON-blob.

## Handling bad AI output (the part that actually matters)

- **Malformed JSON** — stripped of code fences, brace-matched, `JSON.parse`d
  in a try/catch. Failure triggers a retry with the parse error fed back to
  the model.
- **Wrong shape** (missing fields, wrong types, empty arrays) — caught by the
  Zod schema before it ever reaches React. Retried the same way as malformed
  JSON, with the specific Zod validation message included in the follow-up
  prompt so the model knows exactly what to fix.
- **Still bad after 3 attempts** — the backend gives up and returns
  `422 INVALID_MODEL_OUTPUT` with a plain-English message; the frontend shows
  a real error state with a "try again" button, not a blank screen or a
  console error.
- **Slow model** — a 25s server-side timeout via `AbortController`; the
  frontend shows a loading skeleton the whole time and a specific "took too
  long" message if it trips.
- **Failed/unreachable API** — network errors and non-2xx responses are
  caught and mapped to a `502 MODEL_UNAVAILABLE`, shown with a retry button.
- **Empty input** — validated on both ends; submitting blank text never
  reaches the model.
- **Stale responses** — every submit gets an incrementing request id stored
  in a ref, and a fresh `AbortController` that cancels the previous in-flight
  request. A response is only applied to state if its id still matches the
  latest request; anything superseded is silently dropped. So spamming
  "Get a recipe" with edits in between can never let an older, slower
  response clobber a newer one.
- **No crashes on any of the above** — every failure path resolves to one of
  the four explicit UI states (idle / loading / error / success), never an
  unhandled exception or a rendered `undefined`.

## UI states

`idle` (nothing submitted yet) → `loading` (skeleton + spinner) → `success`
(interactive recipe card) or `error` (explanation + retry, reusing the last
query). All four are real, separately styled components, not one giant
conditional mess in `App.jsx`.

## Interactivity

- **Servings stepper** — recalculates every ingredient amount live (with a
  small fraction-formatter so "0.5 cup" reads as "½ cup"), reset-to-original
  link included.
- **Checkable steps** — click a step to mark it done; progress counter and a
  completion banner when everything's checked.
- **Ingredient swaps** — the model returns up to a few substitutes per
  ingredient where they make sense; tap "swap" to expand.
- **Regenerate** — re-runs the same query through the full retry/validation
  pipeline again.

State resets cleanly between recipes: `RecipeView` is remounted (via a
`key`) on every new successful response, so checked steps and servings from
recipe #1 don't leak into recipe #2.

## Mobile

Single-column fluid layout, `clamp()` type scale, the two-column
ingredients/steps layout collapses to one column under 640px, buttons go
full-width, tap targets sized for touch.

## AI-usage note

I used Claude to scaffold the Express/Zod validation-and-retry loop, help
draft the CSS design tokens, and review the stale-response-guard logic. All
of the JSX component structure, state management, and the retry/schema
design were written and understood by me — I can walk through and modify any
part of it live.

## Known limitations

- No persistence — refreshing the page loses the current recipe and checked
  steps (would add `localStorage` next).
- Swap suggestions are static text, not swappable in the ingredient amounts
  (e.g. picking "goat cheese" doesn't currently replace "feta" in the list).
- No streaming — the recipe appears all at once rather than field-by-field.
  Given the free-tier model's spotty support for streamed structured output,
  I opted for a simpler, more robust request/validate/retry cycle instead.
- Retry logic is server-side and fixed at 3 attempts; not user-configurable.
- No automated tests yet — would add a few unit tests for `schema.js` and
  the stale-response guard in `App.jsx` next.
- Single recipe per request — no "give me 3 options" mode.

## Time spent

~8 hours: backend + schema/retry design (~2.5h), frontend components and
state (~2.5h), styling/mobile (~1.5h), testing failure paths + README (~1.5h).
