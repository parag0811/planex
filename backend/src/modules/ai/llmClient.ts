const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const isDev = process.env.NODE_ENV !== "production";

if (!GROQ_API_KEY) {
  console.error("❌ CRITICAL: GROQ_API_KEY is not set in environment variables!");
}

export const callLLM = async (prompt: string) => {
  try {
    if (isDev) {
      console.log(`📝 Calling Groq API with model ${GROQ_MODEL} and prompt length: ${prompt.length} chars`);
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_completion_tokens: 8192,
        top_p: 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Groq request failed with status ${response.status}`);
      console.error(`Response:`, errorText);

      if (response.status === 413) {
        console.error(`Prompt too large for ${GROQ_MODEL}. Reduce prompt size before retrying.`);
      }

      throw new Error("AI request failed");
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      console.error(`❌ Groq returned an empty response`);
      throw new Error("AI request failed");
    }

    if (isDev) {
      console.log(`✅ Groq returned text length: ${text.length} chars`);
    }

    return text;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Groq API Error: ${errorMsg}`);
    console.error(`Stack:`, error instanceof Error ? error.stack : "No stack trace");
    throw new Error("AI request failed");
  }
};
