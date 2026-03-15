import { Router } from "express";
import { body } from "express-validator";
import isAuth from "../middleware/authMiddleware";
import {
  createProject,
  deleteProject,
  fetchProjects,
  updateProject,
} from "../controllers/projectController";
import { handleValidationErrors } from "../utils/validationErrors";
import { loadProject } from "../middleware/project-middleware/projectAccess";
import { requireEditor } from "../middleware/project-middleware/editorAccess";
import { requireOwner } from "../middleware/project-middleware/ownerCheck";

const projectValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required.")
    .bail()
    .isLength({ min: 3, max: 50 })
    .withMessage("Must be between 3 and 50 characters"),
];

const router = Router();

router.post(
  "/create-project",
  isAuth,
  projectValidation,
  handleValidationErrors,
  createProject,
);

router.get("/:projectId", isAuth, fetchProjects);

router.put(
  "/:projectId/update-project",
  isAuth,
  loadProject,
  requireEditor,
  projectValidation,
  handleValidationErrors,
  updateProject,
);

router.delete(
  "/:projectId/delete-project",
  isAuth,
  loadProject,
  requireOwner,
  deleteProject,
);

export default router;
