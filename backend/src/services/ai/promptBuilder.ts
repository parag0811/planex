export const buildIdeaPrompt = (rawIdea: string): string => `
You are a senior software architect working on Planex, an AI project planner.
 
A user described their project idea:
"${rawIdea}"
 
Your job is to expand this into a structured breakdown.
 
Return ONLY valid JSON. No prose, no markdown fences, no explanation.
 
{
  "raw_idea": "${rawIdea.replace(/"/g, '\\"')}",
  "overview": "",
  "key_features": [
    {
      "name": "",
      "description": "",
      "priority": "must_have" | "nice_to_have"
    }
  ],
  "requirements": []
}
 
Rules:
- overview: 2-3 sentences describing what the product does and for whom
- key_features: 4-7 features. At most 3 marked "must_have". Each description is one sentence.
- requirements: list of non-functional requirements the idea implies
  (e.g. "User authentication", "Role-based access control", "Email notifications",
  "Mobile responsive", "Real-time updates", "File uploads", "Third-party integrations")
  List only what this specific idea actually needs. 4-8 items.
`;