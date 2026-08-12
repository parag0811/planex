import { jsonrepair } from "jsonrepair";

const extractJsonCandidate = (text: string) => {
  const trimmed = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```\s*$/, "");

  const startIndex = trimmed.search(/[\[{]/);

  if (startIndex === -1) {
    throw new Error("No JSON object found in response");
  }

  let inString = false;
  let escaped = false;
  let depth = 0;
  let endIndex = -1;
  let openChar = "";
  let closeChar = "";

  for (let index = startIndex; index < trimmed.length; index += 1) {
    const char = trimmed[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }

      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (!openChar) {
      if (char === "{" || char === "[") {
        openChar = char;
        closeChar = char === "{" ? "}" : "]";
        depth = 1;
      }

      continue;
    }

    if (char === openChar) {
      depth += 1;
      continue;
    }

    if (char === closeChar) {
      depth -= 1;

      if (depth === 0) {
        endIndex = index + 1;
        break;
      }
    }
  }

  if (endIndex === -1) {
    throw new Error("Incomplete JSON structure in response");
  }

  return trimmed.slice(startIndex, endIndex);
};

const isDev = process.env.NODE_ENV !== "production";

export const parseJson = (text: string) => {
  try {
    if (isDev) {
      console.log(`🔍 parseJson: Attempting to parse LLM response...`);
    }

    const candidate = extractJsonCandidate(text);
    const repaired = jsonrepair(candidate);
    const parsed = JSON.parse(repaired);

    if (isDev) {
      console.log(`✅ parseJson: Successfully parsed JSON`);
    }
    return parsed;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ parseJson Error: ${errorMsg}`);
    throw new Error(`Failed to parse LLM JSON response: ${errorMsg}`);
  }
};
