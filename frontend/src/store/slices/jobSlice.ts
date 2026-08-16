import axiosInstance from "@/src/lib/axios";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

export type JobStatusType =
  | "idle"
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type SectionName = "idea" | "database" | "api" | "folder" | "chat";

export interface SectionJobItem {
  jobId: string | null;
  status: JobStatusType;
  result: any | null;
  error: string | null;
}

interface JobState {
  jobId: string | null;
  status: JobStatusType;
  result: any | null;
  error: string | null;

  jobs: Record<SectionName, SectionJobItem>;
}

interface GenerateIdeaParams {
  projectId: string;
  idea: string;
  forceRegenerate?: boolean;
}

interface GenerateSectionParams {
  projectId: string;
}

interface RegenerateSectionParams {
  projectId: string;
  section: string;
  instruction?: string;
}

export type ChatSectionType = "idea" | "database" | "api" | "folder" | "none";

interface ChatMessageParams {
  projectId: string;
  message: string;
  section: ChatSectionType;
}

interface JobStatusResponse {
  status: JobStatusType;
  result: any | null;
  error: string | null;
  jobName?: string;
  jobData?: any;
}

interface JobParams {
  jobId: string;
  section?: SectionName;
}

interface GenerateJobResult {
  jobId?: string;
  cachedData?: unknown;
}

interface ChatJobResult {
  jobId: string;
}

const getErrorMessage = (error: any, fallback: string) => {
  const responseData = error?.response?.data;

  if (typeof responseData?.message === "string") {
    return responseData.message;
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

export const generateIdea = createAsyncThunk(
  "job/generateIdea",
  async (params: GenerateIdeaParams, { rejectWithValue }) => {
    try {
      const { projectId, idea, forceRegenerate = false } = params;

      const res = await axiosInstance.post(
        `/projects/${projectId}/ai/generate-idea`,
        { idea, forceRegenerate },
      );

      const jobId: string | undefined = res.data?.jobId;
      const cachedData = res.data?.status === "cached" ? res.data?.data : undefined;

      if (!jobId && cachedData === undefined) {
        return rejectWithValue("No jobId returned from server");
      }

      if (cachedData !== undefined) {
        return { cachedData: { idea: cachedData } } satisfies GenerateJobResult;
      }

      return { jobId } satisfies GenerateJobResult;
    } catch (error: any) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to queue idea"),
      );
    }
  },
);

export const generateDatabase = createAsyncThunk(
  "job/generateDatabase",
  async (params: GenerateSectionParams, { rejectWithValue }) => {
    try {
      const { projectId } = params;

      const res = await axiosInstance.post(
        `/projects/${projectId}/ai/generate-database`,
      );

      const jobId: string | undefined = res.data?.jobId;
      const cachedData = res.data?.status === "cached" ? res.data?.data : undefined;

      if (!jobId && cachedData === undefined) {
        return rejectWithValue("No jobId returned from server");
      }

      if (cachedData !== undefined) {
        return { cachedData } satisfies GenerateJobResult;
      }

      return { jobId } satisfies GenerateJobResult;
    } catch (error: any) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to queue database generation"),
      );
    }
  },
);

export const generateApi = createAsyncThunk(
  "job/generateApi",
  async (params: GenerateSectionParams, { rejectWithValue }) => {
    try {
      const { projectId } = params;

      const res = await axiosInstance.post(`/projects/${projectId}/ai/generate-api`);

      const jobId: string | undefined = res.data?.jobId;
      const cachedData = res.data?.status === "cached" ? res.data?.data : undefined;

      if (!jobId && cachedData === undefined) {
        return rejectWithValue("No jobId returned from server");
      }

      if (cachedData !== undefined) {
        return { cachedData } satisfies GenerateJobResult;
      }

      return { jobId } satisfies GenerateJobResult;
    } catch (error: any) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to queue API generation"),
      );
    }
  },
);

export const generateFolder = createAsyncThunk(
  "job/generateFolder",
  async (params: GenerateSectionParams, { rejectWithValue }) => {
    try {
      const { projectId } = params;

      const res = await axiosInstance.post(
        `/projects/${projectId}/ai/generate-folders`,
      );

      const jobId: string | undefined = res.data?.jobId;
      const cachedData = res.data?.status === "cached" ? res.data?.data : undefined;

      if (!jobId && cachedData === undefined) {
        return rejectWithValue("No jobId returned from server");
      }

      if (cachedData !== undefined) {
        return { cachedData } satisfies GenerateJobResult;
      }

      return { jobId } satisfies GenerateJobResult;
    } catch (error: any) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to queue folder generation"),
      );
    }
  },
);

export const regenerateSection = createAsyncThunk(
  "job/regenerateSection",
  async (params: RegenerateSectionParams, { rejectWithValue }) => {
    try {
      const { projectId, section, instruction } = params;

      const res = await axiosInstance.post(
        `/projects/${projectId}/ai/regenerate/${section}`,
        { section, instruction },
      );

      const jobId: string | undefined = res.data?.jobId;

      if (!jobId) {
        return rejectWithValue("No jobId returned from server");
      }

      return jobId;
    } catch (error: any) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to queue section regeneration"),
      );
    }
  },
);

export const sendChatMessage = createAsyncThunk(
  "job/sendChatMessage",
  async (params: ChatMessageParams, { rejectWithValue }) => {
    try {
      const { projectId, message, section } = params;

      const res = await axiosInstance.post(
        `/projects/${projectId}/ai/chat`,
        {
          message,
          context: { section },
        },
      );

      const jobId: string | undefined = res.data?.jobId;

      if (!jobId) {
        return rejectWithValue("No jobId returned from server");
      }

      return { jobId } satisfies ChatJobResult;
    } catch (error: any) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to queue chat message"),
      );
    }
  },
);

export const getAiJobStatusThunk = createAsyncThunk(
  "job/getAiJobStatus",
  async (params: JobParams, { rejectWithValue }) => {
    try {
      const { jobId } = params;

      const res = await axiosInstance.get(`/jobs/${jobId}`);

      return {
        status: (res.data?.status ?? "idle") as JobStatusType,
        result: res.data?.result ?? null,
        error: res.data?.error ?? null,
        jobName: res.data?.jobName,
        jobData: res.data?.jobData,
      } satisfies JobStatusResponse;
    } catch (error: any) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to get job status"),
      );
    }
  },
);

export const getJobStatusThunk = createAsyncThunk(
  "job/getJobStatus",
  async (params: JobParams, { rejectWithValue }) => {
    try {
      const { jobId } = params;

      const res = await axiosInstance.get(`/jobs/${jobId}`);

      return {
        status: (res.data?.status ?? "idle") as JobStatusType,
        result: res.data?.result ?? null,
        error: res.data?.error ?? null,
        jobName: res.data?.jobName,
        jobData: res.data?.jobData,
      } satisfies JobStatusResponse;
    } catch (error: any) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to get job status"),
      );
    }
  },
);

const emptyJobItem = (): SectionJobItem => ({
  jobId: null,
  status: "idle",
  result: null,
  error: null,
});

const initialState: JobState = {
  jobId: null,
  status: "idle",
  result: null,
  error: null,
  jobs: {
    idea: emptyJobItem(),
    database: emptyJobItem(),
    api: emptyJobItem(),
    folder: emptyJobItem(),
    chat: emptyJobItem(),
  },
};

const jobSlice = createSlice({
  name: "job",
  initialState,
  reducers: {
    clearJobState: (
      state,
      action: PayloadAction<{ section?: SectionName } | SectionName | undefined>,
    ) => {
      const payload = action.payload;
      const section = (typeof payload === "string" ? payload : payload?.section) as
        | SectionName
        | undefined;

      if (section && state.jobs && state.jobs[section]) {
        state.jobs[section] = emptyJobItem();
      } else {
        state.jobId = null;
        state.status = "idle";
        state.result = null;
        state.error = null;
        state.jobs = {
          idea: emptyJobItem(),
          database: emptyJobItem(),
          api: emptyJobItem(),
          folder: emptyJobItem(),
          chat: emptyJobItem(),
        };
      }
    },
  },
  extraReducers: (builder) => {
    const setPendingForSection = (state: JobState, sec: SectionName) => {
      state.status = "pending";
      state.result = null;
      state.error = null;
      if (state.jobs[sec]) {
        state.jobs[sec] = { jobId: null, status: "pending", result: null, error: null };
      }
    };

    const setFulfilledForSection = (
      state: JobState,
      sec: SectionName,
      payload: unknown,
    ) => {
      const jobRes = payload as GenerateJobResult | undefined;

      if (jobRes?.cachedData !== undefined) {
        state.jobId = null;
        state.status = "completed";
        state.result = jobRes.cachedData;
        state.error = null;

        if (state.jobs[sec]) {
          state.jobs[sec] = { jobId: null, status: "completed", result: jobRes.cachedData, error: null };
        }
        return;
      }

      const idStr = String(jobRes?.jobId ?? payload ?? "");
      state.jobId = idStr;
      state.status = "pending";
      state.result = null;
      state.error = null;

      if (state.jobs[sec]) {
        state.jobs[sec] = { jobId: idStr, status: "pending", result: null, error: null };
      }
    };

    const setRejectedForSection = (
      state: JobState,
      sec: SectionName,
      action: { payload?: unknown; error: { message?: string | null } },
    ) => {
      const errorMsg = (action.payload as string) ?? action.error.message ?? null;
      state.status = "failed";
      state.error = errorMsg;

      if (state.jobs[sec]) {
        state.jobs[sec] = { jobId: null, status: "failed", result: null, error: errorMsg };
      }
    };

    const handleJobStatusFulfilled = (
      state: JobState,
      action: { meta: { arg: JobParams }; payload: JobStatusResponse },
    ) => {
      const { jobId, section: argSection } = action.meta.arg;
      const { status, result, error, jobName, jobData } = action.payload;

      let targetSec = argSection;

      if (!targetSec) {
        if (jobName === "regen") {
          targetSec = jobData?.section?.toLowerCase() as SectionName;
        } else if (jobName && jobName in state.jobs) {
          targetSec = jobName.toLowerCase() as SectionName;
        }
      }

      if (targetSec && state.jobs[targetSec]) {
        state.jobs[targetSec] = {
          jobId,
          status,
          result,
          error,
        };
      }

      state.jobId = jobId;
      state.status = status;
      state.result = result;
      state.error = error;
    };

    const handleJobStatusRejected = (
      state: JobState,
      action: { meta: { arg: JobParams }; payload?: unknown; error: { message?: string | null } },
    ) => {
      const { section: argSection } = action.meta.arg || {};
      const errorMsg = (action.payload as string) ?? action.error.message ?? "Failed to get job status";

      if (argSection && state.jobs[argSection]) {
        state.jobs[argSection] = {
          jobId: action.meta.arg.jobId || null,
          status: "failed",
          result: null,
          error: errorMsg,
        };
      }

      state.status = "failed";
      state.error = errorMsg;
    };

    builder
      .addCase(generateIdea.pending, (state) => setPendingForSection(state, "idea"))
      .addCase(generateIdea.fulfilled, (state, action) => setFulfilledForSection(state, "idea", action.payload))
      .addCase(generateIdea.rejected, (state, action) => setRejectedForSection(state, "idea", action))

      .addCase(generateDatabase.pending, (state) => setPendingForSection(state, "database"))
      .addCase(generateDatabase.fulfilled, (state, action) => setFulfilledForSection(state, "database", action.payload))
      .addCase(generateDatabase.rejected, (state, action) => setRejectedForSection(state, "database", action))

      .addCase(generateApi.pending, (state) => setPendingForSection(state, "api"))
      .addCase(generateApi.fulfilled, (state, action) => setFulfilledForSection(state, "api", action.payload))
      .addCase(generateApi.rejected, (state, action) => setRejectedForSection(state, "api", action))

      .addCase(generateFolder.pending, (state) => setPendingForSection(state, "folder"))
      .addCase(generateFolder.fulfilled, (state, action) => setFulfilledForSection(state, "folder", action.payload))
      .addCase(generateFolder.rejected, (state, action) => setRejectedForSection(state, "folder", action))

      .addCase(regenerateSection.pending, (state, action) => {
        const sec = action.meta.arg.section.toLowerCase() as SectionName;
        setPendingForSection(state, sec in state.jobs ? sec : "idea");
      })
      .addCase(regenerateSection.fulfilled, (state, action) => {
        const sec = action.meta.arg.section.toLowerCase() as SectionName;
        setFulfilledForSection(state, sec in state.jobs ? sec : "idea", action.payload);
      })
      .addCase(regenerateSection.rejected, (state, action) => {
        const sec = action.meta.arg.section.toLowerCase() as SectionName;
        setRejectedForSection(state, sec in state.jobs ? sec : "idea", action);
      })

      .addCase(sendChatMessage.pending, (state) => setPendingForSection(state, "chat"))
      .addCase(sendChatMessage.fulfilled, (state, action) => setFulfilledForSection(state, "chat", action.payload))
      .addCase(sendChatMessage.rejected, (state, action) => setRejectedForSection(state, "chat", action))

      .addCase(getJobStatusThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(getJobStatusThunk.fulfilled, handleJobStatusFulfilled)
      .addCase(getJobStatusThunk.rejected, handleJobStatusRejected)

      .addCase(getAiJobStatusThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(getAiJobStatusThunk.fulfilled, handleJobStatusFulfilled)
      .addCase(getAiJobStatusThunk.rejected, handleJobStatusRejected);
  },
});

export const { clearJobState } = jobSlice.actions;
export default jobSlice.reducer;

