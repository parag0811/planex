import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redis from "../db/redis";

// express-rate-limit          ← counts requests, enforces limits
//       ↓
//   RedisStore                ← tells it: "store counts in Redis, not memory"
//       ↓
//   redisClient               ← your ioredis or redis client
//       ↓
//   Redis server              ← counts survive restarts / multiple servers

const store = new RedisStore({
  sendCommand: (...args: string[]) =>
    redis.call(...(args as [string, ...string[]])) as Promise<any> , // RedisStore talks to our redis client
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5, // 5 attempts per window

  store: store, // use Redis, not memory

  keyGenerator: (req) => req.ip ?? "unknown",
  //             ↑ count by IP address
  //               each IP gets its own counter in Redis

  message: {
    success: false,
    message: "Too many login attempts. Try again in 15 minutes.",
  },

  standardHeaders: true, // sends RateLimit-Limit, RateLimit-Remaining headers
  legacyHeaders: false, // disables old X-RateLimit-* headers
});

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // same window
  max: 100, // 100 requests per 15 min (much more relaxed)

  store: store, // same Redis store

  keyGenerator: (req) => req.ip ?? "unknown",

  message: {
    success: false,
    message: "Too many requests. Slow down.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});
