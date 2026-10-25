"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * True only after hydration. Use for auth/user-dependent UI so the first
 * client render matches the server-rendered (logged-out) markup.
 */
export const useMounted = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
