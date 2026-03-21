import { Router } from "express";
import isAuth from "../../middleware/authMiddleware";
import { projectAccess } from "../../middleware/project-middleware/projectAccess";
import { editorAccess } from "../../middleware/project-middleware/editorAccess";
import { chatController } from "./chatController";
import { getJobStatus } from "../../queues/aiQueue";

const router = Router();

router.post(
  "/:projectId/ai/chat",
  isAuth,
  projectAccess,
  editorAccess,
  chatController,
);

router.get(
  "/ai/job/:jobId",
  getJobStatus
)

export default router