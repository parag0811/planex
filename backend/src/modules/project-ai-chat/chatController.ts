import { Request, Response, NextFunction } from "express";
import { aiQueue } from "../queues/aiQueue";
import { setJsonCache } from "../../db/cache";

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
    const message = req.body.message.trim();
    // Drop any extra context fields: only the target section is used and
    // this keeps the queued payload (and prompt) bounded.
    const section = req.body.context?.section ?? "none";

    const chatJob = await aiQueue.add(
      "chat",
      {
        projectId,
        message,
        context: { section },
        userId: String(req.user!.id),
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 3000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    const jobId = String(chatJob.id);
    const jobKey = `job:${jobId}`;

    const jobState: JobStatus = {
      status: "pending",
      userId: String(req.user!.id),
      projectId,
    };

    await setJsonCache(jobKey, jobState, 900);

    return res.status(200).json({ status: "queued", jobId });
  } catch (error) {
    next(error);
  }
};
