import { describe, it, expect } from "vitest";
import { generateFiles } from "./generate.js";
import { buildContextMap, buildRepoProfile } from "@axis/context-engine";
import type { SnapshotRecord, FileEntry } from "@axis/snapshots";
import type { GeneratorInput } from "./types.js";

/* ─── Fixture Helpers ──────────────────────────────────────────── */

function snap(opts: { name?: string; files?: FileEntry[] } = {}): SnapshotRecord {
  const files = opts.files ?? [{ path: "index.ts", content: 'console.log("hi");', size: 18 }];
  return {
    snapshot_id: "snap-b15-001",
    project_id: "proj-b15-001",
    created_at: new Date().toISOString(),
    input_method: "repo_snapshot_upload",
    manifest: {
      project_name: opts.name ?? "b15-test",
      project_type: "web_application",
      frameworks: [],
      goals: [],
      requested_outputs: [],
    },
    file_count: files.length,
    total_size_bytes: files.reduce((s, f) => s + f.size, 0),
    files,
    status: "ready",
    account_id: null,
  };
}

function input(s: SnapshotRecord, requested: string[]): GeneratorInput {
  return {
    context_map: buildContextMap(s),
    repo_profile: buildRepoProfile(s),
    requested_outputs: requested,
  };
}

function getFile(result: ReturnType<typeof generateFiles>, path: string) {
  return result.files.find(f => f.path === path);
}

function withModels(
  inp: GeneratorInput,
  count = 3,
  fieldCounts: number[] = [4, 9, 3],
): GeneratorInput {
  inp.context_map.domain_models = Array.from({ length: count }, (_, i) => ({
    name: `Model${i}`,
    kind: i % 2 === 0 ? "interface" : "class",
    language: "TypeScript",
    field_count: fieldCounts[i] ?? 4,
    source_file: `src/models/model${i}.ts`,
  }));
  return inp;
}

function withSchema(inp: GeneratorInput, count = 2): GeneratorInput {
  inp.context_map.sql_schema = Array.from({ length: count }, (_, i) => ({
    name: `table_${i}`,
    column_count: 5 + i,
    foreign_key_count: i,
  }));
  return inp;
}

/* ================================================================= */
/* PART 1: AGENTS.md — domain_models TRUE branch                     */
/* ================================================================= */

describe("AGENTS.md — domain_models TRUE branch", () => {
  it("includes Domain Models section when models exist", () => {
    const inp = withModels(input(snap(), ["AGENTS.md"]));
    const res = generateFiles(inp);
    const f = getFile(res, "AGENTS.md");
    expect(f).toBeDefined();
    expect(f!.content).toContain("### Domain Models");
    expect(f!.content).toContain("| Model | Kind | Fields | Source |");
    expect(f!.content).toContain("`Model0`");
  });

  it("includes overflow row when domain_models count > 20", () => {
    const inp = withModels(input(snap(), ["AGENTS.md"]), 22);
    const res = generateFiles(inp);
    const f = getFile(res, "AGENTS.md");
    expect(f!.content).toContain("… 2 more");
  });

  it("includes Database Tables section when sql_schema exists", () => {
    const inp = withSchema(input(snap(), ["AGENTS.md"]));
    const res = generateFiles(inp);
    const f = getFile(res, "AGENTS.md");
    expect(f!.content).toContain("### Database Tables");
    expect(f!.content).toContain("| Table | Columns | Foreign Keys |");
    expect(f!.content).toContain("`table_0`");
  });

  it("includes both domain_models and sql_schema sections together", () => {
    const inp = withSchema(withModels(input(snap(), ["AGENTS.md"])));
    const res = generateFiles(inp);
    const f = getFile(res, "AGENTS.md");
    expect(f!.content).toContain("### Domain Models");
    expect(f!.content).toContain("### Database Tables");
  });
});

/* ================================================================= */
/* PART 2: CLAUDE.md — domain_models TRUE branch                     */
/* ================================================================= */

describe("CLAUDE.md — domain_models TRUE branch", () => {
  it("includes Data Models section when models exist", () => {
    const inp = withModels(input(snap(), ["CLAUDE.md"]));
    const res = generateFiles(inp);
    const f = getFile(res, "CLAUDE.md");
    expect(f).toBeDefined();
    expect(f!.content).toContain("## Data Models");
    expect(f!.content).toContain("Detected domain model contracts:");
    expect(f!.content).toContain("`Model0`");
  });

  it("includes overflow row when domain_models count > 20", () => {
    const inp = withModels(input(snap(), ["CLAUDE.md"]), 22);
    const res = generateFiles(inp);
    const f = getFile(res, "CLAUDE.md");
    expect(f!.content).toContain("… 2 more");
  });

  it("includes Database Schema section when sql_schema exists", () => {
    const inp = withSchema(input(snap(), ["CLAUDE.md"]));
    const res = generateFiles(inp);
    const f = getFile(res, "CLAUDE.md");
    expect(f!.content).toContain("## Database Schema");
    expect(f!.content).toContain("`table_0`");
  });
});

/* ================================================================= */
/* PART 3: .cursorrules — domain_models TRUE branch                  */
/* ================================================================= */

describe(".cursorrules — domain_models TRUE branch", () => {
  it("includes Domain Models section when models exist", () => {
    const inp = withModels(input(snap(), [".cursorrules"]));
    const res = generateFiles(inp);
    const f = getFile(res, ".cursorrules");
    expect(f).toBeDefined();
    expect(f!.content).toContain("# === Domain Models ===");
    expect(f!.content).toContain("Model0 (interface, 4 fields)");
  });

  it("includes overflow line when domain_models count > 20", () => {
    const inp = withModels(input(snap(), [".cursorrules"]), 22);
    const res = generateFiles(inp);
    const f = getFile(res, ".cursorrules");
    expect(f!.content).toContain("# ... and 2 more");
  });

  it("includes Database Tables section when sql_schema exists", () => {
    const inp = withSchema(input(snap(), [".cursorrules"]));
    const res = generateFiles(inp);
    const f = getFile(res, ".cursorrules");
    expect(f!.content).toContain("# === Database Tables ===");
    expect(f!.content).toContain("table_0 (5 cols, 0 fks)");
  });
});

/* ================================================================= */
/* PART 4: architecture-summary.md — domain_models TRUE branch       */
/* ================================================================= */

describe("architecture-summary.md — domain_models TRUE branch", () => {
  it("includes Domain Models section when models exist", () => {
    const inp = withModels(input(snap(), ["architecture-summary.md"]));
    const res = generateFiles(inp);
    const f = getFile(res, "architecture-summary.md");
    expect(f).toBeDefined();
    expect(f!.content).toContain("## Domain Models");
    expect(f!.content).toContain("Detected 3 domain models:");
    expect(f!.content).toContain("`Model0`");
  });

  it("uses singular 'model' label when exactly 1 model", () => {
    const inp = withModels(input(snap(), ["architecture-summary.md"]), 1, [3]);
    const res = generateFiles(inp);
    const f = getFile(res, "architecture-summary.md");
    expect(f!.content).toContain("Detected 1 domain model:");
  });

  it("includes overflow row when domain_models count > 25", () => {
    const inp = withModels(input(snap(), ["architecture-summary.md"]), 27);
    const res = generateFiles(inp);
    const f = getFile(res, "architecture-summary.md");
    expect(f!.content).toContain("… 2 more");
  });

  it("includes high-complexity models advisory when field_count >= 8", () => {
    // Model1 has 9 fields → complex
    const inp = withModels(input(snap(), ["architecture-summary.md"]), 3, [4, 9, 3]);
    const res = generateFiles(inp);
    const f = getFile(res, "architecture-summary.md");
    expect(f!.content).toContain("High-complexity models");
    expect(f!.content).toContain("`Model1`");
    expect(f!.content).toContain("consider splitting");
  });

  it("does not include high-complexity advisory when all models have < 8 fields", () => {
    const inp = withModels(input(snap(), ["architecture-summary.md"]), 3, [3, 4, 5]);
    const res = generateFiles(inp);
    const f = getFile(res, "architecture-summary.md");
    expect(f!.content).not.toContain("High-complexity models");
  });

  it("includes Database Schema section when sql_schema exists", () => {
    const inp = withSchema(input(snap(), ["architecture-summary.md"]));
    const res = generateFiles(inp);
    const f = getFile(res, "architecture-summary.md");
    expect(f!.content).toContain("## Database Schema");
    expect(f!.content).toContain("`table_0`");
  });

  it("includes both domain_models and sql_schema sections together", () => {
    const inp = withSchema(withModels(input(snap(), ["architecture-summary.md"])));
    const res = generateFiles(inp);
    const f = getFile(res, "architecture-summary.md");
    expect(f!.content).toContain("## Domain Models");
    expect(f!.content).toContain("## Database Schema");
  });
});
