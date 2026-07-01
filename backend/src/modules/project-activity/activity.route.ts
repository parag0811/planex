import { Router } from "express";
import isAuth from "../../middleware/auth.middleware";
import { projectAccess } from "../../middleware/project-middleware/projectAccess";
import { memberAccess } from "../../middleware/project-middleware/memberAccess";
import { getProjectActivities } from "./activity.controller";

const router = Router();

router.get(
  "/:projectId/activities",
  isAuth,
  projectAccess,
  memberAccess,
  getProjectActivities,
);

export default router;
