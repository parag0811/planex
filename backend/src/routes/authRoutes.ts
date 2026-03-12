import { Router } from "express";
import {
  loginUser,
  registerUser,
  getUser,
} from "../controllers/authController";
import isAuth from "../middleware/authMiddleware";

const router = Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/me", isAuth, getUser);

export default router;
