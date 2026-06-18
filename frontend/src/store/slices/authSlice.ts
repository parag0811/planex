import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/src/lib/axios";
import { updateProfile } from "@/src/services/auth.service";

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

      await dispatch(fetchUser()).unwrap();

      return token;
    } catch (error: any) {
      localStorage.removeItem("token");
      return rejectWithValue(
        typeof error === "string"
          ? error
          : error.response?.data?.message || "Login Failed",
      );
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
      return rejectWithValue("Failed to fetch user");
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
}

const initialToken =
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

const initialState: AuthState = {
  user: null,
  token: initialToken,
  isAuth: false,
  authCheckLoading: Boolean(initialToken),
  loginLoading: false,
  profileLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
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

      localStorage.removeItem("token");
    },
  },
  extraReducers: (builder) => {
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
        state.error = action.payload as string;
      })

      // FETCH USER
      .addCase(fetchUser.pending, (state) => {
        state.authCheckLoading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.authCheckLoading = false;
        state.user = action.payload;
        state.isAuth = true;
      })
      .addCase(fetchUser.rejected, (state) => {
        state.authCheckLoading = false;
        state.user = null;
        state.isAuth = false;
        state.token = null;
      })

      // UPDATE PROFILE
      .addCase(updateUserProfile.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, setToken } = authSlice.actions;
export default authSlice.reducer;
