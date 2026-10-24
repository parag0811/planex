import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import axiosInstance from "@/src/lib/axios";
import { updateProfile } from "@/src/services/auth.service";

const AUTH_USER_STORAGE_KEY = "planex_user";

export const getCachedAuthUser = (): any | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const cacheAuthUser = (user: any | null) => {
  if (typeof window === "undefined") return;

  try {
    if (user) {
      window.localStorage.setItem(
        AUTH_USER_STORAGE_KEY,
        JSON.stringify(user),
      );
    } else {
      window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    }
  } catch {
    // localStorage can be unavailable (private mode/quota); auth still works.
  }
};

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (
    data: { name: string; email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.post("/auth/register", data);

      return res.data.message;
    } catch (error: any) {
      const fieldErrors = error.response?.data?.fieldErrors;
      const message = error.response?.data?.message || "Registration failed";

      if (fieldErrors) {
        return rejectWithValue({ fieldErrors, message });
      }

      return rejectWithValue(message);
    }
  },
);

// dispatch login
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (
    data: { email: string; password: string },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const res = await axiosInstance.post("/auth/login", data);

      const token = res.data.token;

      localStorage.setItem("token", token);

      try {
        await dispatch(fetchUser()).unwrap();
      } catch (error: any) {
        if (error?.status === 401) {
          localStorage.removeItem("token");
          return rejectWithValue(
            error.message || "Your session is invalid. Please log in again.",
          );
        }

        // Login succeeded but the profile request hit a temporary outage.
        // Keep the token and let the next request or refresh recover.
      }

      return token;
    } catch (error: any) {
      const status = error.response?.status;
      if (status === 401) {
        localStorage.removeItem("token");
      }

      const fieldErrors = error.response?.data?.fieldErrors;
      const message =
        typeof error === "string"
          ? error
          : error.response?.data?.message ||
            error.message ||
            "Login failed. Please try again.";

      if (fieldErrors) {
        return rejectWithValue({ fieldErrors, message });
      }

      return rejectWithValue(message);
    }
  },
);

// Fetch user details
export const fetchUser = createAsyncThunk(
  "auth/fetchUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/auth/me");

      return res.data.user;
    } catch (error: any) {
      return rejectWithValue({
        status: error.response?.status,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch user",
      });
    }
  },
);

// Update user profile (name, avatar)
export const updateUserProfile = createAsyncThunk(
  "auth/updateUserProfile",
  async (data: FormData, { rejectWithValue, dispatch }) => {
    try {
      await updateProfile(data);
      const user = await dispatch(fetchUser()).unwrap();
      return user;
    } catch (error: any) {
      return rejectWithValue(
        typeof error === "string"
          ? error
          : error.response?.data?.message || "Update failed",
      );
    }
  },
);

interface AuthState {
  user: any;
  token: string | null;
  isAuth: boolean;
  authCheckLoading: boolean;
  loginLoading: boolean;
  profileLoading: boolean;
  error: string | null;
  registerLoading: boolean;
  registerError: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuth: false,
  authCheckLoading: true, 
  loginLoading: false,
  profileLoading: false,
  error: null,
  registerLoading: false,
  registerError: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateAuth: (
      state,
      action: PayloadAction<{ token: string; user: any }>,
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuth = true;
      state.authCheckLoading = false;
    },
    setToken: (state, action) => {
      state.token = action.payload;
      // A new OAuth token belongs to a new session; do not keep the previous
      // account's cached profile visible while /auth/me loads.
      state.user = null;
      state.isAuth = false;
      cacheAuthUser(null);
      state.authCheckLoading = false;
      state.loginLoading = false;
      state.profileLoading = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuth = false;
      state.authCheckLoading = false;
      state.loginLoading = false;
      state.profileLoading = false;
      state.error = null;
      state.registerError = null;

      localStorage.removeItem("token");
      cacheAuthUser(null);
    },
    clearAuthErrors: (state) => {
      state.error = null;
      state.registerError = null;
    },
  },
  extraReducers: (builder) => {
    // REGISTER
    builder
      .addCase(registerUser.pending, (state) => {
        state.registerLoading = true;
        state.registerError = null;
      })

      .addCase(registerUser.fulfilled, (state) => {
        state.registerLoading = false;
      })

      .addCase(registerUser.rejected, (state, action) => {
        state.registerLoading = false;
        const payload = action.payload as any;
        if (payload?.message) {
           state.registerError = payload.message;
        } else {
           state.registerError = payload as string;
        }
      });
    // LOGIN
    builder
      .addCase(loginUser.pending, (state) => {
        state.loginLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loginLoading = false;
        state.token = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loginLoading = false;
        const payload = action.payload as any;
        if (payload?.message) {
           state.error = payload.message;
        } else {
           state.error = payload as string;
        }
      })

      // FETCH USER
      .addCase(fetchUser.pending, (state) => {
        if (!state.isAuth) {
          state.authCheckLoading = true;
        }
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.authCheckLoading = false;
        state.user = action.payload;
        state.isAuth = true;
        cacheAuthUser(action.payload);
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.authCheckLoading = false;
        const payload: any = action.payload;
        
        // Only log out if explicitly Unauthorized. Otherwise, ignore network/500 errors.
        if (payload?.status === 401) {
          state.user = null;
          state.isAuth = false;
          state.token = null;
          localStorage.removeItem("token");
          cacheAuthUser(null);
        } else if (localStorage.getItem("token")) {
          // Optimistically keep them logged in if it's just a backend restart
          state.isAuth = true;
        }
      })

      // UPDATE PROFILE
      .addCase(updateUserProfile.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.user = action.payload;
        cacheAuthUser(action.payload);
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { hydrateAuth, logout, setToken, clearAuthErrors } =
  authSlice.actions;
export default authSlice.reducer;
