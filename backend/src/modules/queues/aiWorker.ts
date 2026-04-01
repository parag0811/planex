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
    connection: {
      host: (process.env.REDIS_HOST as string) || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
    },
  },
);

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
  } catch (error) {
    console.log(`Redis cache failed`);
  }
});

aiWorker.on("completed", async (job, result) => {
  const duration =
    job.finishedOn && job.processedOn ? job.finishedOn - job.processedOn : null;

  console.log(
    ` ✅ Job ${job.id} completed. Type : ${job.name}. Result : ${result}. Duration: ${duration}ms`,
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
  } catch (error) {
    console.log(`Redis cache failed`);
  }
});

aiWorker.on("failed", async (job, error) => {
  console.error(
    ` ❌ Job failed: ${job?.id} | Type: ${job?.name} | Attempt: ${job?.attemptsMade}`,
  );
  console.error(`Error: ${error.message}`);

  if (job == undefined) {
    console.error("Job is undefined.");
    return;
  }

  const jobId = job.id;
  const cacheKey = `job:${jobId}`;

  const jobState: JobStatus = {
    status: "failed",
    error: error.message,
    jobName: job.name,
    jobData: job.data,
  };

  try {
    await redis.set(cacheKey, JSON.stringify(jobState), "EX", 900);
  } catch (error) {
    console.log(`Redis cache failed`);
  }
});
