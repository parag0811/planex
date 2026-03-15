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
} from "../controllers/projectController";
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

router.post(
  "/create-project",
  isAuth,
  projectValidation,
  handleValidationErrors,
  createProject,
);

router.get("/:projectId", isAuth, getProjects);

router.put(
  "/:projectId/update-project",
  isAuth,
  projectAccess,
  ownerAccess,
  projectValidation,
  handleValidationErrors,
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
  projectAccess,
  ownerAccess,
  createProjectInviteLink
);

router.post("/join/:token", joinProjectByInvite);

export default router;
