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
 */
export function indexSnapshotContent(
  snapshotId: string,
  files: Array<{ path: string; content: string }>,
): { indexed_files: number; indexed_lines: number } {
  const db = getDb();
  let totalLines = 0;

  const deleteExisting = db.prepare("DELETE FROM search_index WHERE snapshot_id = ?");
  const insertLine = db.prepare(
    "INSERT INTO search_index (snapshot_id, file_path, line_number, content) VALUES (?, ?, ?, ?)",
  );

  const tx = db.transaction(() => {
    deleteExisting.run(snapshotId);
    for (const file of files) {
      const lines = file.content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        if (line.trim().length === 0) continue; // skip empty lines
        insertLine.run(snapshotId, file.path, i + 1, line);
        totalLines++;
      }
    }
  });
  tx();

  return { indexed_files: files.length, indexed_lines: totalLines };
}

/**
 * Search indexed content for a snapshot using LIKE matching.
 * Returns matching lines ranked by relevance (exact match > partial).
 */
export function searchSnapshotContent(
  snapshotId: string,
  query: string,
  opts?: { limit?: number },
): SearchResult[] {
  const db = getDb();
  const limit = opts?.limit ?? 50;

  // Sanitize query for LIKE — escape special chars
  const safeQuery = query.replace(/[%_]/g, (c) => `\\${c}`);

  const results = db
    .prepare(
      `SELECT file_path, line_number, content,
              CASE
                WHEN content LIKE ? ESCAPE '\\' THEN 3
                WHEN content LIKE ? ESCAPE '\\' THEN 2
                ELSE 1
              END as rank
       FROM search_index
       WHERE snapshot_id = ? AND content LIKE ? ESCAPE '\\'
       ORDER BY rank DESC, file_path ASC, line_number ASC
       LIMIT ?`,
    )
    .all(
      safeQuery,                    // exact full-line match (rank 3)
      `% ${safeQuery} %`,          // word boundary match (rank 2)
      snapshotId,
      `%${safeQuery}%`,            // substring match (rank 1)
      limit,
    ) as SearchResult[];

  return results;
}

/** Remove search index entries for a snapshot. */
export function clearSearchIndex(snapshotId: string): void {
  const db = getDb();
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
