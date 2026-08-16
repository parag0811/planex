import { Redis } from "ioredis";

const redis = new Redis({
  port: Number(process.env.REDIS_PORT) || 6379,
  host: process.env.REDIS_HOST as string,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  keepAlive: 10000,

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
