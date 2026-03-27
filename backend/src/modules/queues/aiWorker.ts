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

aiWorker.on("active", (job) => {
  console.log(`🚀 Job started: ${job.id} | Type: ${job.name}`);
});

aiWorker.on("completed", (job, result) => {
  const duration =
    job.finishedOn && job.processedOn ? job.finishedOn - job.processedOn : null;

  console.log(
    ` ✅ Job ${job.id} completed. Type : ${job.name}. Result : ${result}. Duration: ${duration}ms`,
  );
});

aiWorker.on("failed", (job, error) => {
  console.error(
    ` ❌ Job failed: ${job?.id} | Type: ${job?.name} | Attempt: ${job?.attemptsMade}`,
  );
  console.error(`Error: ${error.message}`);
});
