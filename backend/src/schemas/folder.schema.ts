import { z } from "zod";

type FolderNode = {
  name: string;
  type: "folder" | "file";
  children?: FolderNode[] | undefined;
};

const FolderNodeType = z.union([
  z.enum(["folder", "file"]),
  z.string().transform((s) => {
    const lower = s.toLowerCase();
    if (
      lower.includes("dir") ||
      lower.includes("folder") ||
      lower.includes("mod") ||
      lower.includes("pkg")
    ) {
      return "folder" as const;
    }
    return "file" as const;
  }),
]);

const FolderNodeSchema: z.ZodType<FolderNode> = z.lazy(() =>
  z
    .object({
      name: z.string().optional(),
      path: z.string().optional(),
      type: FolderNodeType.optional().default("file"),
      children: z
        .array(FolderNodeSchema)
        .nullable()
        .optional()
        .transform((c) => (c === null ? undefined : c)),
    })
    .transform((val) => ({
      name: val.name || val.path || "unnamed",
      type: val.type,
      children: val.children,
    })),
);

const FolderSectionContentSchema = z.union([
  z.object({
    root: z.array(FolderNodeSchema),
  }),
  z.object({
    structure: z.array(FolderNodeSchema),
  }).transform((val) => ({ root: val.structure })),
  z.object({
    tree: z.array(FolderNodeSchema),
  }).transform((val) => ({ root: val.tree })),
  z.object({
    folders: z.array(FolderNodeSchema),
  }).transform((val) => ({ root: val.folders })),
  z.object({
    files: z.array(FolderNodeSchema),
  }).transform((val) => ({ root: val.files })),
  z.array(FolderNodeSchema).transform((val) => ({ root: val })),
]);

const FolderPromptOptionsSchema = z.object({
  isRegenerating: z.boolean().optional(),
  regenerationSeed: z.string().optional(),
  instruction: z.string().optional(),
});

export {
  FolderNodeSchema,
  FolderSectionContentSchema,
  FolderPromptOptionsSchema,
};
