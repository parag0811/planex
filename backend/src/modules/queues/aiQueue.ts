import { Queue } from "bullmq";

export const aiQueue = new Queue("ai-queue", {
  connection: {
    host: process.env.REDIS_HOST as string,
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === "true" ? {} : undefined,
  },
});

aiQueue.on("error", (error) => {
  console.error("Queue Connection Error:", error instanceof Error ? error.message : String(error));
});
