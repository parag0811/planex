declare global {
  type JobStatusType = "pending" | "processing" | "completed" | "failed";

  interface BaseJobStatus {
    status: JobStatusType;
  }

  interface JobStatus extends BaseJobStatus {
    result?: unknown;
    error?: string;
    jobName?: string;
    jobData?: any;
  }
}

export {};
