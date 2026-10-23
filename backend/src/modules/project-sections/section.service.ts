import prisma from "../../db/prisma";
import { getJsonCache, setJsonCache } from "../../db/cache";
import { TYPES } from "../../generated/prisma/enums";

const SECTION_CACHE_TTL_SECONDS = 86400; // 24 hours cache to minimize Redis write operations

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
  const cached = await getJsonCache<any>(cacheKey);
  if (cached) {
    return cached;
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
      await setJsonCache(cacheKey, section, SECTION_CACHE_TTL_SECONDS);
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
  await setJsonCache(cacheKey, section, SECTION_CACHE_TTL_SECONDS);

  return section;
};
