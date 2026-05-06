export const parseJson = (text: string) => {
  try {
    console.log(`🔍 parseJson: Attempting to parse LLM response...`);
    console.log(`📝 Response preview: ${text.substring(0, 100)}...`);
    
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}") + 1;

    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error("No JSON object found in response");
    }

    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd));
    console.log(`✅ parseJson: Successfully parsed JSON`);
    return parsed;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ parseJson Error: ${errorMsg}`);
    console.error(`Full response was: ${text.substring(0, 500)}`);
    throw new Error(`Failed to parse LLM JSON response: ${errorMsg}`);
  }
};
