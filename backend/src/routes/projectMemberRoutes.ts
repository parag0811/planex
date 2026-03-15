import { Router } from "express";
import { body } from "express-validator";
import isAuth from "../middleware/authMiddleware";
import { handleValidationErrors } from "../utils/validationErrors";
import {
  inviteMember,
  projectMembers,
  removeMember,
} from "../controllers/projectMemberController";

const memberValidation = [
  body("email")
    .notEmpty()
    .withMessage("Email address is required")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),

  body("role")
    .trim()
    .isIn(["EDITOR", "VIEWER"])
    .withMessage("Role must be EDITOR or VIEWER"),
];

const router = Router();

// invite member
router.post(
  "/projects/:projectId/members",
  isAuth,
  memberValidation,
  handleValidationErrors,
  inviteMember,
);

// fetch members list
router.get("/projects/:projectId/members", isAuth, projectMembers);

// remove member
router.delete("/projects/:projectId/members/:memberId", isAuth, removeMember)

export default router;