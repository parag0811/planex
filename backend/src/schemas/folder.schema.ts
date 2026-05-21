import { z } from "zod";

type FolderNode = {
  name: string;
  type: "folder" | "file";
  children?: FolderNode[] | undefined;
};

const FolderNodeSchema: z.ZodType<FolderNode> = z.lazy(() =>
  z.object({
    name: z.string(),
    type: z.enum(["folder", "file"]),
    children: z.array(FolderNodeSchema).optional(),
  }),
);

const FolderSectionContentSchema = z.object({
  root: z.array(FolderNodeSchema),
});

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
