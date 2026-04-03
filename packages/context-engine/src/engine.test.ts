import { describe, it, expect } from "vitest";
import { buildContextMap, buildRepoProfile } from "./engine.js";
import type { SnapshotRecord } from "@axis/snapshots";
import type { FileEntry } from "@axis/snapshots";

function makeSnapshot(files: Array<{ path: string; content?: string }>, overrides?: Partial<SnapshotRecord>): SnapshotRecord {
  const entries: FileEntry[] = files.map(f => ({
    path: f.path,
    content: f.content ?? "",
    size: f.content?.length ?? 0,
  }));
  return {
    snapshot_id: "snap-test-001",
    project_id: "proj-test-001",
    created_at: new Date().toISOString(),
    input_method: "repo_snapshot_upload",
    manifest: {
      project_name: "test-app",
      project_type: "web_application",
      frameworks: ["next"],
      goals: ["Generate AI context"],
      requested_outputs: ["context-map.json", "AGENTS.md"],
    },
    file_count: entries.length,
    total_size_bytes: entries.reduce((s, e) => s + e.size, 0),
    files: entries,
    status: "ready",
    ...overrides,
  };
}

describe("buildContextMap", () => {
  const snapshot = makeSnapshot([
    { path: "src/index.ts", content: 'import { db } from "./db";\nexport function main() { return db.query(); }' },
    { path: "src/db.ts", content: 'export const db = { query: () => [] };' },
    { path: "next.config.mjs", content: "export default {}" },
    { path: "package.json", content: '{"name":"test-app","dependencies":{"next":"14.0.0","react":"18.0.0"},"devDependencies":{"vitest":"1.0.0"}}' },
    { path: "app/page.tsx", content: "export default function Home() { return <div>Home</div> }" },
    { path: "app/api/users/route.ts", content: 'export async function GET() { return Response.json([]) }\nexport async function POST() { return Response.json({}) }' },
    { path: "tailwind.config.ts", content: "export default {}" },
    { path: "prisma/schema.prisma", content: "model User { id Int @id }" },
    { path: "tsconfig.json", content: '{"compilerOptions":{"strict":true}}' },
    { path: ".github/workflows/ci.yml", content: "name: CI" },
    { path: "tests/index.test.ts", content: 'test("works", () => {})' },
  ]);

  const ctx = buildContextMap(snapshot);

  it("includes version and identifiers", () => {
    expect(ctx.version).toBe("1.0.0");
    expect(ctx.snapshot_id).toBe("snap-test-001");
    expect(ctx.project_id).toBe("proj-test-001");
    expect(ctx.generated_at).toBeTruthy();
  });

  it("builds project identity", () => {
    expect(ctx.project_identity.name).toBe("test-app");
    expect(ctx.project_identity.type).toBe("web_application");
    expect(ctx.project_identity.primary_language).toBe("TypeScript");
  });

  it("counts structure correctly", () => {
    expect(ctx.structure.total_files).toBe(11);
    expect(ctx.structure.total_directories).toBeGreaterThan(0);
    expect(ctx.structure.total_loc).toBeGreaterThan(0);
  });

  it("detects frameworks", () => {
    const names = ctx.detection.frameworks.map(f => f.name);
    expect(names).toContain("Next.js");
    expect(names).toContain("Prisma");
  });

  it("detects CI platform", () => {
    expect(ctx.detection.ci_platform).toBe("github_actions");
  });

  it("detects test frameworks", () => {
    expect(ctx.detection.test_frameworks).toContain("vitest");
  });

  it("extracts internal imports", () => {
    const edge = ctx.dependency_graph.internal_imports.find(e => e.source === "src/index.ts");
    expect(edge).toBeTruthy();
    expect(edge!.target).toBe("src/db.ts");
  });

  it("detects entry points", () => {
    const paths = ctx.entry_points.map(e => e.path);
    expect(paths).toContain("src/index.ts");
    expect(paths).toContain("app/page.tsx");
  });

  it("detects routes", () => {
    const rootRoute = ctx.routes.find(r => r.path === "/");
    expect(rootRoute).toBeTruthy();
    const apiRoute = ctx.routes.find(r => r.path.includes("api/users"));
    expect(apiRoute).toBeTruthy();
  });

  it("detects architecture patterns", () => {
    expect(ctx.architecture_signals.patterns_detected).toContain("nextjs_fullstack");
    expect(ctx.architecture_signals.patterns_detected).toContain("page_based_routing");
    expect(ctx.architecture_signals.separation_score).toBeGreaterThanOrEqual(0);
  });

  it("builds AI context summary", () => {
    expect(ctx.ai_context.project_summary).toContain("test-app");
    expect(ctx.ai_context.project_summary).toContain("TypeScript");
    expect(ctx.ai_context.conventions.length).toBeGreaterThan(0);
  });
});

describe("buildRepoProfile", () => {
  const snapshot = makeSnapshot([
    { path: "src/index.ts", content: "export const x = 1;" },
    { path: "package.json", content: '{"dependencies":{"express":"4.0.0"},"devDependencies":{"typescript":"5.0.0","jest":"29.0.0"}}' },
    { path: "tsconfig.json", content: "{}" },
    { path: ".eslintrc.json", content: "{}" },
    { path: "pnpm-lock.yaml", content: "" },
    { path: "tests/app.test.ts", content: "" },
  ]);

  const profile = buildRepoProfile(snapshot);

  it("includes version and identifiers", () => {
    expect(profile.version).toBe("1.0.0");
    expect(profile.snapshot_id).toBe("snap-test-001");
    expect(profile.project_id).toBe("proj-test-001");
  });

  it("counts files and directories", () => {
    expect(profile.structure_summary.total_files).toBe(6);
    expect(profile.structure_summary.total_directories).toBeGreaterThan(0);
  });

  it("reports health indicators", () => {
    expect(profile.health.has_typescript).toBe(true);
    expect(profile.health.has_linter).toBe(true);
    expect(profile.health.has_lockfile).toBe(true);
    expect(profile.health.has_tests).toBe(true);
  });

  it("counts dependencies", () => {
    expect(profile.health.dependency_count).toBe(1); // express
    expect(profile.health.dev_dependency_count).toBe(2); // typescript, jest
  });

  it("includes goals from manifest", () => {
    expect(profile.goals).not.toBeNull();
    expect(profile.goals!.objectives).toContain("Generate AI context");
  });

  it("returns null goals when empty", () => {
    const emptyGoalsSnapshot = makeSnapshot(
      [{ path: "index.js", content: "" }],
      { manifest: { ...snapshot.manifest, goals: [], requested_outputs: [] } },
    );
    const p = buildRepoProfile(emptyGoalsSnapshot);
    expect(p.goals).toBeNull();
  });
});
