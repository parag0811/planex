"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchUser } from "../store/slices/authSlice";
import type { AppDispatch } from "../store/store";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      dispatch(fetchUser());
    }
  }, [dispatch]);

  return <>{children}</>;
}