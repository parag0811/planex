import { Request, Response, NextFunction } from "express";
import redis from "../../db/redis";
import { aiQueue } from "../queues/aiQueue";

export const jobStatus = async (
  req: Request<{ jobId: string }, {}, {}>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { jobId } = req.params;
    const jobKey = `job:${jobId}`;

    let jobData: string | null = null;
    try {
      jobData = await redis.get(jobKey);
    } catch (error) {
      // Non-blocking Redis failure
    }

    let jobFound: JobStatus | null = null;
    if (jobData) {
      try {
        jobFound = JSON.parse(jobData);
      } catch (error) {
        // Invalid JSON
      }
    }

    // Self-healing fallback: If Redis is missing, pending, or processing, check BullMQ queue state directly
    if (!jobFound || jobFound.status === "pending" || jobFound.status === "processing") {
      try {
        const bullJob = await aiQueue.getJob(jobId);
        if (bullJob) {
          const isCompleted = await bullJob.isCompleted();
          const isFailed = await bullJob.isFailed();

          if (isCompleted) {
            jobFound = {
              status: "completed",
              result: bullJob.returnvalue,
              jobName: bullJob.name,
              jobData: bullJob.data,
            };
            await redis.set(jobKey, JSON.stringify(jobFound), "EX", 900);
          } else if (isFailed) {
            jobFound = {
              status: "failed",
              error: bullJob.failedReason || "AI generation failed. Please try again.",
              jobName: bullJob.name,
              jobData: bullJob.data,
            };
            await redis.set(jobKey, JSON.stringify(jobFound), "EX", 900);
          }
        }
      } catch (bullErr) {
        // Non-blocking BullMQ fallback failure
      }
    }

    if (!jobFound) {
      return res.status(404).json({ message: "Job not found or expired." });
    }

    return res.status(200).json({
      status: jobFound.status,
      result: jobFound.result,
      error: jobFound.error,
      jobName: jobFound.jobName,
      jobData: jobFound.jobData,
    });
  } catch (error) {
    next(error);
  }
};

export const retryJob = async (
  req: Request<{ jobId: string }, {}, {}>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { jobId } = req.params;
    const jobKey = `job:${jobId}`;

    let jobData: string | null = null;
    try {
      jobData = await redis.get(jobKey);
    } catch (error) {
      // Non-blocking Redis failure
    }
    if (!jobData) {
      return res.status(404).json({ message: "Job not found or expired." });
    }

    let jobFound: JobStatus;

    try {
      jobFound = JSON.parse(jobData);
    } catch (error) {
      return res.status(404).json({
        message: "Invalid job data.",
      });
    }

    if (jobFound.status !== "failed") {
      const error = new Error("Only failed jobs can retry.") as AppError;
      error.status = 400;
      throw error;
    }

    if (!jobFound.jobName || !jobFound.jobData) {
      const error = new Error("Job data not found.") as AppError;
      error.status = 400;
      throw error;
    }

    const job = await aiQueue.add(jobFound.jobName!, jobFound.jobData, {
      attempts: 1,
      removeOnComplete: true,
      removeOnFail: false,
    });

    const newJobId = String(job.id);
    const newJobKey = `job:${newJobId}`;

    const jobState: JobStatus = {
      status: "pending",
      jobName: job.name,
      jobData: job.data,
    };

    try {
      await redis.set(newJobKey, JSON.stringify(jobState), "EX", 900);
    } catch (error) {
      // Non-blocking Redis failure
    }

    return res.status(200).json({
      status: "queued",
      jobId : newJobId,
    });
  } catch (error) {
    next(error);
  }
};
