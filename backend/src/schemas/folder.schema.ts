export interface FolderNode {
  name: string;
  type: "folder" | "file";
  children?: FolderNode[];
}

export interface FolderSectionContent {
  root: FolderNode[];
}

export interface FolderPromptOptions {
  isRegenerating?: boolean;
  regenerationSeed?: string;
  instruction?: string;
}
