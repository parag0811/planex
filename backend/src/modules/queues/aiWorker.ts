import { Worker } from "bullmq";
import { aiHandlers } from "./aiHandler";
import redis from "../../db/redis";

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
    concurrency: 5,
    lockDuration: 300000,
    stalledInterval: 30000,
    maxStalledCount: 2,
    connection: {
      host: process.env.REDIS_HOST as string,
      port: Number(process.env.REDIS_PORT) || 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      keepAlive: 10000,
      username: process.env.REDIS_USERNAME || undefined,
      password: process.env.REDIS_PASSWORD || undefined,
      tls:
        process.env.REDIS_TLS === "true"
          ? { servername: process.env.REDIS_HOST, rejectUnauthorized: false }
          : undefined,
    },
  },
);

aiWorker.on("error", (error) => {
  console.error("❌ Worker Error:", error instanceof Error ? error.message : String(error));
});

aiWorker.on("active", async (job) => {
  console.log(`🚀 Job started: ${job.id} | Type: ${job.name}`);

  const jobId = job.id;
  const cacheKey = `job:${jobId}`;

  const jobState: JobStatus = {
    status: "processing",
    jobName: job.name,
    jobData: job.data,
  };

  try {
    await redis.set(cacheKey, JSON.stringify(jobState), "EX", 900);
    console.log(`📝 Job ${jobId} status updated to "processing" in Redis`);
  } catch (error) {
    console.error(`❌ Failed to update job ${jobId} status in Redis:`, error instanceof Error ? error.message : String(error));
  }
});

aiWorker.on("completed", async (job, result) => {
  const duration =
    job.finishedOn && job.processedOn ? job.finishedOn - job.processedOn : null;

  console.log(
    `✅ Job ${job.id} completed. Type: ${job.name}. Duration: ${duration ?? 0}ms`,
  );

  const jobId = job.id;
  const cacheKey = `job:${jobId}`;

  const jobState: JobStatus = {
    status: "completed",
    result,
    jobName: job.name,
    jobData: job.data,
  };

  try {
    await redis.set(cacheKey, JSON.stringify(jobState), "EX", 900);
    console.log(`📝 Job ${jobId} status updated to "completed" in Redis`);
  } catch (error) {
    console.error(`❌ Failed to update job ${jobId} completed status in Redis:`, error instanceof Error ? error.message : String(error));
  }
});

aiWorker.on("failed", async (job, error) => {
  console.error(
    `❌ Job failed: ${job?.id} | Type: ${job?.name} | Attempt: ${job?.attemptsMade} | Error: ${error.message}`,
  );

  if (job == undefined) {
    return;
  }

  const jobId = job.id;
  const cacheKey = `job:${jobId}`;

  const errorMessage = error.message || "AI generation failed. Please try again.";

  const jobState: JobStatus = {
    status: "failed",
    error: errorMessage,
    jobName: job.name,
    jobData: job.data,
  };

  try {
    await redis.set(cacheKey, JSON.stringify(jobState), "EX", 900);
    console.log(`📝 Job ${jobId} status updated to "failed" in Redis`);
  } catch (error) {
    console.error(`❌ Failed to update job ${jobId} failed status in Redis:`, error instanceof Error ? error.message : String(error));
  }
});

aiWorker.on("stalled", (jobId) => {
  console.warn(`⚠️ Job ${jobId} has stalled!`);
});

