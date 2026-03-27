import { Router } from "express";
import { body } from "express-validator";
import isAuth from "../middleware/authMiddleware";
import {
  createProject,
  createProjectInviteLink,
  deleteProject,
  getProjects,
  joinProjectByInvite,
  updateProject,
  getProjectById,
  regenerateInviteLink,
} from "../controllers/project.controller";
import { handleValidationErrors } from "../utils/validationErrors";
import { projectAccess } from "../middleware/project-middleware/projectAccess";
import { editorAccess } from "../middleware/project-middleware/editorAccess";
import { ownerAccess } from "../middleware/project-middleware/ownerAccess";

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

router.get("/", isAuth, getProjects);

router.get("/:projectId", isAuth, projectAccess, getProjectById);

router.post(
  "/create-project",
  isAuth,
  projectValidation,
  handleValidationErrors,
  createProject,
);

router.put(
  "/:projectId/update-project",
  isAuth,
  projectValidation,
  handleValidationErrors,
  projectAccess,
  editorAccess,
  updateProject,
);

router.delete(
  "/:projectId/delete-project",
  isAuth,
  projectAccess,
  ownerAccess,
  deleteProject,
);

router.post(
  "/:projectId/invite-link",
  isAuth,
  projectAccess,
  ownerAccess,
  createProjectInviteLink,
);

router.post(
  "/:projectId/regenerate-invite-link",
  isAuth,
  projectAccess,
  ownerAccess,
  regenerateInviteLink,
);

router.post("/join/:token", isAuth, joinProjectByInvite);

export default router;
