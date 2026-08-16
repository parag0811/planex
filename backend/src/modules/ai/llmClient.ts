import Groq from "groq-sdk";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not defined in environment variables");
  }
  return new Groq({ apiKey });
};

export const callLLM = async (prompt: string, maxRetries = 2) => {
  const groq = getGroqClient();
  const primaryModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  const fallbackModels = [
    primaryModel,
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "deepseek-r1-distill-llama-70b",
  ];

  const modelsToTry = Array.from(new Set(fallbackModels));

  for (const model of modelsToTry) {
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        console.log(`📝 Calling Groq API with model ${model} (Prompt length: ${prompt.length} chars, Attempt ${attempt + 1})`);

        const isDeepSeek = model.toLowerCase().includes("deepseek");

        const chatCompletion = await groq.chat.completions.create(
          {
            messages: [{ role: "user", content: prompt }],
            model: model,
            temperature: 0.2,
            max_tokens: 8192,
            ...(isDeepSeek ? {} : { response_format: { type: "json_object" } }),
          },
          { timeout: 60000 },
        );

        let text = chatCompletion.choices[0]?.message?.content?.trim();

        if (!text) {
          console.error(`❌ [EMPTY_RESPONSE] Groq returned no content for model ${model}.`);
          throw new Error(`[EMPTY_RESPONSE] Groq returned empty content.`);
        }

        // Clean reasoning <think>...</think> tags if using DeepSeek R1 models
        text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

        console.log(`✅ Groq returned ${text.length} chars using model ${model}`);
        return text;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);

        // Handle rate limits (429)
        if (errorMsg.includes("429 Too Many Requests") || errorMsg.includes("429")) {
          if (attempt < maxRetries) {
            let waitTimeMs = 10000;
            const waitTimeMatch = errorMsg.match(/Please retry in ([\d\.]+)s/);
            if (waitTimeMatch && waitTimeMatch[1]) {
              waitTimeMs = parseFloat(waitTimeMatch[1]) * 1000 + 1000;
            } else {
              waitTimeMs = Math.pow(2, attempt) * 5000;
            }

            console.warn(`⏳ Groq rate limit hit (429) on ${model}. Retrying in ${Math.round(waitTimeMs / 1000)}s... (Attempt ${attempt + 1})`);
            await delay(waitTimeMs);
            attempt++;
            continue;
          }
        }

        console.error(`❌ Groq Error with model ${model}: ${errorMsg}`);
        // Break out of retry loop for this model and try the next fallback model
        break;
      }
    }
  }

  throw new Error("All Groq AI models failed or rate limited. Please try again in a few moments.");
};

