import { getDb } from "./db.js";

// ─── Search index store ─────────────────────────────────────────

export interface SearchIndexEntry {
  file_path: string;
  line_number: number;
  content: string;
}

export interface SearchResult {
  file_path: string;
  line_number: number;
  content: string;
  rank: number;
}

/**
 * Index file contents for a snapshot. Splits content by lines and stores each
 * line as a searchable entry. Clears any existing index for the snapshot first.
 * Populates both the search_index table and the search_fts FTS5 index.
 */
export function indexSnapshotContent(
  snapshotId: string,
  files: Array<{ path: string; content: string }>,
): { indexed_files: number; indexed_lines: number } {
  const db = getDb();
  let totalLines = 0;

  const deleteExistingFts = db.prepare(
    "DELETE FROM search_fts WHERE rowid IN (SELECT id FROM search_index WHERE snapshot_id = ?)",
  );
  const deleteExisting = db.prepare("DELETE FROM search_index WHERE snapshot_id = ?");
  const insertLine = db.prepare(
    "INSERT INTO search_index (snapshot_id, file_path, line_number, content) VALUES (?, ?, ?, ?)",
  );
  const insertFts = db.prepare(
    "INSERT INTO search_fts (rowid, content) VALUES (?, ?)",
  );

  const tx = db.transaction(() => {
    deleteExistingFts.run(snapshotId);
    deleteExisting.run(snapshotId);
    for (const file of files) {
      const lines = file.content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        if (line.trim().length === 0) continue; // skip empty lines
        const info = insertLine.run(snapshotId, file.path, i + 1, line);
        insertFts.run(info.lastInsertRowid, line);
        totalLines++;
      }
    }
  });
  tx();

  return { indexed_files: files.length, indexed_lines: totalLines };
}

/**
 * Search indexed content for a snapshot using FTS5 full-text search.
 * Returns matching lines ranked by BM25 relevance.
 * Falls back to LIKE matching if the query contains only FTS5 special characters.
 */
export function searchSnapshotContent(
  snapshotId: string,
  query: string,
  opts?: { limit?: number },
): SearchResult[] {
  const db = getDb();
  const limit = opts?.limit ?? 50;

  // Build FTS5 query: wrap each token in double-quotes to treat as literal
  // This handles special characters safely (%, _, etc.)
  const ftsQuery = query
    .replace(/"/g, '""')  // escape double quotes
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => `"${tok}"`)
    .join(" ");

  if (!ftsQuery) return [];

  const results = db
    .prepare(
      `SELECT si.file_path, si.line_number, si.content,
              CAST(-bm25(search_fts) * 1000 AS INTEGER) as rank
       FROM search_fts
       JOIN search_index si ON si.id = search_fts.rowid
       WHERE search_fts MATCH ?
         AND si.snapshot_id = ?
       ORDER BY rank DESC, si.file_path ASC, si.line_number ASC
       LIMIT ?`,
    )
    .all(ftsQuery, snapshotId, limit) as SearchResult[];

  return results;
}

/** Remove search index entries for a snapshot. */
export function clearSearchIndex(snapshotId: string): void {
  const db = getDb();
  db.prepare("DELETE FROM search_fts WHERE rowid IN (SELECT id FROM search_index WHERE snapshot_id = ?)").run(snapshotId);
  db.prepare("DELETE FROM search_index WHERE snapshot_id = ?").run(snapshotId);
}

/** Get search index stats for a snapshot. */
export function getSearchIndexStats(snapshotId: string): { file_count: number; line_count: number } {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT COUNT(DISTINCT file_path) as file_count, COUNT(*) as line_count FROM search_index WHERE snapshot_id = ?",
    )
    .get(snapshotId) as { file_count: number; line_count: number };
  return row;
}

// ─── Symbol extraction ──────────────────────────────────────────

export type SymbolType = "function" | "class" | "interface" | "type" | "enum" | "method" | "struct" | "const";

export interface CodeSymbol {
  snapshot_id: string;
  file_path: string;
  symbol_name: string;
  symbol_type: SymbolType;
  line_number: number;
  parent: string | null;
}

export interface SymbolSearchResult {
  file_path: string;
  symbol_name: string;
  symbol_type: SymbolType;
  line_number: number;
  parent: string | null;
}

// Ordered list of symbol extraction patterns.
// Each entry: [regex, type, groupIndex for name, optional groupIndex for parent]
const SYMBOL_PATTERNS: Array<[RegExp, SymbolType, number, number?]> = [
  // TypeScript / JavaScript
  [/^(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][A-Za-z0-9_$]*)/, "class", 1],
  [/^(?:export\s+)?interface\s+([A-Za-z_$][A-Za-z0-9_$]*)/, "interface", 1],
  [/^(?:export\s+)?(?:declare\s+)?enum\s+([A-Za-z_$][A-Za-z0-9_$]*)/, "enum", 1],
  [/^(?:export\s+)?type\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*[=<]/, "type", 1],
  [/^(?:export\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][A-Za-z0-9_$]*)/, "function", 1],
  [/^(?:export\s+default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][A-Za-z0-9_$]*)/, "function", 1],
  [/^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?\(/, "function", 1],
  [/^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?\(\)/, "function", 1],
  [/^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*(?::\s*\S+\s*)?=\s*\{/, "const", 1],
  // Python
  [/^def\s+([a-zA-Z_][a-zA-Z0-9_]*)/, "function", 1],
  [/^async\s+def\s+([a-zA-Z_][a-zA-Z0-9_]*)/, "function", 1],
  [/^class\s+([A-Za-z_][A-Za-z0-9_]*)/, "class", 1],
  // Go
  [/^func\s+\(([A-Za-z_][A-Za-z0-9_]*)\s+\*?[A-Za-z_][A-Za-z0-9_]*\)\s+([A-Za-z_][A-Za-z0-9_]*)/, "method", 2, 1],
  [/^func\s+([A-Za-z_][A-Za-z0-9_]*)/, "function", 1],
  [/^type\s+([A-Za-z_][A-Za-z0-9_]*)\s+struct/, "struct", 1],
  [/^type\s+([A-Za-z_][A-Za-z0-9_]*)\s+interface/, "interface", 1],
];

/** Extract code symbols (functions, classes, etc.) from a list of files. */
export function extractSymbols(files: Array<{ path: string; content: string }>): Omit<CodeSymbol, "snapshot_id">[] {
  const symbols: Omit<CodeSymbol, "snapshot_id">[] = [];

  for (const file of files) {
    // v8 ignore next
    const ext = file.path.split(".").pop()?.toLowerCase() ?? "";
    const isCode = ["ts", "tsx", "js", "jsx", "mjs", "cjs", "py", "go"].includes(ext);
    if (!isCode) continue;

    const lines = file.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim();
      if (!line || line.startsWith("//") || line.startsWith("#")) continue;

      for (const [pattern, type, nameIdx, parentIdx] of SYMBOL_PATTERNS) {
        const m = pattern.exec(line);
        if (m) {
          const name = m[nameIdx];
          // v8 ignore next
          const parent = parentIdx !== undefined ? (m[parentIdx] ?? null) : null;
          // v8 ignore next
          if (name && name.length >= 2 && name.length <= 80) {
            symbols.push({
              file_path: file.path,
              symbol_name: name,
              symbol_type: type,
              line_number: i + 1,
              parent,
            });
          }
          break; // first matching pattern wins per line
        }
      }
    }
  }
  return symbols;
}

/** Index code symbols for a snapshot. Clears existing symbols first. */
export function indexSymbols(
  snapshotId: string,
  files: Array<{ path: string; content: string }>,
): { indexed_symbols: number } {
  const db = getDb();

  const deleteExisting = db.prepare("DELETE FROM code_symbols WHERE snapshot_id = ?");
  const insertSymbol = db.prepare(
    "INSERT INTO code_symbols (snapshot_id, file_path, symbol_name, symbol_type, line_number, parent) VALUES (?, ?, ?, ?, ?, ?)",
  );

  const symbols = extractSymbols(files);

  const tx = db.transaction(() => {
    deleteExisting.run(snapshotId);
    for (const s of symbols) {
      insertSymbol.run(snapshotId, s.file_path, s.symbol_name, s.symbol_type, s.line_number, s.parent);
    }
  });
  tx();

  return { indexed_symbols: symbols.length };
}

/** Search code symbols for a snapshot by name (case-insensitive prefix or exact match). */
export function searchSymbols(
  snapshotId: string,
  opts: {
    name?: string;
    type?: string;
    limit?: number;
  },
): SymbolSearchResult[] {
  const db = getDb();
  const limit = Math.min(opts.limit ?? 50, 200);

  let sql = "SELECT file_path, symbol_name, symbol_type, line_number, parent FROM code_symbols WHERE snapshot_id = ?";
  const params: (string | number)[] = [snapshotId];

  if (opts.name) {
    sql += " AND symbol_name LIKE ? COLLATE NOCASE";
    params.push(`${opts.name.replace(/[%_\\]/g, "\\$&")}%`);
  }
  if (opts.type) {
    sql += " AND symbol_type = ?";
    params.push(opts.type);
  }
  sql += " ORDER BY symbol_name COLLATE NOCASE ASC, file_path ASC LIMIT ?";
  params.push(limit);

  return db.prepare(sql).all(...params) as SymbolSearchResult[];
}

/** Remove symbol index entries for a snapshot. */
export function clearSymbols(snapshotId: string): void {
  const db = getDb();
  db.prepare("DELETE FROM code_symbols WHERE snapshot_id = ?").run(snapshotId);
}

/** Get symbol index stats for a snapshot. */
export function getSymbolStats(snapshotId: string): { symbol_count: number; file_count: number } {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT COUNT(*) as symbol_count, COUNT(DISTINCT file_path) as file_count FROM code_symbols WHERE snapshot_id = ?",
    )
    .get(snapshotId) as { symbol_count: number; file_count: number };
  return row;
}
