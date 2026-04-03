import type { FileEntry } from "@axis/snapshots";
import type { ImportEdge } from "./types.js";

const IMPORT_PATTERNS = [
  /import\s+.*?\s+from\s+["'](\.[^"']+)["']/g,
  /import\s*\(\s*["'](\.[^"']+)["']\s*\)/g,
  /require\s*\(\s*["'](\.[^"']+)["']\s*\)/g,
];

export function extractImports(files: FileEntry[]): ImportEdge[] {
  const edges: ImportEdge[] = [];
  const filePaths = new Set(files.map((f) => f.path));

  for (const file of files) {
    if (!isSourceFile(file.path)) continue;

    for (const pattern of IMPORT_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match: RegExpExecArray | null;
      while ((match = regex.exec(file.content)) !== null) {
        const raw = match[1];
        const resolved = resolveImportPath(file.path, raw, filePaths);
        if (resolved) {
          edges.push({ source: file.path, target: resolved });
        }
      }
    }
  }

  return edges;
}

function isSourceFile(path: string): boolean {
  return /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs)$/.test(path);
}

function resolveImportPath(
  fromFile: string,
  importPath: string,
  knownFiles: Set<string>,
): string | null {
  const dir = fromFile.substring(0, fromFile.lastIndexOf("/"));
  const base = importPath.startsWith("./") || importPath.startsWith("../")
    ? normalizePath(dir + "/" + importPath)
    : importPath;

  const candidates = [
    base,
    base + ".ts",
    base + ".tsx",
    base + ".js",
    base + ".jsx",
    base + "/index.ts",
    base + "/index.tsx",
    base + "/index.js",
  ];

  for (const c of candidates) {
    if (knownFiles.has(c)) return c;
  }
  return null;
}

function normalizePath(p: string): string {
  const parts = p.split("/");
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === "." || part === "") continue;
    if (part === "..") {
      resolved.pop();
    } else {
      resolved.push(part);
    }
  }
  return resolved.join("/");
}
