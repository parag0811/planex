export const parseJson = (text: string) => {
  try {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}") + 1;

    return JSON.parse(text.slice(jsonStart, jsonEnd));
  } catch (error) {
    throw new Error("AI returned invalid JSON.");
  }
};
