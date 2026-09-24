import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

const getProvider = (): "gemini" | "groq" => {
  if (process.env.AI_PROVIDER) {
    return process.env.AI_PROVIDER.toLowerCase() === "groq" ? "groq" : "gemini";
  }
  // Auto-detect: Prefer Gemini if GEMINI_API_KEY is present
  if (process.env.GEMINI_API_KEY) {
    return "gemini";
  }
  return "groq";
};

const callGemini = async (prompt: string, attempt = 1): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables");
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  console.log(
    `📝 Calling Gemini API with model ${modelName} (Prompt length: ${prompt.length} chars, attempt: ${attempt})`,
  );

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text()?.trim();

    if (!text) {
      console.error(`❌ [EMPTY_RESPONSE] Gemini returned empty content for model ${modelName}.`);
      throw new Error(`[EMPTY_RESPONSE] Gemini returned empty content.`);
    }

    console.log(`✅ Gemini returned ${text.length} chars using model ${modelName}`);
    return text;
  } catch (error: any) {
    const isTransient = error?.status === 503 || String(error).includes("503") || String(error).includes("high demand");
    if (isTransient && attempt < 2) {
      console.warn(`⚠️ Gemini 503 spike encountered. Retrying in 1.5s with gemini-3.5-flash...`);
      await new Promise((r) => setTimeout(r, 1500));
      process.env.GEMINI_MODEL = "gemini-3.5-flash";
      return callGemini(prompt, attempt + 1);
    }
    throw error;
  }
};

const callGroq = async (prompt: string): Promise<string> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not defined in environment variables");
  }

  const groq = new Groq({ apiKey });
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

  console.log(
    `📝 Calling Groq API with model ${model} (Prompt length: ${prompt.length} chars)`,
  );

  const isDeepSeek = model.toLowerCase().includes("deepseek");

  const chatCompletion = await groq.chat.completions.create(
    {
      messages: [{ role: "user", content: prompt }],
      model: model,
      temperature: 0.2,
      max_tokens: 4000,
      ...(isDeepSeek ? {} : { response_format: { type: "json_object" } }),
    },
    { timeout: 60000 },
  );

  let text = chatCompletion.choices[0]?.message?.content?.trim();

  if (!text) {
    console.error(`❌ [EMPTY_RESPONSE] Groq returned no content for model ${model}.`);
    throw new Error(`[EMPTY_RESPONSE] Groq returned empty content.`);
  }

  // Clean reasoning <think>...</think> tags if using DeepSeek/reasoning models
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  console.log(`✅ Groq returned ${text.length} chars using model ${model}`);
  return text;
};

export const callLLM = async (prompt: string): Promise<string> => {
  const provider = getProvider();

  try {
    if (provider === "gemini") {
      return await callGemini(prompt);
    }
    return await callGroq(prompt);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error calling AI provider (${provider}): ${errorMsg}`);

    // Graceful fallback if both keys exist
    if (provider === "gemini" && process.env.GROQ_API_KEY) {
      console.warn("⚠️ Falling back to Groq after Gemini failure...");
      return await callGroq(prompt);
    } else if (provider === "groq" && process.env.GEMINI_API_KEY) {
      console.warn("⚠️ Falling back to Gemini after Groq failure...");
      return await callGemini(prompt);
    }

    throw error;
  }
};
