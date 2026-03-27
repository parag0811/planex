const validSections = ["idea", "database", "api", "folder"];

export const parseAiResponse = (raw: string) => {
  try {
    const json = JSON.parse(raw);

    // if (!json.type) {
    //   const error = new Error("Invalid AI response.") as ApiError;
    //   error.status = 422;
    //   throw error;
    // }

    if (json.type === "update") {
      if (!validSections.includes(json.section)) {
        const error = new Error("Invalid update structure") as AppError;
        error.status = 422;
        throw error;
      }
    }

    return json;
  } catch (error) {
    return {
      type: "suggestion",
      message: "AI response parsing failed. Please try again.",
    };
  }
};
