import { callLLM } from "../../modules/ai/llmClient";
import { parseJson } from "../../modules/ai/outputParser";

export const generateSection = async (prompt : string) => {
    try {
        console.log(`🔄 generateSection: Starting with prompt length ${prompt.length}`);
        
        const text = await callLLM(prompt);
        
        console.log(`🔄 generateSection: LLM returned, parsing JSON...`);
        const parsed = parseJson(text);
        
        console.log(`✅ generateSection: Successfully parsed section`);
        return parsed;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`❌ generateSection Error: ${errorMsg}`);
        console.error(`Stack:`, error instanceof Error ? error.stack : "No stack trace");
        throw error;
    }
}

// promptBuilder
// +
// llmClient
// +
// outputParser