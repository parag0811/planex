import { z } from "zod";

// AI
// ↓
// Security Guard (Zod)
// ↓
// DB

const FeaturePrioritySchema = z.union([
  z.enum(["must_have", "nice_to_have"]),
  z.string().transform((s) => (s.toLowerCase().includes("must") ? "must_have" as const : "nice_to_have" as const)),
]);

const IdeaFeatureSchema = z.object({
  name: z.string(),
  description: z.string(),
  priority: FeaturePrioritySchema,
});

const SuggestedTechStackSchema = z.object({
  frontend: z.array(z.string()).default([]),
  backend: z.array(z.string()).default([]),
  database: z.array(z.string()).default([]),
  infrastructure: z.array(z.string()).optional().default([]),
  ai: z.array(z.string()).optional().default([]),
  frameworks: z.array(z.string()).optional().default([]),
});

const EstimatedComplexitySchema = z.union([
  z.enum(["low", "medium", "high"]),
  z.string().transform((s) => {
    const lower = s.toLowerCase();
    if (lower.includes("high")) return "high" as const;
    if (lower.includes("low")) return "low" as const;
    return "medium" as const;
  }),
]);

const IdeaSectionContentSchema = z.object({
  raw_idea: z.string(),
  overview: z.string(),
  key_features: z.array(IdeaFeatureSchema),
  suggested_tech_stack: SuggestedTechStackSchema,
  requirements: z.array(z.string()).default([]),
  estimated_complexity: EstimatedComplexitySchema,
  team_size: z.union([z.string(), z.number().transform((n) => String(n))]).default("1-3 developers"),
});


const IdeaPromptOptionsSchema = z.object({
  isRegenerating: z.boolean().optional(),
  regenerationSeed: z.string().optional(),
  instruction: z.string().optional(),
});


export {
  IdeaFeatureSchema,
  SuggestedTechStackSchema,
  IdeaSectionContentSchema,
  IdeaPromptOptionsSchema,
};
