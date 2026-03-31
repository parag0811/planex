import { Router } from "express";
import isAuth from "../../middleware/auth.middleware";
import { jobStatus } from "./jobs.controller";

const router = Router()

router.get("/:jobId", isAuth, jobStatus)

export default router