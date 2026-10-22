import "dotenv/config";
import { Redis } from "ioredis";

const redisRateLimit = new Redis({
  port: Number(process.env.REDIS_PORT) || 6379,
  host: process.env.REDIS_HOST as string,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  enableReadyCheck: false,
  connectTimeout: 5000,
  commandTimeout: 3000,
  keepAlive: 30000,
  retryStrategy: (times) => Math.min(times * 200, 2000),
  username: process.env.REDIS_USERNAME || undefined,
  password: process.env.REDIS_PASSWORD || undefined,
  tls:
    process.env.REDIS_TLS === "true"
      ? { servername: process.env.REDIS_HOST, rejectUnauthorized: false }
      : undefined,
});

redisRateLimit.on("connect", () => {
  console.log("Rate-limit Redis connected.");
});

redisRateLimit.on("error", (err) => {
  console.error(
    "Rate-limit Redis error:",
    err instanceof Error ? err.message : String(err),
  );
});

export default redisRateLimit;
