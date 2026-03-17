import { Request, Response, NextFunction } from "express";
import prisma from "../../db/prisma";
import {
  getProjectSectionsService,
  getSectionByTypeService,
  upsertSectionService,
} from "./sectionService";
import { TYPES } from "../../generated/prisma/enums";

export const getProjectSections = async (
  req: Request<{ projectId: string }, {}, {}>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { projectId } = req.params;

    const sections = await getProjectSectionsService(projectId);

    return res.status(200).json({ data: sections });
  } catch (error) {
    next(error);
  }
};

export const getSectionByType = async (
  req: Request<{ projectId: string; type: TYPES }, {}, {}>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { projectId, type } = req.params;

    const section = await getSectionByTypeService(projectId, type as TYPES);

    return res.status(200).json({
      data: section,
    });
  } catch (err) {
    next(err);
  }
};

export const upsertSection = async (
  req: Request<{ projectId: string; type: TYPES }, {}, { content: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { projectId, type } = req.params;
    const { content } = req.body;

    const section = await upsertSectionService(
      projectId,
      type as TYPES,
      content,
    );

    return res.status(200).json({
      data: section,
    });
  } catch (err) {
    next(err);
  }
};
