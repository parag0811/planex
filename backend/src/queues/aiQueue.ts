import { Queue } from "bullmq";

export const aiQueue = new Queue("ai-queue", {
    connection : {
        host : process.env.REDIS_HOST as string || '127.0.0.1',
        port : Number(process.env.REDIS_PORT) || 6379
    },
})