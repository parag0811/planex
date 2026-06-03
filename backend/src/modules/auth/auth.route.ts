import { Router } from "express";
import { Request, Response, NextFunction } from "express";
import { body } from "express-validator";
import {
  loginUser,
  registerUser,
  getUser,
  updateUser,
  githubAuthController,
  googleAuthController,
} from "./auth.controller";
import isAuth from "../../middleware/auth.middleware";
import { handleValidationErrors } from "../../utils/validationErrors";
import { uploadAvatar } from "../../middleware/upload";
import { authLimiter } from "../../middleware/rateLimit.middleware";
import passport from "passport";

const router = Router();

const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required.")
    .bail()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters."),
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

// If limit exceed controller never runs tho

router.post("/login", authLimiter, loginValidation, handleValidationErrors, loginUser);

router.get("/me", isAuth, getUser);

router.put("/me", isAuth, uploadAvatar, updateUser);

router.get(
  "/github",
  authLimiter,
  passport.authenticate("github", {
    scope: ["user:email"],
    session: false, // Start OAuth redirect (no server session, JWT only).
  }),
);

router.get(
  "/github/callback",
  passport.authenticate("github", { session: false }), // Handle provider callback.
  githubAuthController,
  (err: AppError, req: Request, res: Response, next: NextFunction) => {
    next(err);
  },
);

router.get(
  "/google",
  authLimiter,
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }), // Handle provider callback.
  googleAuthController,
   (err: AppError, req: Request, res: Response, next: NextFunction) => {
    next(err);
  },
);

export default router;
