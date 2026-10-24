export interface FolderNode {
  name: string;
  type: "folder" | "file";
  children?: FolderNode[];
}

export interface FolderContent {
  root: FolderNode[];
}

export const EMPTY_FOLDER: FolderContent = { root: [] };

const normalizeNode = (value: unknown): FolderNode | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const name =
    typeof record.name === "string"
      ? record.name
      : typeof record.path === "string"
        ? record.path
        : "";
  if (!name) return null;

  const children = Array.isArray(record.children)
    ? record.children
        .map(normalizeNode)
        .filter((node): node is FolderNode => node !== null)
    : undefined;

  const type =
    record.type === "folder" || record.type === "file"
      ? record.type
      : children && children.length > 0
        ? "folder"
        : "file";

  return {
    name: name.replace(/\/$/, ""),
    type,
    ...(children && children.length > 0 ? { children } : {}),
  };
};

export const normalizeFolder = (payload: unknown): FolderContent => {
  const source =
    payload &&
    typeof payload === "object" &&
    "content" in (payload as Record<string, unknown>) &&
    (payload as Record<string, unknown>).content
      ? ((payload as Record<string, unknown>).content as Record<string, unknown>)
      : ((payload ?? {}) as Record<string, unknown>);

  const candidate = Array.isArray(source)
    ? source
    : source.root ?? source.structure ?? source.tree ?? source.folders ?? source.files;

  const root = Array.isArray(candidate)
    ? candidate
        .map(normalizeNode)
        .filter((node): node is FolderNode => node !== null)
    : [];

  return { root };
};

export const countFolderNodes = (nodes: FolderNode[]) => {
  let folders = 0;
  let files = 0;

  const walk = (items: FolderNode[]) => {
    items.forEach((node) => {
      if (node.type === "folder") folders += 1;
      else files += 1;
      if (node.children) walk(node.children);
    });
  };

  walk(nodes);
  return { folders, files };
};

export const serializeFolder = (
  nodes: FolderNode[],
  depth = 0,
): string =>
  nodes
    .map((node) => {
      const indent = "  ".repeat(depth);
      const suffix = node.type === "folder" ? "/" : "";
      const line = `${indent}${node.name}${suffix}`;
      return node.children && node.children.length > 0
        ? `${line}\n${serializeFolder(node.children, depth + 1)}`
        : line;
    })
    .join("\n");

export const parseFolder = (text: string): FolderContent => {
  const root: FolderNode[] = [];
  const stack: Array<{ depth: number; node: FolderNode }> = [];

  text.split("\n").forEach((raw) => {
    if (!raw.trim()) return;

    const indentation = raw.match(/^\s*/)?.[0].length ?? 0;
    const depth = Math.floor(indentation / 2);
    const trimmed = raw.trim();
    const isFolder = trimmed.endsWith("/");
    const name = trimmed.replace(/\/$/, "");
    if (!name) return;

    const node: FolderNode = {
      name,
      type: isFolder ? "folder" : "file",
      ...(isFolder ? { children: [] } : {}),
    };

    while (stack.length > 0 && stack[stack.length - 1]!.depth >= depth) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];
    if (parent) {
      parent.node.children = parent.node.children ?? [];
      parent.node.children.push(node);
    } else {
      root.push(node);
    }

    if (isFolder) stack.push({ depth, node });
  });

  return { root };
};
