import { GoogleGenerativeAI } from "@google/generative-ai";

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const model = genAi.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export const callLLM = async (prompt: string) => {
  const result = await model.generateContent(prompt);

  const response = result.response;

  return response.text();
};
