import { Worker } from "bullmq";

export const aiWorker = new Worker(
  "ai-queue",
  async (job) => {
    console.log("Processing Job ->", job.name, job.data);

    return { success: true };
  },
  {
    connection: {
      host: (process.env.REDIS_HOST as string) || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
    },
  },
);
