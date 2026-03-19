const safeStringify = (obj: any) => JSON.stringify(obj).slice(0, 2000);

export const buildChatPrompt = ({ message, sections, context }: any): string =>
  `
You are a senior AI software architect.

========================
PROJECT CONTEXT


IDEA:
${sections.idea?.overview || "N/A"}

DATABASE:
${safeStringify(sections.database || {})}

API:
${safeStringify(sections.api)}

FOLDER:
${safeStringify(sections.folder || {})}

========================
USER REQUEST:
"${message}"

TARGET SECTION:
${context?.section || "none"}

========================
DECISION RULES:

1. If the user asks to:
   - add / update / modify / remove
   → return type = "update"

2. If the user asks for:
   - advice / explanation / suggestions
   → return type = "suggestion"

3. If unsure → return "suggestion"

========================

Return ONLY valid JSON.

Schema:

IF updating:
{
  "type": "update",
  "section": "idea | database | api | folder",
  "content": {}
}

IF suggestion:
{
  "type": "suggestion",
  "message": "string"
}

STRICT RULES:

- If type = "update":
  - MUST include "section"
  - MUST include complete updated structure (not partial)
  - MUST NOT include explanation

  - If type = "suggestion":
  - DO NOT include "content"

- NEVER return text outside JSON
- Modify only ONE section
- Be production-grade
`;
