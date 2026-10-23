import "dotenv/config";
import express from "express";
import cors from "cors";
import passport from "./modules/auth/passport-auth/passport";
import authRoutes from "./modules/auth/auth.route";
import projectRoutes from "./modules/project/project.route";
import sectionRoutes from "./modules/project-sections/section.routes";
import jobsRoutes from "./modules/jobs/jobs.route";
import projectMemberRoutes from "./modules/project-member/project.member.route";
import activityRoutes from "./modules/project-activity/activity.route";
import chatRoutes from "./modules/project-ai-chat/chatRoute";
import errorHandler from "./middleware/error.middleware";
import { aiWorker } from "./modules/queues/aiWorker";
import { aiQueue } from "./modules/queues/aiQueue";
import { globalLimiter } from "./middleware/rateLimit.middleware";
import prisma from "./db/prisma";
import redisRateLimit from "./db/redisRateLimit";

const app = express();

app.set("trust proxy", 1); // Gives real user IP

const parseAllowedOrigins = (): string[] => {
  const envOrigins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((url) => url.trim().replace(/\/$/, ""))
    .filter(Boolean);

  if (process.env.NODE_ENV !== "production") {
    envOrigins.push("http://localhost:3000", "http://localhost:5173");
  }

  return [...new Set(envOrigins)];
};

const allowedOrigins = parseAllowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
  }),
);

const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
  let timer: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Timed out after ${ms}ms`)),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const getDependencyChecks = async () => {
  const [dbResult, redisResult] = await Promise.allSettled([
    withTimeout(prisma.$queryRaw`SELECT 1`, 3000),
    withTimeout(redisRateLimit.ping(), 3000),
  ]);

  return {
    database: dbResult.status === "fulfilled",
    redis: redisResult.status === "fulfilled",
  };
};

// Process-only liveness probe. Never checks dependencies, so it cannot flap
// because of a transient Redis/Postgres hiccup.
app.get(["/live", "/api/live"], (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Planex Backend process is running",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Readiness probe for Render, Cron, and uptime monitors (placed BEFORE
// rate-limiting so it keeps working when Redis is the unhealthy component).
app.get(
  ["/health", "/api/health", "/ready", "/api/ready"],
  async (req, res) => {
    const checks = await getDependencyChecks();
    const ready = checks.database && checks.redis;

    return res.status(ready ? 200 : 503).json({
      status: ready ? "ok" : "degraded",
      message: ready
        ? "Planex Backend is healthy and operational"
        : "Planex Backend is degraded: a required dependency is unavailable",
      checks,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  },
);

app.get("/", (req, res) => {
  res.status(200).json({
    name: "Planex Backend API",
    status: "running",
    healthEndpoint: "/health",
    timestamp: new Date().toISOString(),
  });
});

app.use(globalLimiter);

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(passport.initialize());
app.use("/auth", authRoutes);
app.use("/projects", projectRoutes);
app.use("/projects", sectionRoutes);
app.use("/projects", projectMemberRoutes);
app.use("/projects", activityRoutes);
app.use("/projects", chatRoutes);
app.use("/jobs", jobsRoutes);

app.use(errorHandler);

console.log("🚀 Starting AI Queue Worker...");

// Verify queue connection
aiQueue
  .waitUntilReady()
  .then(() => console.log("✅ AI Queue connected to Redis successfully"))
  .catch((err) =>
    console.error("❌ AI Queue FAILED to connect to Redis:", err.message),
  );

// Verify worker connection
aiWorker
  .waitUntilReady()
  .then(() =>
    console.log("✅ AI Worker connected to Redis and listening for jobs"),
  )
  .catch((err) =>
    console.error("❌ AI Worker FAILED to connect to Redis:", err.message),
  );

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
