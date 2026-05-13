import axiosInstance from "@/src/lib/axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export type JobStatusType =
  | "idle"
  | "pending"
  | "processing"
  | "completed"
  | "failed";

interface JobState {
  jobId: string | null;
  status: JobStatusType;
  result: any | null;
  error: string | null;
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

interface JobStatusResponse {
  status: JobStatusType;
  result: any | null;
  error: string | null;
}

interface JobParams {
  jobId: string;
}

interface GenerateJobResult {
  jobId?: string;
  cachedData?: unknown;
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
      } satisfies JobStatusResponse;
    } catch (error: any) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to get job status"),
      );
    }
  },
);

const initialState: JobState = {
  jobId: null,
  status: "idle",
  result: null,
  error: null,
};

const jobSlice = createSlice({
  name: "job",
  initialState,
  reducers: {
    clearJobState: (state) => {
      state.jobId = null;
      state.status = "idle";
      state.result = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const onGeneratePending = (state: JobState) => {
      state.status = "pending";
      state.result = null;
      state.error = null;
    };

    const onGenerateFulfilled = (
      state: JobState,
      action: { payload: unknown },
    ) => {
      const payload = action.payload as GenerateJobResult | undefined;

      if (payload?.cachedData !== undefined) {
        state.jobId = null;
        state.status = "completed";
        state.result = payload.cachedData;
        state.error = null;
        return;
      }

      state.jobId = String(payload?.jobId ?? action.payload ?? "");
      state.status = "pending";
      state.result = null;
      state.error = null;
    };

    const onGenerateRejected = (
      state: JobState,
      action: { payload?: unknown; error: { message?: string | null } },
    ) => {
      state.status = "failed";
      state.error = (action.payload as string) ?? action.error.message ?? null;
    };

    builder
      .addCase(generateIdea.pending, onGeneratePending)
      .addCase(generateIdea.fulfilled, onGenerateFulfilled)
      .addCase(generateIdea.rejected, onGenerateRejected)
      .addCase(generateDatabase.pending, onGeneratePending)
      .addCase(generateDatabase.fulfilled, onGenerateFulfilled)
      .addCase(generateDatabase.rejected, onGenerateRejected)
      .addCase(generateApi.pending, onGeneratePending)
      .addCase(generateApi.fulfilled, onGenerateFulfilled)
      .addCase(generateApi.rejected, onGenerateRejected)
      .addCase(generateFolder.pending, onGeneratePending)
      .addCase(generateFolder.fulfilled, onGenerateFulfilled)
      .addCase(generateFolder.rejected, onGenerateRejected)
      .addCase(regenerateSection.pending, onGeneratePending)
      .addCase(regenerateSection.fulfilled, onGenerateFulfilled)
      .addCase(regenerateSection.rejected, onGenerateRejected)
      .addCase(getJobStatusThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(getJobStatusThunk.fulfilled, (state, action) => {
        state.jobId = action.meta.arg.jobId;
        state.status = action.payload.status;
        state.result = action.payload.result;
        state.error = action.payload.error;
      })
      .addCase(getJobStatusThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) ?? action.error.message ?? null;
      });
  },
});

export const { clearJobState } = jobSlice.actions;
export default jobSlice.reducer;
