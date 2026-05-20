import { z } from "zod";

const FeaturePriority = ["must_have", "nice_to_have"] as const; // It becomes read only

const IdeaFeatureSchema = z.object({
  name: z.string(),
  description: z.string(),
  priority: z.enum(FeaturePriority),
});


const SuggestedTechStackSchema = z.object({
  frontend: z.array(z.string()),
  backend: z.array(z.string()),
  database: z.array(z.string()),
  infrastructure: z.array(z.string()).optional(),
  ai: z.array(z.string()).optional(),
  frameworks: z.array(z.string()).optional(),
});


const estimated_complexity = ["low", "medium", "high"] as const;

const IdeaSectionContentSchema = z.object({
  raw_idea: z.string(),
  overview: z.string(),
  key_features: z.array(IdeaFeatureSchema),
  suggested_tech_stack: SuggestedTechStackSchema,
  requirements: z.array(z.string()),
  estimated_complexity: z.enum(estimated_complexity),
  team_size: z.string(),
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
