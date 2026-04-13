import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/src/lib/axios";

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

interface AuthState {
  user: any;
  token: string | null;
  isAuth: boolean;
  loading: boolean;
  error: string | null;
}

const initialToken =
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

const initialState: AuthState = {
  user: null,
  token: initialToken,
  isAuth: false,
  loading: Boolean(initialToken),
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuth = false;
      state.loading = false;
      state.error = null;

      localStorage.removeItem("token");
    },
  },
  extraReducers: (builder) => {
    // LOGIN
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // FETCH USER
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuth = true;
      })
      .addCase(fetchUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuth = false;
        state.token = null;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
