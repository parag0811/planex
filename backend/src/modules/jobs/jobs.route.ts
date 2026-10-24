import { Router } from "express";
import isAuth from "../../middleware/auth.middleware";
import { jobStatusLimiter } from "../../middleware/rateLimit.middleware";
import { jobStatus, retryJob } from "./jobs.controller";

const router = Router()

router.get("/:jobId", isAuth, jobStatusLimiter, jobStatus)

router.post("/:jobId/retry", isAuth, retryJob)

export default router