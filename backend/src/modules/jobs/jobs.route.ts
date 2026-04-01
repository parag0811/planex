import { Router } from "express";
import isAuth from "../../middleware/auth.middleware";
import { jobStatus, retryJob } from "./jobs.controller";

const router = Router()

router.get("/:jobId", isAuth, jobStatus)

router.post("/jobs/:jobId/retry", isAuth, retryJob)

export default router