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

    const jobData = await redis.get(jobKey);

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

    return res.status(200).json({
      status: jobFound.status,
      result: jobFound.result,
      error: jobFound.error,
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

    const jobData = await redis.get(jobKey);
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
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
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
      console.error("Redis set failed (non-blocking):", error);
    }

    return res.status(200).json({
      status: "queued",
      jobId : newJobId,
    });
  } catch (error) {
    next(error);
  }
};
