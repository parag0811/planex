import { Request, Response, NextFunction } from "express";
import { ApiError } from "../../controllers/projectController";
import { chatService } from "./chatService";

export type Section = "idea" | "database" | "api" | "folder" | "none";

export const chatController = async (
  req: Request<
    { projectId: string },
    {},
    { message: string; context: { section: Section } }
  >,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { projectId } = req.params;
    const { message, context } = req.body;

    if (!message) {
      const error = new Error("Message is required.") as ApiError;
      error.status = 422;
      throw error;
    }

    const result = await chatService({
      projectId,
      message,
      context,
    });

    return res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
};
