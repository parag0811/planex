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
import passport from "passport";

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

router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
    session: false,
  }),
);

router.get(
  "/github/callback",
  passport.authenticate("github", { session: false }),
  githubAuthController,
  (err: AppError, req: Request, res: Response, next: NextFunction) => {
    next(err);
  },
);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  googleAuthController,
   (err: AppError, req: Request, res: Response, next: NextFunction) => {
    next(err);
  },
);

export default router;
