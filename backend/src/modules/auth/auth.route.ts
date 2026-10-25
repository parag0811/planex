import crypto from "crypto";
import { Router, Request, Response, NextFunction } from "express";
import { body } from "express-validator";
import {
  loginUser,
  registerUser,
  getUser,
  updateUser,
  generateRecoveryCode,
  resetPassword,
  githubAuthController,
  googleAuthController,
} from "./auth.controller";
import isAuth from "../../middleware/auth.middleware";
import { handleValidationErrors } from "../../utils/validationErrors";
import { uploadAvatar } from "../../middleware/upload";
import { authLimiter } from "../../middleware/rateLimit.middleware";
import { normalizeEmailAddress } from "../../utils/email";
import passport from "passport";

const router = Router();

const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;
const oauthStateCookie = (provider: "google" | "github") =>
  `planex_oauth_state_${provider}`;

const getCookie = (req: Request, name: string): string | undefined => {
  const header = req.headers.cookie;

  if (!header) return undefined;

  for (const part of header.split(";")) {
    const [key, ...valueParts] = part.trim().split("=");

    if (key === name) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return undefined;
};

const statesMatch = (expected: string, received: string): boolean => {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
};

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/auth",
});

const startOAuth =
  (
    provider: "google" | "github",
    options: passport.AuthenticateOptions,
  ) =>
  (req: Request, res: Response, next: NextFunction) => {
    const state = crypto.randomBytes(32).toString("hex");

    res.cookie(oauthStateCookie(provider), state, {
      ...cookieOptions(),
      maxAge: OAUTH_STATE_MAX_AGE_MS,
    });

    passport.authenticate(provider, { ...options, state })(req, res, next);
  };

const validateOAuthState =
  (provider: "google" | "github") =>
  (req: Request, res: Response, next: NextFunction) => {
    const cookieName = oauthStateCookie(provider);
    const expected = getCookie(req, cookieName);
    const received =
      typeof req.query.state === "string" ? req.query.state : "";

    res.clearCookie(cookieName, cookieOptions());

    if (!expected || !received || !statesMatch(expected, received)) {
      const error = new Error(
        "Social login session expired. Please try again.",
      ) as AppError;
      error.status = 403;
      return next(error);
    }

    next();
  };

const finishOAuth =
  (provider: "google" | "github") =>
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      provider,
      { session: false },
      (
        error: unknown,
        user: Express.User | false | null | undefined,
        info: unknown,
      ) => {
        if (error) return next(error);

        if (!user) {
          const authError = new Error(
            typeof info === "string"
              ? info
              : "Social login was cancelled or failed. Please try again.",
          ) as AppError;
          authError.status = 400;
          return next(authError);
        }

        req.user = user;
        next();
      },
    )(req, res, next);
  };

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
    .customSanitizer(normalizeEmailAddress),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required.")
    .bail()
    .isLength({ min: 12 })
    .withMessage("Password must be at least 12 characters.")
    .bail()
    .matches(/\d/)
    .withMessage("Password must include at least one number."),
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .bail()
    .isEmail()
    .withMessage("Enter a valid email.")
    .customSanitizer(normalizeEmailAddress),
  body("password").trim().notEmpty().withMessage("Password is required."),
];

const resetPasswordValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .bail()
    .isEmail()
    .withMessage("Enter a valid email.")
    .customSanitizer(normalizeEmailAddress),
  body("recoveryCode")
    .trim()
    .notEmpty()
    .withMessage("Recovery code is required.")
    .bail()
    .isLength({ min: 8, max: 64 })
    .withMessage("Recovery code is invalid."),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required.")
    .bail()
    .isLength({ min: 12 })
    .withMessage("Password must be at least 12 characters.")
    .bail()
    .matches(/\d/)
    .withMessage("Password must include at least one number."),
];

router.post(
  "/register",
  registerValidation,
  handleValidationErrors,
  registerUser,
);

router.post(
  "/login",
  authLimiter,
  loginValidation,
  handleValidationErrors,
  loginUser,
);

router.post(
  "/reset-password",
  authLimiter,
  resetPasswordValidation,
  handleValidationErrors,
  resetPassword,
);

router.post("/recovery-code", isAuth, authLimiter, generateRecoveryCode);

router.get("/me", isAuth, getUser);

router.put("/me", isAuth, uploadAvatar, updateUser);

router.get(
  "/github",
  authLimiter,
  startOAuth("github", {
    scope: ["user:email"],
    session: false,
  }),
);

router.get(
  "/github/callback",
  validateOAuthState("github"),
  finishOAuth("github"),
  githubAuthController,
);

router.get(
  "/google",
  authLimiter,
  startOAuth("google", {
    scope: ["profile", "email"],
    session: false,
    prompt: "select_account",
  }),
);

router.get(
  "/google/callback",
  validateOAuthState("google"),
  finishOAuth("google"),
  googleAuthController,
);

export default router;
