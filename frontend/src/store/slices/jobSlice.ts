import axiosInstance from "@/src/lib/axios";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

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

export const generateIdea = createAsyncThunk(
  "job/generateIdea",
  async (params: GenerateIdeaParams, { dispatch, rejectWithValue }) => {
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

      // Store pending state and start polling


      // start polling but don't await here (so dispatching component doesn't block)
      

      return { jobId };
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ??
          error?.message ??
          "Failed to queue idea",
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
  reducers: {},
  extraReducers: (builder) => {},
});
