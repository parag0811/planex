import prisma from "../../db/prisma";

export const logActivity = (
  projectId: string,
  userId: string | null,
  action: string,
  details: string | null = null,
) => {
  // Fire and forget
  prisma.projectActivity
    .create({
      data: {
        project_id: projectId,
        user_id: userId,
        action,
        details,
      },
    })
    .catch((error : any) => {
      console.error("Failed to log project activity:", error);
    });
};

export const getProjectActivitiesService = async (projectId: string) => {
  return prisma.projectActivity.findMany({
    where: { project_id: projectId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });
};
