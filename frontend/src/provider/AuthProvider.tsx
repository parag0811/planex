"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchUser } from "../store/slices/authSlice";
import type { AppDispatch } from "../store/store";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuth } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token && !isAuth) {
      dispatch(fetchUser());
    }
  }, [dispatch, isAuth]);

  return <>{children}</>;
}
