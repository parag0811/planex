export const buildRegeneratePrompt = ({
  section,
  content,
  instruction,
}: {
  section: string;
  content: any;
  instruction?: string;
}) => `
You are a senior software architect.

========================
SECTION:
${section.toUpperCase()}

CURRENT CONTENT:
${JSON.stringify(content).slice(0, 3000)}

========================
INSTRUCTION:
"${instruction || "Improve quality, scalability, and production readiness"}"

========================

Your task:

- Improve the EXISTING ${section} section
- Keep structure consistent
- Do NOT remove important parts
- Enhance production readiness
- Add missing best practices if needed

========================

Return ONLY valid JSON.

Rules:

- Output MUST match the same structure as the input
- Do NOT add explanation
- Do NOT change section type
- Return FULL updated content (not partial)

`;