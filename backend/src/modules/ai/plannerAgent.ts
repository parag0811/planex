import { callLLM } from "../../modules/ai/llmClient";
import { parseJson } from "../../modules/ai/outputParser";

export const generateSection = async (prompt : string) => {
    const text = await callLLM(prompt);

    return parseJson(text)
}

// promptBuilder
// +
// llmClient
// +
// outputParser