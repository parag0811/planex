import { Worker } from "bullmq";
import { aiHandlers } from "./aiHandler";
import redis from "../../db/redis";

// Slightly below the worker lock duration (5 minutes) so the job fails cleanly
// and the underlying provider request is aborted before the lock expires.
const AI_JOB_TIMEOUT_MS = 290000;

const runHandlerWithTimeout = async (
  handler: (data: any, signal: AbortSignal) => Promise<any>,
  data: any,
): Promise<any> => {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      handler(data, controller.signal),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error(`AI job exceeded ${AI_JOB_TIMEOUT_MS}ms timeout`));
        }, AI_JOB_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

export const aiWorker = new Worker(
  "ai-queue",
  async (job) => {
    const handler = aiHandlers[job.name as keyof typeof aiHandlers];

    if (!handler) {
      throw new Error(`No handler found for job: ${job.name}`);
    }

    return await runHandlerWithTimeout(handler, job.data);
  },
  {
    concurrency: 3,
    lockDuration: 300000,
    stalledInterval: 180000, // Check for stalled jobs every 3 mins to drastically cut Redis requests
    drainDelay: 60, // Sleep 60 seconds when queue is empty to avoid idle polling
    maxStalledCount: 1,
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
    userId: job.data?.userId,
    projectId: job.data?.projectId,
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
    userId: job.data?.userId,
    projectId: job.data?.projectId,
  };

  try {
    await redis.set(cacheKey, JSON.stringify(jobState), "EX", 900);
    console.log(`📝 Job ${jobId} status updated to "completed" in Redis`);
  } catch (error) {
    console.error(`❌ Failed to update job ${jobId} completed status in Redis:`, error instanceof Error ? error.message : String(error));
  }
});

const sanitizeWorkerError = (error: Error | any): string => {
  const msg = error instanceof Error ? error.message : String(error);

  if (
    msg.includes("prisma") ||
    msg.includes("Can't reach database") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("pooler.supabase")
  ) {
    return "Database service is temporarily unreachable. Please retry in a moment.";
  }

  if (
    msg.includes("429") ||
    msg.includes("rate_limit") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("quota")
  ) {
    return "AI service rate limit exceeded. Please wait a moment and try again.";
  }

  if (msg.includes("404") || msg.includes("model_not_found")) {
    return "AI service is temporarily unavailable. Please try again.";
  }

  if (
    msg.toLowerCase().includes("timeout") ||
    msg.toLowerCase().includes("timed out") ||
    msg.includes("AbortError") ||
    msg.toLowerCase().includes("aborted")
  ) {
    return "AI generation timed out. Please try again.";
  }

  if (
    msg.includes("Idea and Database must exist first") ||
    msg.includes("Idea section missing") ||
    msg.includes("Idea, Database, and API must exist first") ||
    msg.includes("Section not found")
  ) {
    return msg;
  }

  if (msg.includes("Failed to generate a valid AI response")) {
    return "Failed to generate a valid AI response. Please try again.";
  }

  if (msg.includes("/") || msg.includes("\\") || msg.includes("at ") || msg.includes("invocation in")) {
    return "AI generation failed. Please try again.";
  }

  return msg || "AI generation failed. Please try again.";
};

aiWorker.on("failed", async (job, error) => {
  console.error(
    `❌ Job failed: ${job?.id} | Type: ${job?.name} | Attempt: ${job?.attemptsMade} | Raw Error: ${error.message}`,
  );

  if (job == undefined) {
    return;
  }

  const jobId = job.id;
  const cacheKey = `job:${jobId}`;

  const maxAttempts = job.opts.attempts ?? 1;
  const isFinalAttempt = job.attemptsMade >= maxAttempts;

  if (!isFinalAttempt) {
    // BullMQ still has attempts left. Keep the job pending so the UI keeps
    // polling instead of stopping on a transient provider failure.
    const retryState: JobStatus = {
      status: "pending",
      jobName: job.name,
      jobData: job.data,
      userId: job.data?.userId,
      projectId: job.data?.projectId,
      retrying: true,
      attemptsMade: job.attemptsMade,
    };

    try {
      await redis.set(cacheKey, JSON.stringify(retryState), "EX", 900);
      console.log(
        `🔁 Job ${jobId} failed attempt ${job.attemptsMade}/${maxAttempts}; retrying.`,
      );
    } catch (err) {
      console.error(
        `❌ Failed to update job ${jobId} retry status in Redis:`,
        err instanceof Error ? err.message : String(err),
      );
    }

    return;
  }

  const userFacingError = sanitizeWorkerError(error);

  const jobState: JobStatus = {
    status: "failed",
    error: userFacingError,
    jobName: job.name,
    jobData: job.data,
    userId: job.data?.userId,
    projectId: job.data?.projectId,
    retrying: false,
    attemptsMade: job.attemptsMade,
  };

  try {
    await redis.set(cacheKey, JSON.stringify(jobState), "EX", 900);
    console.log(`📝 Job ${jobId} status updated to "failed" in Redis with message: "${userFacingError}"`);
  } catch (err) {
    console.error(`❌ Failed to update job ${jobId} failed status in Redis:`, err instanceof Error ? err.message : String(err));
  }
});

aiWorker.on("stalled", (jobId) => {
  console.warn(`⚠️ Job ${jobId} has stalled!`);
});

