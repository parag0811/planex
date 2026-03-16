import { Router } from "express";
import { body } from "express-validator";
import isAuth from "../middleware/authMiddleware";
import { handleValidationErrors } from "../utils/validationErrors";
import {
  updateProjectMemberRole,
  removProjectMember,
} from "../controllers/projectMemberController";
import { projectAccess } from "../middleware/project-middleware/projectAccess";
import { ownerAccess } from "../middleware/project-middleware/ownerAccess";

const memberRoleValidation = [
  body("role")
    .trim()
    .isIn(["EDITOR", "VIEWER"])
    .withMessage("Role must be EDITOR or VIEWER"),
];

const router = Router();

// remove member
router.delete(
  "/projects/:projectId/members/:memberId",
  isAuth,
  projectAccess,
  ownerAccess,
  removProjectMember,
);

// update role
router.patch(
  "/projects/:projectId/members/:memberId/role",
  isAuth,
  memberRoleValidation,
  handleValidationErrors,
  projectAccess,
  ownerAccess,
  updateProjectMemberRole,
);

export default router;
