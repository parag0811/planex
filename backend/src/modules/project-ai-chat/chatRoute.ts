import { Router } from "express";
import isAuth from "../../middleware/auth.middleware";
import { projectAccess } from "../../middleware/project-middleware/projectAccess";
import { editorAccess } from "../../middleware/project-middleware/editorAccess";
import { chatController } from "../../modules/project-ai-chat/chatController";

const router = Router();

router.post(
  "/:projectId/ai/chat",
  isAuth,
  projectAccess,
  editorAccess,
  chatController,
);

export default router;