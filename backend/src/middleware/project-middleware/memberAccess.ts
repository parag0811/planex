import { Request, Response, NextFunction } from "express";

interface ApiError extends Error {
  status?: number;
}

export const requireMember = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const project = req.project;
  const membership = req.membership;
  const userId = req.user?.id;

  if (project.owner_id === userId) return next();
  if (membership) return next();

  const error = new Error("Project access denied") as ApiError;
  error.status = 403;
  next(error);
};
