import type { Request } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisRateLimit from "../db/redisRateLimit";

const createStore = (prefix: string) =>
  new RedisStore({
    sendCommand: async (...args: string[]) =>
      (await redisRateLimit.call(...(args as [string, ...string[]]))) as any,
    prefix,
  });

const getIpKey = (req: Request) =>
  ipKeyGenerator(req.ip || "127.0.0.1");

const limiterDefaults = {
  passOnStoreError: true,
  standardHeaders: true,
  legacyHeaders: false,
} as const;

export const authLimiter = rateLimit({
  ...limiterDefaults,
  windowMs: 15 * 60 * 1000,
  max: 20,
  store: createStore("rl_auth:"),
  keyGenerator: getIpKey,
  message: {
    success: false,
    message: "Too many login attempts. Try again in 15 minutes.",
  },
});

export const globalLimiter = rateLimit({
  ...limiterDefaults,
  windowMs: 15 * 60 * 1000,
  max: 1000,
  store: createStore("rl_global:"),
  keyGenerator: getIpKey,
  message: {
    success: false,
    message: "Too many requests. Slow down.",
  },
});

export const aiLimiter = rateLimit({
  ...limiterDefaults,
  windowMs: 60 * 1000,
  max: 10,
  store: createStore("rl_ai:"),
  keyGenerator: (req) => {
    const user = (req as any).user;

    if (user?.id) {
      return `ai:${user.id}`;
    }

    return getIpKey(req);
  },
  message: {
    success: false,
    message: "AI request limit reached. Try again in a minute.",
  },
});
