const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5-coder:3b";
const isDev = process.env.NODE_ENV !== "production";

export const callLLM = async (prompt: string) => {
  try {
    if (isDev) {
      console.log(`📝 Calling Ollama API (${OLLAMA_HOST}) with model ${OLLAMA_MODEL} and prompt length: ${prompt.length} chars`);
    }

    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`\n❌ OLLAMA API ERROR (Status: ${response.status})`);
      console.error(`Host: ${OLLAMA_HOST}`);
      console.error(`Model: ${OLLAMA_MODEL}`);
      console.error(`Prompt length: ${prompt.length} chars`);
      console.error(`Response:`, errorText);

      if (response.status === 404) {
        const error = new Error(`[404 NOT_FOUND] Ollama service not running or model "${OLLAMA_MODEL}" not found. Ensure Ollama is running on ${OLLAMA_HOST}`);
        throw error;
      } else if (response.status === 500) {
        const error = new Error(`[500 SERVER_ERROR] Ollama server error. Check if model "${OLLAMA_MODEL}" is loaded.`);
        throw error;
      }

      const error = new Error(`[${response.status} API_ERROR] ${errorText.substring(0, 200)}`);
      throw error;
    }

    const data = (await response.json()) as {
      response?: string;
      done?: boolean;
    };

    const text = data.response?.trim();

    if (!text) {
      console.error(`❌ [EMPTY_RESPONSE] Ollama returned no content. Response:`, JSON.stringify(data));
      const error = new Error(`[EMPTY_RESPONSE] Ollama returned empty content. Full response: ${JSON.stringify(data)}`);
      throw error;
    }

    if (isDev) {
      console.log(`✅ Ollama returned ${text.length} chars`);
    }

    return text;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ OLLAMA ERROR CAUGHT:`);
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
};
