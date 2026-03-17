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
import { body } from "express-validator";
import { handleValidationErrors } from "../../utils/validationErrors";

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

const ideaValidation = [
  body("idea")
    .trim()
    .notEmpty()
    .withMessage("Idea can not be empty.")
    .bail()
    .isLength({ min: 10, max: 250 })
    .withMessage("Idea must be within 10-250 characters.")
    .bail(),
];

router.post(
  "/:projectId/ai/generate-idea",
  isAuth,
  projectAccess,
  editorAccess,
  ideaValidation,
  handleValidationErrors
);

export default router;
