import { z } from "zod";

/**
 * The editor shape matches the normalized backend folder contract:
 * { root: [{ name, type, children? }] }.
 */

export type FolderNode = {
  name: string;
  type: "folder" | "file";
  children?: FolderNode[];
};

const FolderNodeSchema: z.ZodType<FolderNode> = z.lazy(() =>
  z.object({
    name: z.string().transform((value) => value.trim()),
    type: z.enum(["folder", "file"]),
    children: z.array(FolderNodeSchema).optional(),
  }),
);

export const FolderContentSchema = z.object({
  root: z.array(FolderNodeSchema),
});

export type FolderContent = z.infer<typeof FolderContentSchema>;

const validateNodes = (
  nodes: FolderNode[],
  path: (string | number)[],
  ctx: z.RefinementCtx,
) => {
  const siblingNames = new Set<string>();

  nodes.forEach((node, index) => {
    const nodePath = [...path, index];

    if (!node.name.trim()) {
      ctx.addIssue({
        code: "custom",
        path: [...nodePath, "name"],
        message: "Add a name.",
      });
    } else {
      const key = node.name.trim().toLowerCase();
      if (siblingNames.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: [...nodePath, "name"],
          message: "Names must be unique at this level.",
        });
      } else {
        siblingNames.add(key);
      }
    }

    if (node.type === "file" && (node.children?.length ?? 0) > 0) {
      ctx.addIssue({
        code: "custom",
        path: [...nodePath, "children"],
        message: "Files cannot contain children.",
      });
    }

    if (node.children && node.children.length > 0) {
      validateNodes(node.children, [...nodePath, "children"], ctx);
    }
  });
};

export const FolderEditorSchema = FolderContentSchema.superRefine(
  (value, ctx) => {
    if (value.root.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["root"],
        message: "Add at least one file or folder.",
      });
    }

    validateNodes(value.root, ["root"], ctx);
  },
);

export type FolderFieldErrors = Record<string, string>;

export const getFolderFieldErrors = (error: z.ZodError): FolderFieldErrors => {
  const errors: FolderFieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !errors[key]) {
      errors[key] = issue.message;
    }
  }

  return errors;
};
