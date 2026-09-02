import Groq from "groq-sdk";

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not defined in environment variables");
  }
  return new Groq({ apiKey });
};

export const callLLM = async (prompt: string) => {
  const groq = getGroqClient();
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  console.log(
    `📝 Calling Groq API with model ${model} (Prompt length: ${prompt.length} chars)`,
  );

  const isDeepSeek = model.toLowerCase().includes("deepseek");

  try {
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
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Groq Error with model ${model}: ${errorMsg}`);
    throw error;
  }
};

