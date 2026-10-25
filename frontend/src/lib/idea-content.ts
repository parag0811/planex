import {
  STACK_KEYS,
  type FeaturePriority,
  type IdeaSectionContent,
} from "./schemas/idea.schema";

export { STACK_KEYS };
export type {
  FeaturePriority,
  IdeaFeature as KeyFeature,
  IdeaSectionContent,
  StackCategory,
} from "./schemas/idea.schema";

export const EMPTY_IDEA: IdeaSectionContent = {
  raw_idea: "",
  overview: "",
  key_features: [],
  requirements: [],
  suggested_tech_stack: {
    frontend: [],
    backend: [],
    database: [],
    infrastructure: [],
    ai: [],
    frameworks: [],
  },
  estimated_complexity: "medium",
  team_size: "",
};

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

/** Mirrors the backend transform: anything containing "must" is a must-have. */
const normalizePriority = (value: unknown): FeaturePriority =>
  typeof value === "string" && value.toLowerCase().includes("must")
    ? "must_have"
    : "nice_to_have";

/** Mirrors the backend transform: "high"/"low" in the text wins, else medium. */
const normalizeComplexity = (
  value: unknown,
): IdeaSectionContent["estimated_complexity"] => {
  if (typeof value !== "string") return "medium";
  const lower = value.toLowerCase();
  if (lower.includes("high")) return "high";
  if (lower.includes("low")) return "low";
  return "medium";
};

/** Mirrors the backend default and numeric coercion. */
const normalizeTeamSize = (value: unknown): string => {
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  return "1-3 developers";
};

export const normalizeIdea = (payload: unknown): IdeaSectionContent => {
  const source =
    payload &&
    typeof payload === "object" &&
    "content" in (payload as Record<string, unknown>) &&
    (payload as Record<string, unknown>).content &&
    typeof (payload as Record<string, unknown>).content === "object"
      ? ((payload as Record<string, unknown>).content as Record<string, unknown>)
      : ((payload ?? {}) as Record<string, unknown>);

  const raw = source as Partial<IdeaSectionContent>;
  const stackRaw = (raw.suggested_tech_stack ?? {}) as Partial<
    IdeaSectionContent["suggested_tech_stack"]
  >;

  const features = Array.isArray(raw.key_features)
    ? raw.key_features
        .map((feature) => ({
          name: asString(feature?.name).trim(),
          description: asString(feature?.description).trim(),
          priority: normalizePriority(feature?.priority),
        }))
        .filter((feature) => feature.name || feature.description)
    : [];

  return {
    raw_idea: asString(raw.raw_idea),
    overview: asString(raw.overview),
    key_features: features,
    requirements: asStringArray(raw.requirements),
    suggested_tech_stack: {
      frontend: asStringArray(stackRaw.frontend),
      backend: asStringArray(stackRaw.backend),
      database: asStringArray(stackRaw.database),
      infrastructure: asStringArray(stackRaw.infrastructure),
      ai: asStringArray(stackRaw.ai),
      frameworks: asStringArray(stackRaw.frameworks),
    },
    estimated_complexity: normalizeComplexity(raw.estimated_complexity),
    team_size: normalizeTeamSize(raw.team_size),
  };
};
