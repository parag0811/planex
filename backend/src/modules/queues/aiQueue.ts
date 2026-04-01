import { Queue } from "bullmq";
import { Request, Response, NextFunction } from "express";

export const aiQueue = new Queue("ai-queue", {
  connection: {
    host: (process.env.REDIS_HOST as string) || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
  },
});
