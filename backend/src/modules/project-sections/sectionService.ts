import prisma from "../../db/prisma";
import { TYPES } from "../../generated/prisma/enums";

export const getProjectSectionsService = async (projectId: string) => {
  return prisma.projectSection.findMany({
    where: { project_id: projectId },
  });
};

export const getSectionByTypeService = async (
  projectId: string,
  type: TYPES,
) => {
  return prisma.projectSection.findUnique({
    where: {
      project_id_type: {
        project_id: projectId,
        type,
      },
    },
  });
};

export const upsertSectionService = async (
  projectId: string,
  type: TYPES,
  content: any,
) => {
  return prisma.projectSection.upsert({
    where: {
      project_id_type: {
        project_id: projectId,
        type,
      },
    },
    create: {
      project_id: projectId,
      type,
      content,
    },
    update: {
      content,
      version: { increment: 1 },
    },
  });
};
