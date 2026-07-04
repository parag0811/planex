const validSections = ["idea", "database", "api", "folder"];

export interface AiUpdateResponse {
  type: "update";
  section: string;
  explanation: string;
  content: any;
}

export interface AiSuggestionResponse {
  type: "suggestion";
  message: string;
}

export type AiResponse = AiUpdateResponse | AiSuggestionResponse;

export const parseAiResponse = (raw: any): AiResponse => {
  try {
    const json = typeof raw === "string" ? JSON.parse(raw) : raw;

    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return {
        type: "suggestion",
        message: "Invalid response format. Please try again.",
      };
    }

    if (!json.type) {
      return {
        type: "suggestion",
        message: "Invalid response format. Please try again.",
      };
    }

    if (json.type === "update") {
      if (!validSections.includes(json.section)) {
        return {
          type: "suggestion",
          message: `Invalid section: ${json.section}. Please specify: idea, database, api, or folder.`,
        };
      }

      if (!json.content) {
        return {
          type: "suggestion",
          message: "Update response missing content. Please try again.",
        };
      }

      if (!json.explanation) {
        return {
          type: "suggestion",
          message: "Update response missing explanation. Please try again.",
        };
      }

      return json as AiUpdateResponse;
    }

    if (json.type === "suggestion") {
      if (!json.message) {
        return {
          type: "suggestion",
          message: "AI response parsing failed. Please try again.",
        };
      }
      return json as AiSuggestionResponse;
    }

    return {
      type: "suggestion",
      message: "Unknown response type. Please try again.",
    };
  } catch (error) {
    console.error("JSON parse error:", error);
    return {
      type: "suggestion",
      message: "Failed to parse AI response. Please try again.",
    };
  }
};
