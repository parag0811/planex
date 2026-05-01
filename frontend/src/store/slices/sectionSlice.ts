import axiosInstance from "@/src/lib/axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export type SectionType = "idea" | "database" | "api" | "folder";

export interface ProjectSection {
	id: string;
	project_id: string;
	type: SectionType;
	content: unknown;
	version?: number;
	updatedAt?: string;
	createdAt?: string;
	[key: string]: unknown;
}

interface OperationState {
	loading: boolean;
	error: string | null;
}

interface SectionRecord {
	data: ProjectSection | null;
	content: unknown;
	fetch: OperationState;
	save: OperationState;
}

interface ProjectSectionsState {
	idea: SectionRecord;
	database: SectionRecord;
	api: SectionRecord;
	folder: SectionRecord;
}

interface SectionState {
	projects: Record<string, ProjectSectionsState>;
}

interface SectionParams {
	projectId: string;
	type: SectionType;
}

interface SaveSectionParams extends SectionParams {
	content: unknown;
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

const createOperationState = (): OperationState => ({
	loading: false,
	error: null,
});

const createSectionRecord = (): SectionRecord => ({
	data: null,
	content: null,
	fetch: createOperationState(),
	save: createOperationState(),
});

const createProjectSectionsState = (): ProjectSectionsState => ({
	idea: createSectionRecord(),
	database: createSectionRecord(),
	api: createSectionRecord(),
	folder: createSectionRecord(),
});

const getProjectSectionsState = (
	state: SectionState,
	projectId: string,
) => {
	if (!state.projects[projectId]) {
		state.projects[projectId] = createProjectSectionsState();
	}

	return state.projects[projectId];
};

const getSectionRecord = (
	state: SectionState,
	projectId: string,
	type: SectionType,
) => getProjectSectionsState(state, projectId)[type];

const normalizeType = (type: SectionType) => type.toLowerCase() as SectionType;

export const fetchSectionByType = createAsyncThunk(
	"section/fetchSectionByType",
	async ({ projectId, type }: SectionParams, { rejectWithValue }) => {
		try {
			const normalizedType = normalizeType(type);
			const res = await axiosInstance.get(
				`/projects/${projectId}/sections/${normalizedType.toUpperCase()}`,
			);

			return {
				projectId,
				type: normalizedType,
				section: (res.data.data ?? null) as ProjectSection | null,
			};
		} catch (error: any) {
			return rejectWithValue(
				getErrorMessage(error, "Failed to fetch section"),
			);
		}
	},
);

export const upsertSection = createAsyncThunk(
	"section/upsertSection",
	async (
		{ projectId, type, content }: SaveSectionParams,
		{ rejectWithValue },
	) => {
		try {
			const normalizedType = normalizeType(type);
			const res = await axiosInstance.put(
				`/projects/${projectId}/sections/${normalizedType.toUpperCase()}`,
				{ content },
			);

			return {
				projectId,
				type: normalizedType,
				section: res.data.data as ProjectSection,
			};
		} catch (error: any) {
			return rejectWithValue(
				getErrorMessage(error, "Failed to save section"),
			);
		}
	},
);

const initialState: SectionState = {
	projects: {},
};

const sectionSlice = createSlice({
	name: "section",
	initialState,
	reducers: {
		clearSectionError: (
			state,
			action: { payload: { projectId: string; type: SectionType } },
		) => {
			const record = getSectionRecord(
				state,
				action.payload.projectId,
				action.payload.type,
			);

			record.fetch.error = null;
			record.save.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchSectionByType.pending, (state, action) => {
				const { projectId, type } = action.meta.arg;
				const record = getSectionRecord(state, projectId, type);

				record.fetch.loading = true;
				record.fetch.error = null;
			})
			.addCase(fetchSectionByType.fulfilled, (state, action) => {
				const { projectId, type, section } = action.payload;
				const record = getSectionRecord(state, projectId, type);

				record.fetch.loading = false;
				record.data = section;
				record.content = section?.content ?? null;
			})
			.addCase(fetchSectionByType.rejected, (state, action) => {
				const { projectId, type } = action.meta.arg;
				const record = getSectionRecord(state, projectId, type);

				record.fetch.loading = false;
				record.fetch.error = action.payload as string;
			})
			.addCase(upsertSection.pending, (state, action) => {
				const { projectId, type } = action.meta.arg;
				const record = getSectionRecord(state, projectId, type);

				record.save.loading = true;
				record.save.error = null;
			})
			.addCase(upsertSection.fulfilled, (state, action) => {
				const { projectId, type, section } = action.payload;
				const record = getSectionRecord(state, projectId, type);

				record.save.loading = false;
				record.data = section;
				record.content = section.content;
			})
			.addCase(upsertSection.rejected, (state, action) => {
				const { projectId, type } = action.meta.arg;
				const record = getSectionRecord(state, projectId, type);

				record.save.loading = false;
				record.save.error = action.payload as string;
			});
	},
});

export const { clearSectionError } = sectionSlice.actions;
export default sectionSlice.reducer;
