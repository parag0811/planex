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

// function sendCommand(...args) {
//   return redis.call(...args);
// } As it sends command and express rl creates redis key itself

const createStore = (prefix: string) => new RedisStore({
  sendCommand: (...args: string[]) =>
    redis.call(...(args as [string, ...string[]])) as Promise<any>, // RedisStore talks to our redis client
  prefix
});

// AUTH Limiter will use IP as key
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20, // increased from 5 to 20 for development stability

  store: createStore("rl_auth:"), // use Redis, not memory

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

// GLOBAL Limiter will use IP as key
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // same window
  max: 100, // 100 requests per 15 min (much more relaxed)

  store: createStore("rl_global:"), // same Redis store

  keyGenerator: (req) => req.ip ?? "unknown",

  message: {
    success: false,
    message: "Too many requests. Slow down.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});

// AI Limiter will use USER ID as key
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,

  store: createStore("rl_ai:"),

  keyGenerator: (req) => {
    const user = (req as any).user;

    if (user?.id) {
      return `ai:${user.id}`; // ← key by user ID
    }

    return req.ip ?? "unknown";
  },

  message: {
    success: false,
    message: "AI request limit reached. Try again in a minute.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});
