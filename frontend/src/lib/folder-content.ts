import type { FolderContent, FolderNode } from "./schemas/folder.schema";

export type { FolderContent, FolderNode } from "./schemas/folder.schema";

export const EMPTY_FOLDER: FolderContent = { root: [] };

const normalizeType = (
  value: unknown,
  children: FolderNode[] | undefined,
): FolderNode["type"] => {
  if (value === "folder" || value === "file") return value;

  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (
      lower.includes("dir") ||
      lower.includes("folder") ||
      lower.includes("mod") ||
      lower.includes("pkg")
    ) {
      return "folder";
    }
    return "file";
  }

  // Missing type: keep the historical inference so a node with children is
  // still editable as a folder.
  return children && children.length > 0 ? "folder" : "file";
};

const normalizeNode = (value: unknown): FolderNode | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const rawName =
    typeof record.name === "string"
      ? record.name
      : typeof record.path === "string"
        ? record.path
        : "";
  const name = rawName || "unnamed";

  const children = Array.isArray(record.children)
    ? record.children
        .map(normalizeNode)
        .filter((node): node is FolderNode => node !== null)
    : undefined;

  return {
    name: name.replace(/\/$/, ""),
    type: normalizeType(record.type, children),
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

export const getFolderChildren = (
  nodes: FolderNode[],
  path: number[],
): FolderNode[] => {
  if (path.length === 0) return nodes;

  const [index, ...rest] = path;
  const node = index === undefined ? undefined : nodes[index];
  if (!node) return [];

  return getFolderChildren(node.children ?? [], rest);
};

export const uniqueFolderName = (
  siblings: FolderNode[],
  base: string,
): string => {
  const existing = new Set(
    siblings.map((node) => node.name.trim().toLowerCase()),
  );
  if (!existing.has(base.toLowerCase())) return base;

  let suffix = 2;
  while (existing.has(`${base}-${suffix}`.toLowerCase())) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
};

export const addFolderNode = (
  nodes: FolderNode[],
  parentPath: number[],
  node: FolderNode,
): FolderNode[] => {
  if (parentPath.length === 0) return [...nodes, node];

  const [index, ...rest] = parentPath;

  return nodes.map((item, itemIndex) => {
    if (itemIndex !== index || item.type !== "folder") return item;

    return {
      ...item,
      children: addFolderNode(item.children ?? [], rest, node),
    };
  });
};

export const renameFolderNode = (
  nodes: FolderNode[],
  path: number[],
  name: string,
): FolderNode[] => {
  if (path.length === 0) return nodes;

  const [index, ...rest] = path;

  return nodes.map((item, itemIndex) => {
    if (itemIndex !== index) return item;

    if (rest.length === 0) {
      return { ...item, name };
    }

    return {
      ...item,
      children: renameFolderNode(item.children ?? [], rest, name),
    };
  });
};

export const removeFolderNode = (
  nodes: FolderNode[],
  path: number[],
): FolderNode[] => {
  if (path.length === 0) return nodes;

  const [index, ...rest] = path;

  if (rest.length === 0) {
    return nodes.filter((_, itemIndex) => itemIndex !== index);
  }

  return nodes.map((item, itemIndex) => {
    if (itemIndex !== index) return item;

    return {
      ...item,
      children: removeFolderNode(item.children ?? [], rest),
    };
  });
};
