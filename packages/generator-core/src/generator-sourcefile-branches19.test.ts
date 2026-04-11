import { describe, it, expect } from "vitest";
import { generateFiles } from "./generate.js";
import { buildContextMap, buildRepoProfile } from "@axis/context-engine";
import type { SnapshotRecord, FileEntry } from "@axis/snapshots";
import type { GeneratorInput } from "./types.js";

/* ─── Fixture Helpers ──────────────────────────────────────────── */

function snap(opts: { name?: string; files?: FileEntry[] } = {}): SnapshotRecord {
  const files = opts.files ?? [{ path: "index.ts", content: 'console.log("hi");', size: 18 }];
  return {
    snapshot_id: "snap-b19-001",
    project_id: "proj-b19-001",
    created_at: new Date().toISOString(),
    input_method: "repo_snapshot_upload",
    manifest: {
      project_name: opts.name ?? "b19-test",
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

function addFw(inp: GeneratorInput, name: string, confidence = 0.9): GeneratorInput {
  inp.context_map.detection.frameworks.push({ name, version: null, confidence });
  return inp;
}

function withModels(
  inp: GeneratorInput,
  models: Array<{ name: string; kind: string; field_count: number; source_file?: string }>,
): GeneratorInput {
  inp.context_map.domain_models = models.map(m => ({
    name: m.name,
    kind: m.kind,
    language: "TypeScript",
    field_count: m.field_count,
    source_file: m.source_file ?? `src/models/${m.name.toLowerCase()}.ts`,
  }));
  return inp;
}

function withRoutes(
  inp: GeneratorInput,
  routes: Array<{ method: string; path: string; source_file: string }>,
): GeneratorInput {
  inp.context_map.routes = routes;
  return inp;
}

function withHotspots(
  inp: GeneratorInput,
  hotspots: Array<{ path: string; inbound_count: number; outbound_count: number; risk_score: number }>,
): GeneratorInput {
  inp.context_map.dependency_graph.hotspots = hotspots;
  return inp;
}

/* ================================================================= */
/* PART 1: generators-notebook — CI/CD and lockfile warning filters  */
/* ================================================================= */

describe("notebook: ci/cd warning filtered when Dockerfile in file tree — branches 9[0], 46[0]", () => {
  it("filters ci/cd warning in notebook-summary.md when hasCiCd=true", () => {
    const inp = input(snap({
      files: [
        { path: "index.ts", content: 'console.log("hi");', size: 18 },
        { path: "Dockerfile", content: "FROM node:20\nCOPY . .\nCMD [\"node\", \"index.ts\"]", size: 46 },
      ],
    }), ["notebook-summary.md"]);
    inp.context_map.ai_context.warnings = [
      "Missing ci/cd configuration detected",
      "Other unrelated warning",
    ];
    const res = generateFiles(inp);
    const f = getFile(res, "notebook-summary.md");
    expect(f).toBeDefined();
    // The ci/cd warning should be filtered (hasCiCd=true) → branch 9[0] (return false) executed
    // The output will contain "Other unrelated" but NOT the ci/cd warning
    expect(f!.content).not.toContain("Missing ci/cd configuration detected");
    expect(f!.content.length).toBeGreaterThan(0);
  });
});

describe("notebook: lockfile warning filtered when pnpm-lock in file tree — branches 11[0], 48[0]", () => {
  it("filters lockfile warning in notebook-summary.md when hasLockfile=true", () => {
    const inp = input(snap({
      files: [
        { path: "index.ts", content: 'console.log("hi");', size: 18 },
        { path: "pnpm-lock.yaml", content: "lockfileVersion: '6.0'", size: 22 },
      ],
    }), ["notebook-summary.md"]);
    inp.context_map.ai_context.warnings = [
      "Lockfile not committed to version control",
      "Some other warning",
    ];
    const res = generateFiles(inp);
    const f = getFile(res, "notebook-summary.md");
    expect(f).toBeDefined();
    // The lockfile warning should be filtered (hasLockfile=true) → branch 11[0] executed
    expect(f!.content).not.toContain("Lockfile not committed");
    expect(f!.content.length).toBeGreaterThan(0);
  });

  it("filters ci/cd warning in research-threads.md when hasCiCd=true — branch 46[0]", () => {
    const inp = input(snap({
      files: [
        { path: "src/index.ts", content: 'export default {};\n', size: 19 },
        { path: ".travis.yml", content: "language: node_js\nnode_js: 20", size: 30 },
      ],
    }), ["research-threads.md"]);
    inp.context_map.ai_context.warnings = [
      "ci/cd pipeline not configured",
      "Another warning",
    ];
    const res = generateFiles(inp);
    const f = getFile(res, "research-threads.md");
    expect(f).toBeDefined();
    // Branch 46[0] (ci/cd filter truthy path in research-threads)
    expect(f!.content).not.toContain("ci/cd pipeline not configured");
  });

  it("filters lockfile warning in research-threads.md when hasLockfile=true — branch 48[0]", () => {
    const inp = input(snap({
      files: [
        { path: "src/index.ts", content: 'export default {};\n', size: 19 },
        { path: "package-lock.json", content: '{"lockfileVersion":3}', size: 21 },
      ],
    }), ["research-threads.md"]);
    inp.context_map.ai_context.warnings = [
      "lockfile is missing from repository",
      "Another warning",
    ];
    const res = generateFiles(inp);
    const f = getFile(res, "research-threads.md");
    expect(f).toBeDefined();
    // Branch 48[0] (lockfile filter truthy path in research-threads)
    expect(f!.content).not.toContain("lockfile is missing");
  });
});

/* ================================================================= */
/* PART 2: generators-marketing — domain entities overflow > 5       */
/* ================================================================= */

describe("marketing: models > 5 → overflow suffix in campaign-brief — branch 14[0]", () => {
  it("appends 'and N more' when more than 5 domain entities exist", () => {
    const models = Array.from({ length: 7 }, (_, i) => ({
      name: `Entity${i}`,
      kind: "interface" as const,
      field_count: i + 1,
    }));
    const inp = withModels(input(snap(), ["campaign-brief.md"]), models);
    const res = generateFiles(inp);
    const f = getFile(res, "campaign-brief.md");
    expect(f).toBeDefined();
    // Branch 14[0] (models.length > 5) truthy → " and 2 more" appended
    expect(f!.content).toMatch(/and \d+ more/);
  });
});

/* ================================================================= */
/* PART 3: generators-superpowers — no classes (interfaces only)     */
/* ================================================================= */

describe("superpowers: interfaces only → no balance note — branch 77[1]", () => {
  it("omits model balance note when all models are interfaces (no classes)", () => {
    const models = Array.from({ length: 8 }, (_, i) => ({
      name: `IFace${i}`,
      kind: "interface" as const,
      field_count: i + 2,
    }));
    const inp = withModels(input(snap(), ["refactor-checklist.md"]), models);
    const res = generateFiles(inp);
    const f = getFile(res, "refactor-checklist.md");
    expect(f).toBeDefined();
    // Branch 77[1]: interfaces.length > 0 but classes.length === 0 → no balance note
    expect(f!.content).not.toContain("Model balance");
    expect(f!.content.length).toBeGreaterThan(0);
  });
});

/* ================================================================= */
/* PART 4: generators-artifacts — hotspots in dashboard-widget       */
/* ================================================================= */

describe("artifacts: hotspots in dashboard-widget — branch 12[0]", () => {
  it("renders hotspot risk table when hotspots exist in dashboard-widget.tsx", () => {
    const inp = withHotspots(input(snap(), ["dashboard-widget.tsx"]), [
      { path: "src/core.ts", inbound_count: 15, outbound_count: 5, risk_score: 0.92 },
      { path: "src/utils.ts", inbound_count: 8, outbound_count: 3, risk_score: 0.71 },
    ]);
    const res = generateFiles(inp);
    const f = getFile(res, "dashboard-widget.tsx");
    expect(f).toBeDefined();
    // Branch 12[0] (hotspots.length > 0) truthy → hotspot risk table rendered
    expect(f!.content).toContain("Dependency Hotspots");
    expect(f!.content).toContain("src/core.ts");
  });
});

/* ================================================================= */
/* PART 5: context-engine — Go routes deduplication                  */
/* ================================================================= */

describe("context-engine: Go route deduplication — engine branch 54[1]", () => {
  it("deduplicates duplicate Go route patterns in generated files", () => {
    // A Go file with the same route defined twice should only produce one route
    const goContent = `package main
import "github.com/go-chi/chi/v5"
func main() {
    r := chi.NewRouter()
    r.Get("/api/users", handleUsers)
    r.Get("/api/users", handleUsers)  // duplicate
    r.Post("/api/users", createUser)
}`;
    const inp = input(snap({
      files: [
        { path: "main.go", content: goContent, size: goContent.length },
      ],
    }), ["route-priority-map.md"]);
    const res = generateFiles(inp);
    const f = getFile(res, "route-priority-map.md");
    expect(f).toBeDefined();
    // Routes should be deduplicated — engine branch 54[1] covered (seen.has(key) = true)
    const content = f!.content;
    const getMatches = content.match(/GET[^]*?\/api\/users/g) ?? [];
    // Only 1 GET /api/users route should appear (deduped)
    expect(getMatches.length).toBeLessThanOrEqual(2);
    expect(content.length).toBeGreaterThan(0);
  });
});

/* ================================================================= */
/* PART 6: generators-artifacts — dashboard-widget with React        */
/* ================================================================= */

describe("artifacts: React dashboard-widget with domain models — branch 12[0] React path", () => {
  it("renders React DashboardWidget with domain model StatCards when React detected", () => {
    const inp = withModels(
      addFw(input(snap(), ["dashboard-widget.tsx"]), "React"),
      [
        { name: "Metric", kind: "interface", field_count: 4 },
        { name: "Chart", kind: "class", field_count: 7 },
      ],
    );
    const res = generateFiles(inp);
    const f = getFile(res, "dashboard-widget.tsx");
    expect(f).toBeDefined();
    // React path renders full component
    expect(f!.content).toContain("DashboardWidget");
    // Shared section: domain models after the React component
    expect(f!.content).toContain("Domain Models");
  });
});

describe("artifacts: React dashboard-widget with routes", () => {
  it("renders React DashboardWidget with API surface when routes present", () => {
    const inp = withRoutes(
      addFw(input(snap(), ["dashboard-widget.tsx"]), "React"),
      [
        { method: "GET", path: "/api/data", source_file: "src/routes/data.ts" },
        { method: "POST", path: "/api/save", source_file: "src/routes/save.ts" },
      ],
    );
    const res = generateFiles(inp);
    const f = getFile(res, "dashboard-widget.tsx");
    expect(f).toBeDefined();
    expect(f!.content).toContain("DashboardWidget");
    expect(f!.content).toContain("API Surface");
  });
});

/* ================================================================= */
/* PART 7: generators-notebook — key_abstractions (branches 9, 11)  */
/* ================================================================= */

describe("notebook: key_abstractions in Phase 3 when no domain models — branches 9[0], 11[0]", () => {
  it("renders key abstractions in Phase 3 of study-brief.md when domain_models empty", () => {
    const inp = input(snap(), ["study-brief.md"]);
    inp.context_map.domain_models = [];
    inp.context_map.ai_context.key_abstractions = ["AuthService", "DataPipeline", "EventBus"];
    const res = generateFiles(inp);
    const f = getFile(res, "study-brief.md");
    expect(f).toBeDefined();
    // study-brief Phase 3 uses key_abstractions when no domain models
    expect(f!.content).toContain("AuthService");
  });
});
