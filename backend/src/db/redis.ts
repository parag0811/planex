import { Redis } from "ioredis";

const redis = new Redis({
  port: Number(process.env.REDIS_PORT),
  host: process.env.REDIS_HOST as string,

  // username: process.env.REDIS_USERNAME || undefined,
  // password: process.env.REDIS_PASSWORD || undefined,

  //  tls: process.env.REDIS_TLS === "true" ? {} : undefined,
});

redis.on("connect", () => {
  console.log("Redis Connected....");
});

redis.on("error", (err) => {
  console.log("Redis Error....", err);
});

export default redis;
