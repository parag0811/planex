import { Request, Response, NextFunction } from "express";
import { aiQueue } from "../queues/aiQueue";
import redis from "../../db/redis";

export type Section = "idea" | "database" | "api" | "folder" | "none";

export const chatController = async (
  req: Request<
    { projectId: string },
    {},
    { message: string; context: { section: Section } }
  >,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { projectId } = req.params;
    const { message, context } = req.body;

    if (!message) {
      const error = new Error("Message is required.") as AppError;
      error.status = 422;
      throw error;
    }

    const chatJob = await aiQueue.add(
      "chat",
      {
        projectId,
        message,
        context,
        userId: req.user?.id,
      },
      {
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    const jobId = String(chatJob.id);
    const jobKey = `job:${jobId}`;

    const jobState: JobStatus = {
      status: "pending",
    };

    try {
      await redis.set(jobKey, JSON.stringify(jobState), "EX", 900);
    } catch (error) {
      // Non-blocking Redis failure
    }

    return res.status(200).json({ status: "queued", jobId });
  } catch (error) {
    next(error);
  }
};
