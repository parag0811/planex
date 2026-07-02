import Groq from "groq-sdk";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const isDev = process.env.NODE_ENV !== "production";

let groq: Groq;
if (GROQ_API_KEY) {
  groq = new Groq({ apiKey: GROQ_API_KEY });
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const callLLM = async (prompt: string, maxRetries = 3) => {
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      if (!GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not defined in environment variables");
      }

      if (isDev) {
        console.log(`📝 Calling Groq API with model ${GROQ_MODEL} and prompt length: ${prompt.length} chars (Attempt ${attempt + 1})`);
      }

      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: GROQ_MODEL,
        temperature: 0.2,
      });

      const text = chatCompletion.choices[0]?.message?.content?.trim();

      if (!text) {
        console.error(`❌ [EMPTY_RESPONSE] Groq returned no content.`);
        const error = new Error(`[EMPTY_RESPONSE] Groq returned empty content.`);
        throw error;
      }

      if (isDev) {
        console.log(`✅ Groq returned ${text.length} chars`);
      }

      return text;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // Handle rate limits (429)
      if (errorMsg.includes("429 Too Many Requests") || errorMsg.includes("429")) {
        if (attempt < maxRetries) {
          let waitTimeMs = 20000; // default 20s
          const waitTimeMatch = errorMsg.match(/Please retry in ([\d\.]+)s/);
          if (waitTimeMatch && waitTimeMatch[1]) {
            waitTimeMs = (parseFloat(waitTimeMatch[1]) * 1000) + 1000; // Add 1 second buffer
          } else {
            waitTimeMs = Math.pow(2, attempt) * 10000; // 10s, 20s, 40s fallback
          }
          
          console.warn(`⏳ Groq rate limit hit (429). Retrying in ${Math.round(waitTimeMs / 1000)}s... (Attempt ${attempt + 1} of ${maxRetries})`);
          await delay(waitTimeMs);
          attempt++;
          continue; // retry
        }
      }

      console.error(`\n❌ GROQ ERROR CAUGHT:`);
      console.error(`Message: ${errorMsg}`);
      if (isDev) {
        console.error(`Full Stack:`, error instanceof Error ? error.stack : "No stack");
      }
      
      // Re-throw with full details in dev, generic in prod
      if (isDev) {
        throw error;
      } else {
        throw new Error("AI request failed");
      }
    }
  }
};
