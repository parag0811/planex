import { z } from "zod";

/**
 * Mirrors backend/src/schemas/idea.schema.ts exactly. Keep the two in sync:
 * the backend parses AI output with this shape and the editor must not invent
 * fields or enum values the backend cannot store.
 */

export const STACK_KEYS = [
  "frontend",
  "backend",
  "database",
  "infrastructure",
  "ai",
  "frameworks",
] as const;

export type StackCategory = (typeof STACK_KEYS)[number];

const FeaturePrioritySchema = z.union([
  z.enum(["must_have", "nice_to_have"]),
  z
    .string()
    .transform((value) =>
      value.toLowerCase().includes("must")
        ? ("must_have" as const)
        : ("nice_to_have" as const),
    ),
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
  z.string().transform((value) => {
    const lower = value.toLowerCase();
    if (lower.includes("high")) return "high" as const;
    if (lower.includes("low")) return "low" as const;
    return "medium" as const;
  }),
]);

export const IdeaSectionContentSchema = z.object({
  raw_idea: z.string(),
  overview: z.string(),
  key_features: z.array(IdeaFeatureSchema),
  suggested_tech_stack: SuggestedTechStackSchema,
  requirements: z.array(z.string()).default([]),
  estimated_complexity: EstimatedComplexitySchema,
  team_size: z
    .union([z.string(), z.number().transform((value) => String(value))])
    .default("1-3 developers"),
});

export type IdeaSectionContent = z.infer<typeof IdeaSectionContentSchema>;
export type FeaturePriority = z.infer<typeof FeaturePrioritySchema>;
export type IdeaFeature = z.infer<typeof IdeaFeatureSchema>;

/**
 * Structural validation above matches the backend. The editor adds the
 * completeness rules the product needs before a section can be approved:
 * an empty string is schema-valid but not a usable requirement.
 */
export const IdeaEditorSchema = IdeaSectionContentSchema.superRefine(
  (value, ctx) => {
    const requireText = (path: (string | number)[], text: string, message: string) => {
      if (!text.trim()) {
        ctx.addIssue({ code: "custom", path, message });
      }
    };

    if (!value.overview.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["overview"],
        message: "Add a short product overview.",
      });
    }

    if (value.key_features.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["key_features"],
        message: "Add at least one functional requirement.",
      });
    }

    value.key_features.forEach((feature, index) => {
      requireText(
        ["key_features", index, "name"],
        feature.name,
        "Add a title for this requirement.",
      );
      requireText(
        ["key_features", index, "description"],
        feature.description,
        "Describe what this requirement must do.",
      );
    });

    if (value.requirements.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["requirements"],
        message: "Add at least one constraint.",
      });
    }

    value.requirements.forEach((requirement, index) => {
      requireText(
        ["requirements", index],
        requirement,
        "This constraint cannot be empty.",
      );
    });

    STACK_KEYS.forEach((key) => {
      value.suggested_tech_stack[key].forEach((item, index) => {
        requireText(
          ["suggested_tech_stack", key, index],
          item,
          "Remove this empty stack item or add a value.",
        );
      });
    });

    requireText(["team_size"], value.team_size, "Add an expected team size.");
  },
);

export type IdeaFieldErrors = Record<string, string>;

/** Flattens Zod issues into `path -> first message` keys for inline errors. */
export const getIdeaFieldErrors = (error: z.ZodError): IdeaFieldErrors => {
  const errors: IdeaFieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !errors[key]) {
      errors[key] = issue.message;
    }
  }

  return errors;
};
