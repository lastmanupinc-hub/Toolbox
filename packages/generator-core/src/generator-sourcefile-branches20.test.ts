/**
 * generator-sourcefile-branches20.test.ts
 *
 * Covers the "always truthy" if-branch false paths and Go mux route extraction:
 *   generators-artifacts.ts  b17 (arch-health block never skipped)
 *   generators-artifacts.ts  b21 (warnings block never skipped)
 *   generators-debug.ts      b136 (exports.length=0 for hotspot file)
 *   generators-obsidian.ts   b17  (SQL table has no matching domain model)
 *   context-engine/engine.ts b52  (Go mux HandleFunc valid route → NOT skipped)
 *   context-engine/engine.ts b53  (sort by source_file: same method+path in two files)
 */

import { describe, it, expect } from "vitest";
import { generateFiles } from "./generate.js";
import { buildContextMap, buildRepoProfile } from "@axis/context-engine";
import type { SnapshotRecord, FileEntry } from "@axis/snapshots";
import type { GeneratorInput, SourceFile } from "./types.js";

/* ─── Fixture helpers ───────────────────────────────────────────── */

function snap(opts: { name?: string; files?: FileEntry[] } = {}): SnapshotRecord {
  const files = opts.files ?? [{ path: "index.ts", content: 'console.log("hi");', size: 18 }];
  return {
    snapshot_id: "snap-b20-001",
    project_id: "proj-b20-001",
    created_at: new Date().toISOString(),
    input_method: "repo_snapshot_upload",
    manifest: {
      project_name: opts.name ?? "b20-test",
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

function input(s: SnapshotRecord, requested: string[], sourceFiles?: SourceFile[]): GeneratorInput {
  return {
    context_map: buildContextMap(s),
    repo_profile: buildRepoProfile(s),
    requested_outputs: requested,
    source_files: sourceFiles,
  };
}

function getFile(result: ReturnType<typeof generateFiles>, path: string) {
  return result.files.find(f => f.path === path);
}

function withHotspots(
  inp: GeneratorInput,
  hotspots: Array<{ path: string; inbound_count: number; outbound_count: number; risk_score: number }>,
): GeneratorInput {
  inp.context_map.dependency_graph.hotspots = hotspots;
  return inp;
}

/* ================================================================= */
/* PART 1: generators-artifacts — Architecture Health branch         */
/* b17 line261: if (signals.patterns_detected.length > 0 || ...>0)  */
/* b21 line277: if (ctx.ai_context.warnings.length > 0)              */
/* ================================================================= */

describe("artifacts: arch-health section skipped when no patterns and zero score — b17[1]", () => {
  it("skips Architecture Health comment block when patterns=[] and score=0", () => {
    const inp = input(snap(), ["dashboard-widget.tsx"]);
    // Force both conditions false for b17
    inp.context_map.architecture_signals.patterns_detected = [];
    inp.context_map.architecture_signals.separation_score = 0;
    inp.context_map.architecture_signals.layer_boundaries = [];
    const res = generateFiles(inp);
    const f = getFile(res, "dashboard-widget.tsx");
    expect(f).toBeDefined();
    expect(f!.content).not.toContain("Architecture Health");
  });
});

describe("artifacts: warnings section skipped when no warnings — b21[1]", () => {
  it("skips Warnings comment block when warnings array is empty", () => {
    const inp = input(snap(), ["dashboard-widget.tsx"]);
    inp.context_map.architecture_signals.patterns_detected = [];
    inp.context_map.architecture_signals.separation_score = 0;
    inp.context_map.architecture_signals.layer_boundaries = [];
    inp.context_map.ai_context.warnings = [];
    const res = generateFiles(inp);
    const f = getFile(res, "dashboard-widget.tsx");
    expect(f).toBeDefined();
    expect(f!.content).not.toContain("⚠");
  });
});

/* ================================================================= */
/* PART 2: generators-debug — hotspot file with no exports           */
/* b136 line978: if (exports.length > 0) — false path               */
/* ================================================================= */

describe("debug: root-cause-checklist hotspot file with no exports — b136[1]", () => {
  it("skips export listing in Suspect File Excerpts when file has no exports", () => {
    const noExportSrc: SourceFile = {
      // Pure Go file: no TypeScript/JS export statements → extractExports returns []
      path: "pkg/core/registry.go",
      content: "package core\n\nfunc init() {}\n\nvar registry = map[string]interface{}{}\n",
      size: 65,
    };
    const inp = withHotspots(
      input(snap({ files: [{ path: "pkg/core/registry.go", content: noExportSrc.content, size: noExportSrc.size }] }),
        ["root-cause-checklist.md"],
        [noExportSrc]),
      [{ path: "pkg/core/registry.go", inbound_count: 14, outbound_count: 7, risk_score: 9.2 }],
    );
    const res = generateFiles(inp);
    const f = getFile(res, "root-cause-checklist.md");
    expect(f).toBeDefined();
    // The suspect files section should still appear (hotspot exists)
    expect(f!.content).toContain("Suspect File Excerpts");
    // But NO export listing (exports.length === 0)
    expect(f!.content).not.toContain("### `pkg/core/registry.go` exports");
  });
});

/* ================================================================= */
/* PART 3: generators-obsidian — SQL table with no matching model    */
/* b17 line407: if (matchingModelIdx !== -1) — false path (= -1)     */
/* ================================================================= */

describe("obsidian: graph-prompt-map skips cross-link when SQL table has no matching domain model — b17[1]", () => {
  it("omits maps_to_table edge when table name does not match any domain model", () => {
    const inp = input(snap(), ["graph-prompt-map.json"]);
    // SQL table "audit_log" — normalised: "auditlog"
    inp.context_map.sql_schema = [
      { name: "audit_log", column_count: 4, foreign_key_count: 0, source_file: "db/schema.sql" },
    ];
    // Domain model "Product" — normalised: "product" — neither matches "audit_log" or "auditlog"
    inp.context_map.domain_models = [
      { name: "Product", kind: "interface", language: "TypeScript", field_count: 5, source_file: "src/product.ts" },
    ];
    const res = generateFiles(inp);
    const f = getFile(res, "graph-prompt-map.json");
    expect(f).toBeDefined();
    const parsed = JSON.parse(f!.content);
    // A table node should exist
    const hasTableNode = parsed.nodes.some((n: { type: string }) => n.type === "database_table");
    expect(hasTableNode).toBe(true);
    // But NO maps_to_table edge (matchingModelIdx === -1)
    const hasCrossLink = parsed.edges.some((e: { relationship: string }) => e.relationship === "maps_to_table");
    expect(hasCrossLink).toBe(false);
  });
});

/* ================================================================= */
/* PART 4: context-engine — Go mux HandleFunc valid route extraction */
/* b52 line292: if (!isLikelyRoute(path)) continue — false path      */
/* (route "/users" starts with "/" and is not header → NOT skipped)  */
/* ================================================================= */

describe("engine: Go mux HandleFunc valid path — b52[1] (route added, not skipped)", () => {
  it("extracts route from mux.HandleFunc when path passes isLikelyRoute", () => {
    const goContent = [
      "package main",
      'import "net/http"',
      "func main() {",
      '    mux.HandleFunc("/users", handleUsers)',
      '    http.HandleFunc("/health", handleHealth)',
      "}",
    ].join("\n");

    const s = snap({ files: [{ path: "server.go", content: goContent, size: goContent.length }] });
    const ctxMap = buildContextMap(s);
    // The mux/http.HandleFunc extractor should have added "/users" and "/health" to routes
    const muxRoutes = ctxMap.routes.filter(r => r.method === "ANY");
    expect(muxRoutes.length).toBeGreaterThanOrEqual(1);
    const paths = muxRoutes.map(r => r.path);
    expect(paths).toContain("/users");
  });
});

/* ================================================================= */
/* PART 5: context-engine — sort routes by source_file               */
/* b53 line300: a||b||c ternary — third branch (source_file compare) */
/* Two files with mux.HandleFunc for same path → sort by source_file */
/* ================================================================= */

describe("engine: route sort by source_file when method+path identical — b53[2]", () => {
  it("sorts same-method same-path routes from different files by source_file", () => {
    const content1 = 'mux.HandleFunc("/users", handleUsersA)';
    const content2 = 'mux.HandleFunc("/users", handleUsersB)';

    const s = snap({
      files: [
        { path: "routes/a.go", content: content1, size: content1.length },
        { path: "routes/b.go", content: content2, size: content2.length },
      ],
    });
    const ctxMap = buildContextMap(s);
    // Both routes should appear (different source_file, same method ANY, same path /users)
    const muxRoutes = ctxMap.routes.filter(r => r.path === "/users" && r.method === "ANY");
    expect(muxRoutes.length).toBe(2);
    // They should be sorted by source_file
    const srcs = muxRoutes.map(r => r.source_file);
    expect(srcs[0] <= srcs[1]).toBe(true); // ascending source_file order
  });
});
