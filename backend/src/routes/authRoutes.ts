import { Router } from "express";
import { body } from "express-validator";
import {
  loginUser,
  registerUser,
  getUser,
  updateUser,
} from "../controllers/authController";
import isAuth from "../middleware/authMiddleware";
import { handleValidationErrors } from "../utils/validationErrors";
import { uploadAvatar } from "../middleware/upload";

const router = Router();

const registerValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .bail()
    .isEmail()
    .withMessage("Enter a valid email.")
    .normalizeEmail(),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required.")
    .bail()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters."),
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .bail()
    .isEmail()
    .withMessage("Enter a valid email.")
    .normalizeEmail(),
  body("password").trim().notEmpty().withMessage("Password is required."),
];

router.post(
  "/register",
  registerValidation,
  handleValidationErrors,
  registerUser,
);

router.post("/login", loginValidation, handleValidationErrors, loginUser);

router.get("/me", isAuth, getUser);

router.put("/me", isAuth, uploadAvatar, updateUser);

export default router;
