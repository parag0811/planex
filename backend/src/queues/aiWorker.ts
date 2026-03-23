import { Worker } from "bullmq";
import { aiHandlers } from "./aiHandler";

export const aiWorker = new Worker(
  "ai-queue",
  async (job) => {
    console.log("Job has been started.");
    const handler = aiHandlers[job.name as keyof typeof aiHandlers];

    if (!handler) {
      console.log("Job failed");
      throw new Error(`No handler found for job: ${job.name}`);
    }

    console.log("Job is completed and data is : ", job.data);
    return await handler(job.data);
  },
  {
    connection: {
      host: (process.env.REDIS_HOST as string) || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
    },
  },
);
