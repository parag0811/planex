import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import jobReducer from "./slices/jobSlice";
import projectReducer from "./slices/projectSlice";
import sectionReducer from "./slices/sectionSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    job: jobReducer,
    project: projectReducer,
    section: sectionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;