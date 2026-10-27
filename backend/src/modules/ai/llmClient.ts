import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

interface LlmRequestOptions {
  signal?: AbortSignal;
}

export interface LlmCallRecord {
  provider: "gemini" | "groq";
  model: string;
  durationMs: number;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
}

/**
 * Append-only, in-process log of real provider calls.
 * Used by the benchmark harness (`npm run bench`) and safe to read at any time.
 */
export const llmCallLog: LlmCallRecord[] = [];

/** Primary-provider failures that were recovered by falling back to the other provider. */
export interface LlmFailureRecord {
  provider: "gemini" | "groq";
  message: string;
}

export const llmFailureLog: LlmFailureRecord[] = [];

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

const callGemini = async (
  prompt: string,
  options: LlmRequestOptions = {},
  attempt = 1,
): Promise<string> => {
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
    const startedAt = performance.now();
    const result = await model.generateContent(
      prompt,
      options.signal ? { signal: options.signal } : undefined,
    );
    const response = result.response;
    const text = response.text()?.trim();

    if (!text) {
      console.error(`❌ [EMPTY_RESPONSE] Gemini returned empty content for model ${modelName}.`);
      throw new Error(`[EMPTY_RESPONSE] Gemini returned empty content.`);
    }

    const usage = response.usageMetadata;

    llmCallLog.push({
      provider: "gemini",
      model: modelName,
      durationMs: Math.round(performance.now() - startedAt),
      promptTokens: usage?.promptTokenCount ?? null,
      completionTokens: usage?.candidatesTokenCount ?? null,
      totalTokens: usage?.totalTokenCount ?? null,
    });

    console.log(`✅ Gemini returned ${text.length} chars using model ${modelName}`);
    return text;
  } catch (error: any) {
    const isTransient = error?.status === 503 || String(error).includes("503") || String(error).includes("high demand");
    if (isTransient && attempt < 2 && !options.signal?.aborted) {
      console.warn(`⚠️ Gemini 503 spike encountered. Retrying in 1.5s with gemini-3.5-flash...`);
      await new Promise((r) => setTimeout(r, 1500));
      process.env.GEMINI_MODEL = "gemini-3.5-flash";
      return callGemini(prompt, options, attempt + 1);
    }
    throw error;
  }
};

const callGroq = async (
  prompt: string,
  options: LlmRequestOptions = {},
): Promise<string> => {
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

  const startedAt = performance.now();
  const chatCompletion = await groq.chat.completions.create(
    {
      messages: [{ role: "user", content: prompt }],
      model: model,
      temperature: 0.2,
      max_tokens: 4000,
      ...(isDeepSeek ? {} : { response_format: { type: "json_object" } }),
    },
    options.signal ? { timeout: 60000, signal: options.signal } : { timeout: 60000 },
  );

  let text = chatCompletion.choices[0]?.message?.content?.trim();

  if (!text) {
    console.error(`❌ [EMPTY_RESPONSE] Groq returned no content for model ${model}.`);
    throw new Error(`[EMPTY_RESPONSE] Groq returned empty content.`);
  }

  // Clean reasoning <think>...</think> tags if using DeepSeek/reasoning models
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  llmCallLog.push({
    provider: "groq",
    model,
    durationMs: Math.round(performance.now() - startedAt),
    promptTokens: chatCompletion.usage?.prompt_tokens ?? null,
    completionTokens: chatCompletion.usage?.completion_tokens ?? null,
    totalTokens: chatCompletion.usage?.total_tokens ?? null,
  });

  console.log(`✅ Groq returned ${text.length} chars using model ${model}`);
  return text;
};

export const callLLM = async (
  prompt: string,
  options: LlmRequestOptions = {},
): Promise<string> => {
  const provider = getProvider();

  try {
    if (provider === "gemini") {
      return await callGemini(prompt, options);
    }
    return await callGroq(prompt, options);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error calling AI provider (${provider}): ${errorMsg}`);

    // A cancelled/timed-out job must not start a second provider call.
    if (options.signal?.aborted) {
      throw error;
    }

    // Graceful fallback if both keys exist
    if (provider === "gemini" && process.env.GROQ_API_KEY) {
      llmFailureLog.push({ provider, message: errorMsg });
      console.warn("⚠️ Falling back to Groq after Gemini failure...");
      return await callGroq(prompt, options);
    } else if (provider === "groq" && process.env.GEMINI_API_KEY) {
      llmFailureLog.push({ provider, message: errorMsg });
      console.warn("⚠️ Falling back to Gemini after Groq failure...");
      return await callGemini(prompt, options);
    }

    throw error;
  }
};
