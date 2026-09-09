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

const app = express();

app.set("trust proxy", 1); // Gives real user IP

const parseAllowedOrigins = (): string[] => {
  const envOrigins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((url) => url.trim().replace(/\/$/, ""))
    .filter(Boolean);

  return [
    ...envOrigins,
    "http://localhost:3000",
    "http://localhost:5173",
  ];
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const origins = parseAllowedOrigins();
      const isAllowed =
        origins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.includes("localhost");

      if (isAllowed) {
        callback(null, true);
      } else {
        // Return null, false to reject CORS cleanly without throwing a 500 server crash
        callback(null, false);
      }
    },
    credentials: true,
  }),
);

// Health check endpoints for Render, Cron, and Uptime monitors (placed BEFORE rate-limiting)
app.get(["/health", "/api/health"], (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Planex Backend is healthy and operational",
    uptimeSeconds: Math.floor(process.uptime()),
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
