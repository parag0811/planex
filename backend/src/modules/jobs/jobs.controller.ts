import { Request, Response, NextFunction } from "express";
import { getJsonCache, setJsonCache } from "../../db/cache";
import prisma from "../../db/prisma";
import { aiQueue } from "../queues/aiQueue";

const BULLMQ_READ_TIMEOUT_MS = 3000;

// BullMQ connections require `maxRetriesPerRequest: null`, so a read can stay
// pending while Redis reconnects. Status polling must not hang the request.
const withBullMqTimeout = async <T>(operation: Promise<T>): Promise<T> => {
  let timer: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("BullMQ read timed out")),
          BULLMQ_READ_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const canAccessJob = async (
  userId: string,
  job: JobStatus,
): Promise<boolean> => {
  const ownerId = job.userId ?? job.jobData?.userId;

  if (ownerId) {
    return String(ownerId) === userId;
  }

  const projectId = job.projectId ?? job.jobData?.projectId;

  if (!projectId) {
    return false;
  }

  const project = await prisma.project.findFirst({
    where: {
      id: String(projectId),
      OR: [
        { owner_id: userId },
        { members: { some: { user_id: userId } } },
      ],
    },
    select: { id: true },
  });

  return Boolean(project);
};

export const jobStatus = async (
  req: Request<{ jobId: string }, {}, {}>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { jobId } = req.params;
    const jobKey = `job:${jobId}`;

    let jobFound = await getJsonCache<JobStatus>(jobKey);

    // Self-healing fallback: If Redis is missing, pending, or processing, check BullMQ queue state directly.
    // The timeout keeps this request fast when the BullMQ Redis connection is down.
    if (!jobFound || jobFound.status === "pending" || jobFound.status === "processing") {
      try {
        await withBullMqTimeout(
          (async () => {
            const bullJob = await aiQueue.getJob(jobId);
            if (!bullJob) return;

            const isCompleted = await bullJob.isCompleted();
            const isFailed = await bullJob.isFailed();

            if (isCompleted) {
              jobFound = {
                status: "completed",
                result: bullJob.returnvalue,
                jobName: bullJob.name,
                jobData: bullJob.data,
                userId: bullJob.data?.userId,
                projectId: bullJob.data?.projectId,
              };
              await setJsonCache(jobKey, jobFound, 900);
            } else if (isFailed) {
              jobFound = {
                status: "failed",
                error:
                  bullJob.failedReason ||
                  "AI generation failed. Please try again.",
                jobName: bullJob.name,
                jobData: bullJob.data,
                userId: bullJob.data?.userId,
                projectId: bullJob.data?.projectId,
              };
              await setJsonCache(jobKey, jobFound, 900);
            }
          })(),
        );
      } catch (bullErr) {
        // Non-blocking BullMQ fallback failure/timeout
      }
    }

    if (!jobFound) {
      return res.status(404).json({ message: "Job not found or expired." });
    }

    if (!(await canAccessJob(String(req.user!.id), jobFound))) {
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

    const jobFound = await getJsonCache<JobStatus>(jobKey);

    if (!jobFound) {
      return res.status(404).json({ message: "Job not found or expired." });
    }

    if (!(await canAccessJob(String(req.user!.id), jobFound))) {
      return res.status(404).json({ message: "Job not found or expired." });
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

    // Carry ownership metadata into the retried job so the new job remains
    // protected by the same authorization checks as the original one.
    const retriedJobData =
      jobFound.jobData && typeof jobFound.jobData === "object"
        ? { ...jobFound.jobData }
        : jobFound.jobData;

    if (retriedJobData && typeof retriedJobData === "object") {
      if (jobFound.userId && !retriedJobData.userId) {
        retriedJobData.userId = jobFound.userId;
      }
      if (jobFound.projectId && !retriedJobData.projectId) {
        retriedJobData.projectId = jobFound.projectId;
      }
    }

    const job = await aiQueue.add(jobFound.jobName!, retriedJobData, {
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
      userId: job.data?.userId ?? jobFound.userId,
      projectId: job.data?.projectId ?? jobFound.projectId,
    };

    await setJsonCache(newJobKey, jobState, 900);

    return res.status(200).json({
      status: "queued",
      jobId : newJobId,
    });
  } catch (error) {
    next(error);
  }
};
