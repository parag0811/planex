import { Worker } from "bullmq";
import { chatService } from "../modules/ai-assistant/chatService";
import { regenerateService } from "../services/ai/regenerate-section/regenerateService";

export const aiWorker = new Worker(
  "ai-queue",
  async (job) => {
    if (job.name === "chat") {
      const { projectId, message, context } = job.data;

      const result = await chatService({
        projectId,
        message,
        context,
      });

      return result;
    }

    if (job.name === "regen") {
      const { projectId, section, instruction } = job.data;

      const result = await regenerateService({
        projectId,
        section,
        instruction,
      });

      return result;
    }

    
    return null;
  },
  {
    connection: {
      host: (process.env.REDIS_HOST as string) || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
    },
  },
);
