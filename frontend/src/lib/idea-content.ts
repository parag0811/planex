export type FeaturePriority = "must_have" | "nice_to_have";

export type StackCategory =
  | "frontend"
  | "backend"
  | "database"
  | "infrastructure"
  | "ai"
  | "frameworks";

export interface KeyFeature {
  name: string;
  description: string;
  priority: FeaturePriority;
}

export interface IdeaSectionContent {
  raw_idea: string;
  overview: string;
  key_features: KeyFeature[];
  requirements: string[];
  suggested_tech_stack: {
    frontend: string[];
    backend: string[];
    database: string[];
    infrastructure?: string[];
    ai?: string[];
    frameworks?: string[];
  };
  estimated_complexity: "low" | "medium" | "high";
  team_size: string;
}

export const STACK_KEYS: StackCategory[] = [
  "frontend",
  "backend",
  "database",
  "infrastructure",
  "ai",
  "frameworks",
];

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

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

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
          name:
            typeof feature?.name === "string" ? feature.name.trim() : "",
          description:
            typeof feature?.description === "string"
              ? feature.description.trim()
              : "",
          priority: (feature?.priority === "must_have"
            ? "must_have"
            : "nice_to_have") as FeaturePriority,
        }))
        .filter((feature) => feature.name || feature.description)
    : [];

  const complexity =
    raw.estimated_complexity === "low" ||
    raw.estimated_complexity === "high"
      ? raw.estimated_complexity
      : "medium";

  return {
    raw_idea: typeof raw.raw_idea === "string" ? raw.raw_idea : "",
    overview: typeof raw.overview === "string" ? raw.overview : "",
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
    estimated_complexity: complexity,
    team_size: typeof raw.team_size === "string" ? raw.team_size : "",
  };
};
