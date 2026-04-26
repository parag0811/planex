import axiosInstance from "@/src/lib/axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export interface Project {
  id: string;
  name: string;
  owner_id?: string;
  members?: Array<{
    id: string;
    user_id: string;
    project_id: string;
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export type SectionType = "idea" | "database" | "api" | "folder";

type SectionResponse = unknown;

interface ProjectPayload {
  projectId: string;
  name: string;
}

interface OperationState {
  loading: boolean;
  error: string | null;
}

const getErrorMessage = (error: any, fallback: string) => {
  const responseData = error?.response?.data;

  if (Array.isArray(responseData?.data) && responseData.data.length > 0) {
    const firstValidationError = responseData.data[0];

    if (typeof firstValidationError?.msg === "string") {
      return firstValidationError.msg;
    }
  }

  if (typeof responseData?.message === "string") {
    return responseData.message;
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

export const fetchProjects = createAsyncThunk(
  "project/fetchProjects",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/projects");

      return (res.data.data ?? res.data.projects ?? []) as Project[];
    } catch (error: any) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch projects"),
      );
    }
  },
);

export const fetchProjectById = createAsyncThunk(
  "project/fetchProjectById",
  async (projectId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/projects/${projectId}`);

      return res.data.project as Project;
    } catch (error: any) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch projects"),
      );
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
      return rejectWithValue(
        getErrorMessage(error, "Failed to create project"),
      );
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
      return rejectWithValue(
        getErrorMessage(error, "Failed to update project"),
      );
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
      return rejectWithValue(
        getErrorMessage(error, "Failed to delete project"),
      );
    }
  },
);

export const getSectionByType = createAsyncThunk(
  "project/getSectionByType",
  async (
    params: { projectId: string; type: SectionType },
    { rejectWithValue },
  ) => {
    try {
      const { projectId, type } = params;
      const normalizedType = type.toUpperCase();
      const res = await axiosInstance.get(
        `/projects/${projectId}/sections/${normalizedType}`,
      );

      return res.data.data as SectionResponse;
    } catch (error: any) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch project section"),
      );
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
  currentProject: Project | null;
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
  currentProject: null,
};

const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setCurrentProject: (state, action: { payload: Project | null }) => {
      state.currentProject = action.payload;
    },
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
        if (state.currentProject) {
          const selectedProject = action.payload.find(
            (project) => project.id === state.currentProject?.id,
          );
          state.currentProject = selectedProject ?? null;
        }
        state.fetch.loading = false;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.fetch.loading = false;
        state.fetch.error = action.payload as string;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.currentProject = action.payload;
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
        if (
          state.currentProject &&
          !state.projects.some(
            (project) => project.id === state.currentProject?.id,
          )
        ) {
          state.currentProject = null;
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.remove.loading = false;
        state.remove.error = action.payload as string;
      });
  },
});

export const { setCurrentProject, clearProjectErrors } = projectSlice.actions;
export default projectSlice.reducer;
