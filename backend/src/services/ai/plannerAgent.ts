import { callLLM } from "./llmClient";
import { parseJson } from "./outputParser";

export const generateSection = async (prompt : string) => {
    const text = await callLLM(prompt);

    return parseJson(text)
}

// promptBuilder
// +
// llmClient
// +
// outputParser