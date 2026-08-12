import { callLLM } from "../../modules/ai/llmClient";
import { parseJson } from "../../modules/ai/outputParser";

const isDev = process.env.NODE_ENV !== "production";

export const generateSection = async (prompt : string) => {
    try {
        if (isDev) {
            console.log(`🔄 generateSection: Starting with prompt length ${prompt.length}`);
        }
        
        const text = await callLLM(prompt);
        if (!text) {
            throw new Error("LLM response is undefined");
        }
        
        if (isDev) {
            console.log(`🔄 generateSection: LLM returned, parsing JSON...`);
        }
        const parsed = parseJson(text);
        
        if (isDev) {
            console.log(`✅ generateSection: Successfully parsed section`);
        }
        return parsed;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`❌ generateSection Error: ${errorMsg}`);
        throw error;
    }
}

// promptBuilder
// +
// llmClient
// +
// outputParser