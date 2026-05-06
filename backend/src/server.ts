import express from "express";
import cors from "cors";
import passport from "./modules/auth/passport-auth/passport";
import authRoutes from "./modules/auth/auth.route";
import projectRoutes from "./modules/project/project.route";
import sectionRoutes from "./modules/project-sections/section.routes";
import jobsRoutes from "./modules/jobs/jobs.route";
import errorHandler from "./middleware/error.middleware";
import { aiWorker } from "./modules/queues/aiWorker";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(passport.initialize());
app.use("/auth", authRoutes);
app.use("/projects", projectRoutes);
app.use("/projects", sectionRoutes);
app.use("/jobs", jobsRoutes);

app.use(errorHandler);

// Initialize Bull Queue Worker
console.log("🚀 Starting AI Queue Worker...");
aiWorker.on("error", (error) => {
  console.error("❌ Worker Error:", error);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`✅ AI Queue Worker is active and listening for jobs`);
});
