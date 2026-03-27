import { Request, Response, NextFunction } from "express";

export const ownerAccess = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const project = req.project;
  const userId = req.user?.id;

  if (project.owner_id !== userId) {
    const error = new Error(
      "Only owner is allowed to perform this action",
    ) as AppError;
    error.status = 403;
    return next(error);
  }

  next();
};
