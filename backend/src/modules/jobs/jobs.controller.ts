import { Request, Response, NextFunction } from "express";
import redis from "../../db/redis";

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
