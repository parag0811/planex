import { Redis } from "ioredis";

// Application Redis client for cache reads/writes and job state.
// It is deliberately bounded: Redis is optional for serving requests, so
// commands must fail fast instead of buffering forever when Redis is down.
// BullMQ keeps its own connection with `maxRetriesPerRequest: null`.
const redis = new Redis({
  port: Number(process.env.REDIS_PORT) || 6379,
  host: process.env.REDIS_HOST as string,
  maxRetriesPerRequest: 2,
  enableOfflineQueue: false,
  enableReadyCheck: false,
  connectTimeout: 5000,
  commandTimeout: 3000,
  keepAlive: 30000,
  retryStrategy: (times) => {
    // Backoff reconnects: 1s, 2s, 3s... max 10s (prevents burning commands on reconnect)
    return Math.min(times * 1000, 10000);
  },

  username: process.env.REDIS_USERNAME || undefined,
  password: process.env.REDIS_PASSWORD || undefined,

  tls:
    process.env.REDIS_TLS === "true"
      ? { servername: process.env.REDIS_HOST, rejectUnauthorized: false }
      : undefined,
});

redis.on("connect", () => {
  console.log("Redis Connected....");
});

redis.on("error", (err) => {
  console.error("Redis Error:", err instanceof Error ? err.message : String(err));
});

export default redis;
