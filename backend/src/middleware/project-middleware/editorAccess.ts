import { Request, Response, NextFunction } from "express";

interface ApiError extends Error {
  status?: number;
}

export const requireEditor = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const project = req.project;
  const membership = req.membership;
  const userId = req.user?.id;

  if (project.owner_id === userId) return next();

  if (!membership || membership.role !== "EDITOR") {
    const error = new Error("Editor permission required") as ApiError;
    error.status = 403;
    return next(error);
  }

  next();
};
