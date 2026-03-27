import { Queue } from "bullmq";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../controllers/project.controller";

export const aiQueue = new Queue("ai-queue", {
  connection: {
    host: (process.env.REDIS_HOST as string) || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
  },
});

export const getJobStatus = async (
  req: Request<{ jobId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { jobId } = req.params;

    const job = await aiQueue.getJob(jobId);

    if (!job) {
      const error = new Error("No job found.") as ApiError;
      error.status = 404;
      throw error;
    }

    const state = await job.getState();

    const attemptsMade = job.attemptsMade;
    const maxAttempts = job.opts.attempts || 1;

    let status: string;

    if (state === "completed") {
      status = "done";
    } else if (state === "failed") {
      if (attemptsMade < maxAttempts) {
        status = "processing"; // still retrying
      } else {
        status = "error"; // final failure
      }
    } else if (state === "active") {
      status = "processing";
    } else if (state === "waiting" || state === "delayed") {
      status = "queued";
    } else {
      status = "processing"; 
    }

    const result = state === "completed" ? job.returnvalue : null;

    // Error only on FINAL failure
    // failedReason comes from the error we THROW in worker
    const jobError =
      state === "failed" && attemptsMade >= maxAttempts
        ? job.failedReason
        : null;

    res.status(200).json({
      status,
      result: result,
      error: jobError,
      attemptsMade,
      maxAttempts,
      timestamps: {
        createdAt: job.timestamp,
        startedAt: job.processedOn || null,
        finishedAt: job.finishedOn || null,
      },
    });
  } catch (error) {
    next(error);
  }
};
