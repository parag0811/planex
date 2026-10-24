"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  fetchUser,
  getCachedAuthUser,
  hydrateAuth,
  logout,
} from "../store/slices/authSlice";
import type { AppDispatch } from "../store/store";

const isJwtExpired = (token: string): boolean => {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return true;

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(atob(padded));

    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  } catch {
    // If the token cannot be decoded, let the backend decide.
    return false;
  }
};

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || isJwtExpired(token)) {
      dispatch(logout());
      return;
    }

    // Render the last known profile immediately instead of showing the guest
    // UI while /auth/me is in flight (the backend may be cold-starting).
    const cachedUser = getCachedAuthUser();

    if (cachedUser) {
      dispatch(hydrateAuth({ token, user: cachedUser }));
    }

    // Always revalidate the session; a 401 will clear the cached profile.
    dispatch(fetchUser());
  }, [dispatch]); // runs once on mount

  return <>{children}</>;
}
