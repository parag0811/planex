import prisma from "../../db/prisma";
import redis from "../../db/redis";
import { TYPES } from "../../generated/prisma/enums";

const SECTION_CACHE_TTL_SECONDS = 600;

export const getProjectSectionsService = async (projectId: string) => {
  return prisma.projectSection.findMany({
    where: { project_id: projectId },
  });
};

export const getSectionByTypeService = async (
  projectId: string,
  type: TYPES,
) => {
  const cacheKey = `section:${projectId}:${type}`;

  // 1. Check Redis cache first (instant response, immune to DB cold-starts)
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    // Non-blocking Redis failure, continue to database
  }

  // 2. Query Prisma database
  try {
    const section = await prisma.projectSection.findUnique({
      where: {
        project_id_type: {
          project_id: projectId,
          type,
        },
      },
    });

    // 3. Populate Redis cache if found
    if (section) {
      try {
        await redis.set(
          cacheKey,
          JSON.stringify(section),
          "EX",
          SECTION_CACHE_TTL_SECONDS,
        );
      } catch (error) {
        // Non-blocking Redis failure
      }
    }

    return section;
  } catch (dbError: any) {
    console.error(
      `⚠️ [Prisma] getSectionByTypeService error for ${projectId}:${type}:`,
      dbError?.message || String(dbError),
    );
    const appErr = new Error(
      "Database connection is momentarily warming up. Please try again in a moment.",
    ) as any;
    appErr.status = 503;
    throw appErr;
  }
};

export const upsertSectionService = async (
  projectId: string,
  type: TYPES,
  content: any,
) => {
  const section = await prisma.projectSection.upsert({
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

  // Update Redis cache immediately
  const cacheKey = `section:${projectId}:${type}`;
  try {
    await redis.set(
      cacheKey,
      JSON.stringify(section),
      "EX",
      SECTION_CACHE_TTL_SECONDS,
    );
  } catch (error) {
    // Non-blocking Redis failure
  }

  return section;
};
