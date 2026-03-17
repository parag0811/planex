import { Router } from "express";
import isAuth from "../../middleware/authMiddleware";
import {
  getProjectSections,
  getSectionByType,
  upsertSection,
} from "./sectionController";
import { projectAccess } from "../../middleware/project-middleware/projectAccess";
import { memberAccess } from "../../middleware/project-middleware/memberAccess";
import { editorAccess } from "../../middleware/project-middleware/editorAccess";

const router = Router();

router.get(
  "/:projectId/sections",
  isAuth,
  projectAccess,
  memberAccess,
  getProjectSections,
);

router.get(
  "/:projectId/sections/:type",
  isAuth,
  projectAccess,
  memberAccess,
  getSectionByType,
);

router.put(
  "/:projectId/sections/:type",
  isAuth,
  projectAccess,
  editorAccess,
  upsertSection,
);

export default router;
