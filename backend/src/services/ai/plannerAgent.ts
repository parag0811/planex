import { callLLM } from "./llmClient";
import { parseJson } from "./outputParser";

export const generateSection = async (prompt : string) => {
    const response = await callLLM(prompt);

    const text = response.candidates[0].content.parts[0].text;

    return parseJson(text)
}