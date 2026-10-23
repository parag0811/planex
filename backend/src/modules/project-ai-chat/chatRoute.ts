import { Router } from "express";
import { body } from "express-validator";
import isAuth from "../../middleware/auth.middleware";
import { projectAccess } from "../../middleware/project-middleware/projectAccess";
import { editorAccess } from "../../middleware/project-middleware/editorAccess";
import { aiLimiter } from "../../middleware/rateLimit.middleware";
import { handleValidationErrors } from "../../utils/validationErrors";
import { chatController } from "../../modules/project-ai-chat/chatController";

const router = Router();

const MAX_CHAT_MESSAGE_LENGTH = 2000;
const CHAT_SECTIONS = ["idea", "database", "api", "folder", "none"];

const chatValidation = [
  body("message")
    .isString()
    .withMessage("Message must be a string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Message is required.")
    .bail()
    .isLength({ max: MAX_CHAT_MESSAGE_LENGTH })
    .withMessage(
      `Message must be ${MAX_CHAT_MESSAGE_LENGTH} characters or fewer.`,
    ),
  body("context")
    .optional()
    .isObject()
    .withMessage("Context must be an object."),
  body("context.section")
    .optional()
    .isIn(CHAT_SECTIONS)
    .withMessage("Invalid section context."),
];

router.post(
  "/:projectId/ai/chat",
  isAuth,
  aiLimiter,
  projectAccess,
  editorAccess,
  chatValidation,
  handleValidationErrors,
  chatController,
);

export default router;
