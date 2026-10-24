"use client";

import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/src/store/store";
import {
  getJobStatusThunk,
  markJobTimedOut,
  type JobStatusType,
  type SectionName,
} from "@/src/store/slices/jobSlice";

const FIRST_MINUTE_INTERVAL_MS = 2500;
const SLOW_INTERVAL_MS = 5000;
const SLOWEST_INTERVAL_MS = 10000;
const SLOW_AFTER_MS = 60_000;
const SLOWER_AFTER_MS = 180_000;
const MAX_POLL_DURATION_MS = 6 * 60_000;

const getPollInterval = (elapsedMs: number) => {
  if (elapsedMs < SLOW_AFTER_MS) return FIRST_MINUTE_INTERVAL_MS;
  if (elapsedMs < SLOWER_AFTER_MS) return SLOW_INTERVAL_MS;
  return SLOWEST_INTERVAL_MS;
};

const isTerminalStatus = (status: JobStatusType) =>
  status === "completed" || status === "failed" || status === "timed_out";

interface UseJobPollingOptions {
  jobId: string | null | undefined;
  status: JobStatusType;
  section: SectionName;
  timeoutMessage?: string;
}

/**
 * Polls a job with a short interval for the first minute, backs off after
 * that, and stops after six minutes with an explicit "still processing"
 * state. Transient poll failures are handled by the slice and do not stop
 * polling.
 */
export const useJobPolling = ({
  jobId,
  status,
  section,
  timeoutMessage,
}: UseJobPollingOptions) => {
  const dispatch = useDispatch<AppDispatch>();
  const statusRef = useRef(status);
  const timedOutRef = useRef(false);

  useEffect(() => {
    statusRef.current = status;

    if (status === "idle" || status === "completed" || status === "failed") {
      timedOutRef.current = false;
    }
  }, [status]);

  useEffect(() => {
    if (!jobId || isTerminalStatus(statusRef.current)) return;

    timedOutRef.current = false;
    let cancelled = false;
    let timer: number | undefined;
    const startedAt = Date.now();

    const scheduleNext = (elapsedMs: number) => {
      if (cancelled || timedOutRef.current) return;
      timer = window.setTimeout(poll, getPollInterval(elapsedMs));
    };

    const poll = () => {
      if (cancelled || timedOutRef.current) return;
      if (isTerminalStatus(statusRef.current)) return;

      const elapsedMs = Date.now() - startedAt;

      if (elapsedMs >= MAX_POLL_DURATION_MS) {
        timedOutRef.current = true;
        dispatch(
          markJobTimedOut({
            section,
            jobId,
            ...(timeoutMessage ? { message: timeoutMessage } : {}),
          }),
        );
        return;
      }

      void dispatch(getJobStatusThunk({ jobId, section }));
      scheduleNext(elapsedMs);
    };

    void dispatch(getJobStatusThunk({ jobId, section }));
    scheduleNext(0);

    return () => {
      cancelled = true;
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [dispatch, jobId, section, timeoutMessage]);
};
