import { Request, Response, NextFunction } from "express";

interface ApiError extends Error {
  status?: number;
}

export const ownerAccess = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const project = req.project;
  const userId = req.user?.id;

  if (project.owner_id !== userId) {
    const error = new Error("Only owner allowed") as ApiError;
    error.status = 403;
    return next(error);
  }

  next();
};
