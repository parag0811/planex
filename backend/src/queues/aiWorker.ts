import { Worker } from "bullmq";
import { aiHandlers } from "./aiHandler";

export const aiWorker = new Worker(
  "ai-queue",
  async (job) => {
    const handler = aiHandlers[job.name as keyof typeof aiHandlers];

    if (!handler) {
      throw new Error(`No handler found for job: ${job.name}`);
    }

    return await handler(job.data);
  },
  {
    connection: {
      host: (process.env.REDIS_HOST as string) || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
    },
  },
);
