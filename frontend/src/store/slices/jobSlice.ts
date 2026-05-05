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
}

interface JobStatusResponse {
  status: JobStatusType;
  result: any | null;
  error: string | null;
}

interface JobParams {
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
      const { projectId, idea } = params;

      const res = await axiosInstance.post(
        `/projects/${projectId}/ai/generate-idea`,
        { idea },
      );

      const jobId: string | undefined = res.data?.jobId;

      if (!jobId) {
        return rejectWithValue("No jobId returned from server");
      }

      return jobId;
    } catch (error: any) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to queue idea"),
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
    builder
      .addCase(generateIdea.pending, (state) => {
        state.status = "pending";
        state.result = null;
        state.error = null;
      })
      .addCase(generateIdea.fulfilled, (state, action) => {
        state.jobId = action.payload;
        state.status = "pending";
        state.result = null;
        state.error = null;
      })
      .addCase(generateIdea.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) ?? action.error.message ?? null;
      })
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
