import { z } from "zod";
import {
  IdeaFeatureSchema,
  IdeaPromptOptionsSchema,
  IdeaSectionContentSchema,
  SuggestedTechStackSchema,
} from "../../../../schemas/idea.schema";

export type IdeaFeature = z.infer<typeof IdeaFeatureSchema>;


export type SuggestedTechStack = z.infer<typeof SuggestedTechStackSchema>;


export type IdeaSectionContent = z.infer<typeof IdeaSectionContentSchema>;


export type IdeaPromptOptions = z.infer<typeof IdeaPromptOptionsSchema>;


export const buildIdeaPrompt = (
  rawIdea: string,
  options: IdeaPromptOptions = {},
): string => `
You are a senior software architect working on Planex, an AI system that helps developers turn ideas into complete project architectures.

A user described their project idea:

"${rawIdea}"

${
  options.isRegenerating
    ? `
IMPORTANT: This is a regeneration request. Generate a DIFFERENT and NOVEL interpretation of the idea.
Focus on:
- Alternative features and capabilities not explored before
- Different architectural approaches
- Novel use cases and target users
- Unique technical stack choices
- Fresh prioritization of features
`
    : ""
}

${
  options.instruction
    ? `
USER INSTRUCTION:
${options.instruction}
`
    : ""
}

${
  options.isRegenerating
    ? `
REGENERATION_ID: ${options.regenerationSeed || "none"}
`
    : ""
}

Your task is to expand this idea into structured product requirements.

Return ONLY valid JSON.
Do NOT include explanations.
Do NOT include markdown code fences.
The response must be directly parseable with JSON.parse().

Use EXACTLY the following JSON schema:

{
  "raw_idea": "${rawIdea.replace(/"/g, '\\"')}",
  "overview": "string",
  "key_features": [
    {
      "name": "string",
      "description": "string",
      "priority": "must_have" | "nice_to_have"
    }
  ],
  "requirements": ["string"],
  "suggested_tech_stack": {
    "frontend": ["string"],
    "backend": ["string"],
    "database": ["string"],
    "infrastructure": ["string"],
    "ai": ["string"],
    "frameworks" : ["string"]
  },
  "estimated_complexity": "low" | "medium" | "high",
  "team_size": "string"
}

Rules:

overview
- 2–3 sentences describing the product and its main users.

key_features
- 4–7 features total
- maximum 3 features with priority "must_have"
- each description must be one sentence.

requirements
- 4–8 non-functional or system requirements implied by the idea
- examples: "User authentication", "Role-based access control", "File uploads", "Real-time updates", "Email notifications", "Mobile responsive"

suggested_tech_stack
- choose modern and widely used tools
- include 2–4 items per category when applicable
- avoid unnecessary technologies

estimated_complexity
- choose only: low, medium, high

team_size
- suggest a realistic development team size like "1-2 developers", "2-4 developers", "5-8 developers"

Important:
Return ONLY valid JSON.
`;
