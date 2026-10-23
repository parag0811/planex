import redis from "./redis";

const CACHE_COMMAND_TIMEOUT_MS = 1500;

const withRedisTimeout = <T>(operation: Promise<T>): Promise<T> => {
  let timer: NodeJS.Timeout | undefined;

  return Promise.race([
    operation,
    new Promise<T>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error("Redis operation timed out")),
        CACHE_COMMAND_TIMEOUT_MS,
      );
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
};

/**
 * Redis is an optional accelerator. Cache failures must never fail the
 * request or the AI job, so every helper resolves to a safe fallback.
 */
export const getJsonCache = async <T>(key: string): Promise<T | null> => {
  try {
    const raw = await withRedisTimeout(redis.get(key));

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const setJsonCache = async (
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> => {
  try {
    await withRedisTimeout(
      redis.set(key, JSON.stringify(value), "EX", ttlSeconds),
    );
  } catch {
    // Redis is optional; callers continue with the database/AI result.
  }
};
