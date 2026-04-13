import axiosInstance from "@/src/lib/axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface Project {
  id: string;
  name: string;
  owner_id?: string;
  [key: string]: unknown;
}

interface ProjectPayload {
  projectId: string;
  name: string;
}

interface OperationState {
  loading: boolean;
  error: string | null;
}

export const fetchProjects = createAsyncThunk(
  "project/fetchProjects",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/projects");

      return (res.data.data ?? res.data.projects ?? []) as Project[];
    } catch (error: any) {
      return rejectWithValue("Failed to fetch projects");
    }
  },
);

export const createProject = createAsyncThunk(
  "project/createProject",
  async (data: { name: string }, { dispatch, rejectWithValue }) => {
    try {
      await axiosInstance.post("/projects/create-project", data);
      await dispatch(fetchProjects()).unwrap();
      return true;
    } catch (error: any) {
      return rejectWithValue("Failed to create project");
    }
  },
);

export const updateProject = createAsyncThunk(
  "project/updateProject",
  async (
    { projectId, name }: ProjectPayload,
    { dispatch, rejectWithValue },
  ) => {
    try {
      await axiosInstance.put(`/projects/${projectId}/update-project`, {
        name,
      });
      await dispatch(fetchProjects()).unwrap();
      return true;
    } catch (error: any) {
      return rejectWithValue("Failed to update project");
    }
  },
);

export const deleteProject = createAsyncThunk(
  "project/deleteProject",
  async (projectId: string, { dispatch, rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/projects/${projectId}/delete-project`);
      await dispatch(fetchProjects()).unwrap();
      return projectId;
    } catch (error: any) {
      return rejectWithValue("Failed to delete project");
    }
  },
);

interface ProjectState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  fetch: OperationState;
  create: OperationState;
  update: OperationState;
  remove: OperationState;
}

const initialState: ProjectState = {
  projects: [],
  loading: false,
  error: null,
  fetch: {
    loading: false,
    error: null,
  },
  create: {
    loading: false,
    error: null,
  },
  update: {
    loading: false,
    error: null,
  },
  remove: {
    loading: false,
    error: null,
  },
};

const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    clearProjectErrors: (state) => {
      state.error = null;
      state.fetch.error = null;
      state.create.error = null;
      state.update.error = null;
      state.remove.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fetch.loading = true;
        state.fetch.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
        state.fetch.loading = false;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.fetch.loading = false;
        state.fetch.error = action.payload as string;
      })
      .addCase(createProject.pending, (state) => {
        state.create.loading = true;
        state.create.error = null;
      })
      .addCase(createProject.fulfilled, (state) => {
        state.create.loading = false;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.create.loading = false;
        state.create.error = action.payload as string;
      })
      .addCase(updateProject.pending, (state) => {
        state.update.loading = true;
        state.update.error = null;
      })
      .addCase(updateProject.fulfilled, (state) => {
        state.update.loading = false;
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.update.loading = false;
        state.update.error = action.payload as string;
      })
      .addCase(deleteProject.pending, (state) => {
        state.remove.loading = true;
        state.remove.error = null;
      })
      .addCase(deleteProject.fulfilled, (state) => {
        state.remove.loading = false;
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.remove.loading = false;
        state.remove.error = action.payload as string;
      });
  },
});

export const { clearProjectErrors } = projectSlice.actions;
export default projectSlice.reducer;
