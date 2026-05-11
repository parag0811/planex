/**
 * Utility functions to apply AI-suggested changes to section forms
 */

import type { DatabaseSectionContent } from "@/src/app/(dashboard)/projects/[projectId]/database/page";

/**
 * Deep merge AI content with current form state
 * Preserves existing data and only updates what was explicitly changed
 */
export function mergeChanges<T extends Record<string, any>>(
  current: T,
  suggested: Partial<T>,
): T {
  return {
    ...current,
    ...suggested,
  };
}

/**
 * Apply database section changes to the current schema
 */
export function applyDatabaseChanges(
  currentSchema: DatabaseSectionContent,
  suggestedContent: Partial<DatabaseSectionContent>,
): DatabaseSectionContent {
  return {
    entities: suggestedContent.entities ?? currentSchema.entities,
    relationships: suggestedContent.relationships ?? currentSchema.relationships,
    indexes: suggestedContent.indexes ?? currentSchema.indexes,
  };
}

/**
 * Apply idea section changes
 */
export function applyIdeaChanges(
  currentIdea: any,
  suggestedContent: any,
): any {
  return {
    ...currentIdea,
    ...suggestedContent,
  };
}

/**
 * Apply API section changes
 */
export function applyApiChanges(
  currentApi: any,
  suggestedContent: any,
): any {
  return {
    ...currentApi,
    ...suggestedContent,
  };
}

/**
 * Apply folder section changes
 */
export function applyFolderChanges(
  currentFolder: any,
  suggestedContent: any,
): any {
  return {
    ...currentFolder,
    ...suggestedContent,
  };
}

/**
 * Route changes to the appropriate applier based on section type
 */
export function applyChangesToSection(
  sectionType: "idea" | "database" | "api" | "folder",
  currentContent: any,
  suggestedContent: any,
): any {
  switch (sectionType.toLowerCase()) {
    case "database":
      return applyDatabaseChanges(currentContent, suggestedContent);
    case "idea":
      return applyIdeaChanges(currentContent, suggestedContent);
    case "api":
      return applyApiChanges(currentContent, suggestedContent);
    case "folder":
      return applyFolderChanges(currentContent, suggestedContent);
    default:
      return mergeChanges(currentContent, suggestedContent);
  }
}

/**
 * Validate that the applied changes are valid for the section type
 */
export function isValidChange(
  sectionType: string,
  content: any,
): boolean {
  if (!content || typeof content !== "object") {
    return false;
  }

  switch (sectionType.toLowerCase()) {
    case "database":
      // Should have entities array
      return Array.isArray(content.entities);
    case "idea":
      // Should have at least an overview field
      return typeof content.overview === "string" || content.overview !== undefined;
    case "api":
      // Should have endpoints or models
      return (
        Array.isArray(content.endpoints) ||
        Array.isArray(content.models) ||
        content.endpoints !== undefined ||
        content.models !== undefined
      );
    case "folder":
      // Should have a structure property
      return content.structure !== undefined || Array.isArray(content.directories);
    default:
      return true;
  }
}
