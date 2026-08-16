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

const allowedOrigins = [
  process.env.FRONTEND_URL?.trim().replace(/\/$/, ""),
  "http://localhost:3000",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

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
