import { Queue } from "bullmq";
import { Request, Response, NextFunction } from "express";

export const aiQueue = new Queue("ai-queue", {
  connection: {
    host: (process.env.REDIS_HOST as string) || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
  },
});

export const getJobStatus = async (
  req: Request<{ jobId: string }>,
  res: Response,
) => {
  const { jobId } = req.params;

  const job = await aiQueue.getJob(jobId);

  if (!job) {
    return res.status(404).json({ message: "not_found" });
  }

  const state = await job.getState();

  res.status(200).json({
    status: state,
    result: job.returnvalue || null,
  });
};
