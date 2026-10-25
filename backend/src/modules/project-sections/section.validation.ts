import { z, type ZodType } from "zod";
import { TYPES } from "../../generated/prisma/enums";
import { IdeaSectionContentSchema } from "../../schemas/idea.schema";
import { DatabaseSectionContentSchema } from "../../schemas/database.schema";
import { ApiSectionContentSchema } from "../../schemas/api.schema";
import { FolderSectionContentSchema } from "../../schemas/folder.schema";

const SECTION_SCHEMAS: Record<TYPES, ZodType> = {
  [TYPES.IDEA]: IdeaSectionContentSchema,
  [TYPES.DATABASE]: DatabaseSectionContentSchema,
  [TYPES.API]: ApiSectionContentSchema,
  [TYPES.FOLDER]: FolderSectionContentSchema,
};

export const validateSectionContent = (type: TYPES, content: unknown) => {
  const schema = SECTION_SCHEMAS[type];

  if (!schema) {
    throw new Error(`Unsupported section type: ${type}`);
  }

  return schema.safeParse(content);
};

export const getSectionFieldErrors = (
  error: z.ZodError,
): Record<string, string> => {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !errors[key]) {
      errors[key] = issue.message;
    }
  }

  return errors;
};
