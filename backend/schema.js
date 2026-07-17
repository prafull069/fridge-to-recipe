import { z } from "zod";

// This is the contract the frontend is built against. If the model's JSON
// doesn't satisfy this shape, we treat it as a failure and retry/report an
// error rather than rendering something the UI can't handle.
export const RecipeSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(300),
  baseServings: z.number().int().min(1).max(50),
  totalTimeMinutes: z.number().int().min(1).max(1440),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        amount: z.number().min(0),
        unit: z.string().max(20).default(""),
        swaps: z.array(z.string().max(80)).max(4).default([]),
      })
    )
    .min(1)
    .max(30),
  steps: z
    .array(
      z.object({
        text: z.string().min(1).max(500),
      })
    )
    .min(1)
    .max(25),
  notes: z.string().max(400).optional().default(""),
});

export function safeParseRecipe(candidate) {
  return RecipeSchema.safeParse(candidate);
}
