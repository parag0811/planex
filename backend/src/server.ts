import "dotenv/config";
import express from "express";
import type { Request } from "express";
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

const keepAliveIntervalMs = (() => {
  const parsed = Number(process.env.KEEPALIVE_INTERVAL_MS);
  if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  return process.env.NODE_ENV === "production" ? 4 * 60 * 1000 : 0;
})();

const isKeepAliveAuthorized = (req: Request) => {
  const secret = process.env.KEEPALIVE_SECRET;
  if (!secret) return true;
  return req.get("x-keepalive-secret") === secret;
};

const startDatabaseKeepAlive = () => {
  if (keepAliveIntervalMs <= 0) return;

  const timer = setInterval(async () => {
    try {
      await withTimeout(prisma.$queryRaw`SELECT 1`, 5000);
    } catch (error) {
      console.error(
        "Database keep-alive failed:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }, keepAliveIntervalMs);

  // Do not keep the Node process alive only for the timer.
  timer.unref();
  console.log(
    `Database keep-alive enabled every ${Math.round(
      keepAliveIntervalMs / 1000,
    )}s`,
  );
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

// Explicit keep-alive endpoint for external schedulers (Upstash QStash, cron,
// uptime monitors). Unlike /live, this deliberately touches Postgres so a
// paused/idle database is kept active. Point the scheduler at this URL.
app.get(["/keepalive", "/api/keepalive"], async (req, res) => {
  if (!isKeepAliveAuthorized(req)) {
    return res.status(401).json({ status: "unauthorized" });
  }

  const databaseOk = await withTimeout(prisma.$queryRaw`SELECT 1`, 5000)
    .then(() => true)
    .catch(() => false);

  return res.status(databaseOk ? 200 : 503).json({
    status: databaseOk ? "ok" : "degraded",
    message: databaseOk
      ? "Database keep-alive succeeded"
      : "Database keep-alive failed",
    checks: { database: databaseOk },
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    name: "Planex Backend API",
    status: "running",
    healthEndpoint: "/health",
    timestamp: new Date().toISOString(),
  });
});

// Job status polling is a deliberately frequent, per-user operation. It has
// its own limiter on the route so multiple tabs do not exhaust the global
// IP-based bucket and produce false 429s.
const JOB_STATUS_PATH = /^\/jobs\/[^/]+\/?$/;

app.use((req, res, next) => {
  const isAuthenticatedJobPoll =
    req.method === "GET" &&
    JOB_STATUS_PATH.test(req.path) &&
    Boolean(req.headers.authorization?.startsWith("Bearer "));

  if (isAuthenticatedJobPoll) {
    return next();
  }

  return globalLimiter(req, res, next);
});

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
  startDatabaseKeepAlive();
});
