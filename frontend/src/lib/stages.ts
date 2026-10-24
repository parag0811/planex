export const WORKSPACE_STAGES = [
  {
    id: "idea",
    label: "Requirements",
    path: "idea",
    type: "IDEA",
    number: "01",
  },
  {
    id: "database",
    label: "Database",
    path: "database",
    type: "DATABASE",
    number: "02",
  },
  {
    id: "api",
    label: "API",
    path: "api",
    type: "API",
    number: "03",
  },
  {
    id: "folder",
    label: "Folder Structure",
    path: "folder",
    type: "FOLDER",
    number: "04",
  },
] as const;

export type WorkspaceStage = (typeof WORKSPACE_STAGES)[number];
export type WorkspaceStageId = WorkspaceStage["id"];

export const getStageFromPath = (
  pathname: string | null,
): WorkspaceStage | null => {
  if (!pathname) return null;
  const segment = pathname.split("/").filter(Boolean).pop();
  return WORKSPACE_STAGES.find((stage) => stage.path === segment) ?? null;
};
