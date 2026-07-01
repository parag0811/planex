import { Request, Response, NextFunction } from "express";
import { getProjectActivitiesService } from "./activity.service";

export const getProjectActivities = async (
  req: Request<{ projectId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { projectId } = req.params;
    const activities = await getProjectActivitiesService(projectId);

    return res.status(200).json({
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};
