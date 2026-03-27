import { Router } from "express";
import isAuth from "../../middleware/auth.middleware";
import {
  generateApiSuggestion,
  generateDatabaseSuggestion,
  generateFolderSuggestion,
  generateIdeaSection,
  getProjectSections,
  getSectionByType,
  regenerateSection,
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
  handleValidationErrors,
  generateIdeaSection,
);

router.post(
  "/:projectId/ai/generate-database",
  isAuth,
  projectAccess,
  editorAccess,
  generateDatabaseSuggestion,
);

router.post(
  "/:projectId/ai/generate-api",
  isAuth,
  projectAccess,
  editorAccess,
  generateApiSuggestion,
);

router.post(
  "/:projectId/ai/generate-folders",
  isAuth,
  projectAccess,
  editorAccess,
  generateFolderSuggestion,
);

router.post(
  " /:projectId/ai/regenerate/:section",
  isAuth,
  projectAccess,
  editorAccess,
  regenerateSection
)

export default router;
