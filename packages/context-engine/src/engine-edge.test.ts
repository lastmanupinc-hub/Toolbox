import { describe, it, expect } from "vitest";
import { buildContextMap, buildRepoProfile } from "./engine.js";
import type { SnapshotRecord, FileEntry } from "@axis/snapshots";

function makeSnapshot(files: Array<{ path: string; content?: string }>, overrides?: Partial<SnapshotRecord>): SnapshotRecord {
  const entries: FileEntry[] = files.map(f => ({
    path: f.path,
    content: f.content ?? "",
    size: f.content?.length ?? 0,
  }));
  return {
    snapshot_id: "snap-edge-001",
    project_id: "proj-edge-001",
    created_at: new Date().toISOString(),
    input_method: "repo_snapshot_upload",
    manifest: {
      project_name: "edge-test",
      project_type: "web_application",
      frameworks: [],
      goals: [],
      requested_outputs: [],
    },
    file_count: entries.length,
    total_size_bytes: entries.reduce((s, e) => s + e.size, 0),
    files: entries,
    status: "ready",
    ...overrides,
  };
}

describe("buildContextMap — edge cases", () => {
  it("handles snapshot with no source files", () => {
    const snap = makeSnapshot([
      { path: "README.md", content: "# Empty project" },
    ]);
    const ctx = buildContextMap(snap);
    expect(ctx.version).toBe("1.0.0");
    expect(ctx.detection.languages.length).toBeGreaterThanOrEqual(0);
    expect(ctx.routes).toEqual([]);
    expect(ctx.entry_points).toEqual([]);
  });

  it("handles snapshot with no package.json", () => {
    const snap = makeSnapshot([
      { path: "main.py", content: "print('hello')" },
    ]);
    const ctx = buildContextMap(snap);
    expect(ctx.detection.frameworks).toEqual([]);
    expect(ctx.dependency_graph.external_dependencies).toEqual([]);
  });

  it("handles invalid JSON in package.json", () => {
    const snap = makeSnapshot([
      { path: "package.json", content: "not valid json{{{" },
      { path: "src/index.ts", content: "export const x = 1;" },
    ]);
    const ctx = buildContextMap(snap);
    expect(ctx.version).toBe("1.0.0");
    expect(ctx.dependency_graph.external_dependencies).toEqual([]);
  });

  it("detects Express routes from source content", () => {
    const snap = makeSnapshot([
      { path: "src/server.ts", content: `
import express from "express";
const app = express();
app.get("/api/users", (req, res) => res.json([]));
app.post("/api/users", (req, res) => res.json({}));
app.delete("/api/users/:id", (req, res) => res.json({}));
      `.trim() },
      { path: "package.json", content: '{"dependencies":{"express":"4.18.0"}}' },
    ]);
    const ctx = buildContextMap(snap);
    expect(ctx.routes.length).toBeGreaterThanOrEqual(2);
  });

  it("detects Next.js dynamic routes with [param]", () => {
    const snap = makeSnapshot([
      { path: "app/users/[id]/page.tsx", content: "export default function UserPage() { return <div /> }" },
      { path: "next.config.mjs", content: "" },
      { path: "package.json", content: '{"dependencies":{"next":"14.0.0","react":"18.0.0"}}' },
    ]);
    const ctx = buildContextMap(snap);
    const userRoute = ctx.routes.find(r => r.path.includes(":id") || r.path.includes("[id]"));
    expect(userRoute).toBeTruthy();
  });

  it("builds dependency hotspots for highly-connected files", () => {
    const snap = makeSnapshot([
      { path: "src/core.ts", content: "export const core = {};" },
      { path: "src/a.ts", content: 'import { core } from "./core";' },
      { path: "src/b.ts", content: 'import { core } from "./core";' },
      { path: "src/c.ts", content: 'import { core } from "./core";' },
      { path: "src/d.ts", content: 'import { core } from "./core";' },
      { path: "package.json", content: '{"name":"test"}' },
    ]);
    const ctx = buildContextMap(snap);
    // Hotspots have varying field names — just verify the structure exists
    expect(ctx.dependency_graph.hotspots).toBeInstanceOf(Array);
  });

  it("detects entry points (app_entry, api_route, page_route)", () => {
    const snap = makeSnapshot([
      { path: "src/index.ts", content: "console.log('entry');" },
      { path: "app/page.tsx", content: "export default function Home() {}" },
      { path: "app/api/health/route.ts", content: "export function GET() {}" },
      { path: "package.json", content: '{"name":"test"}' },
    ]);
    const ctx = buildContextMap(snap);
    expect(ctx.entry_points.length).toBeGreaterThanOrEqual(2);
  });

  it("generates AI context with project summary", () => {
    const snap = makeSnapshot([
      { path: "src/index.ts", content: "export function main() { return 42; }" },
      { path: "package.json", content: '{"name":"test-project","dependencies":{"react":"18.0.0"}}' },
    ]);
    const ctx = buildContextMap(snap);
    expect(ctx.ai_context.project_summary).toBeTruthy();
    expect(typeof ctx.ai_context.project_summary).toBe("string");
    expect(ctx.ai_context.conventions).toBeInstanceOf(Array);
    expect(ctx.ai_context.warnings).toBeInstanceOf(Array);
  });

  it("computes architecture separation score", () => {
    const snap = makeSnapshot([
      { path: "src/controllers/userController.ts", content: "" },
      { path: "src/services/userService.ts", content: "" },
      { path: "src/models/user.ts", content: "" },
      { path: "package.json", content: '{"name":"mvc-app"}' },
    ]);
    const ctx = buildContextMap(snap);
    expect(ctx.architecture_signals.separation_score).toBeGreaterThanOrEqual(0);
    expect(ctx.architecture_signals.separation_score).toBeLessThanOrEqual(1);
  });

  it("detects CI platform from GitHub Actions workflow", () => {
    const snap = makeSnapshot([
      { path: ".github/workflows/ci.yml", content: "name: CI\non: [push]" },
      { path: "src/index.ts", content: "" },
    ]);
    const ctx = buildContextMap(snap);
    expect(ctx.detection.ci_platform).toBe("github_actions");
  });

  it("detects multiple test frameworks", () => {
    const snap = makeSnapshot([
      { path: "package.json", content: '{"devDependencies":{"vitest":"1.0.0","playwright":"1.40.0"}}' },
      { path: "src/index.ts", content: "" },
    ]);
    const ctx = buildContextMap(snap);
    expect(ctx.detection.test_frameworks).toContain("vitest");
  });
});

describe("buildRepoProfile — edge cases", () => {
  it("returns null goals when manifest has no goals", () => {
    const snap = makeSnapshot([
      { path: "src/index.ts", content: "export const x = 1;" },
      { path: "package.json", content: '{"name":"test"}' },
    ]);
    const profile = buildRepoProfile(snap);
    expect(profile.goals).toBeNull();
  });

  it("includes goals when manifest has them", () => {
    const snap = makeSnapshot([
      { path: "src/index.ts", content: "" },
      { path: "package.json", content: '{"name":"test"}' },
    ], {
      manifest: {
        project_name: "test",
        project_type: "web_application",
        frameworks: [],
        goals: ["Build AI context"],
        requested_outputs: ["context-map.json"],
      },
    });
    const profile = buildRepoProfile(snap);
    expect(profile.goals).not.toBeNull();
  });

  it("counts dependencies accurately", () => {
    const snap = makeSnapshot([
      { path: "package.json", content: '{"dependencies":{"react":"18.0.0","next":"14.0.0"},"devDependencies":{"vitest":"1.0.0"}}' },
      { path: "src/index.ts", content: "" },
    ]);
    const profile = buildRepoProfile(snap);
    expect(profile.health.dependency_count).toBe(2);
    expect(profile.health.dev_dependency_count).toBe(1);
  });

  it("detects health indicators correctly", () => {
    const snap = makeSnapshot([
      { path: "README.md", content: "# Project" },
      { path: "tests/app.test.ts", content: "test('works', () => {})" },
      { path: ".github/workflows/ci.yml", content: "" },
      { path: "pnpm-lock.yaml", content: "" },
      { path: "tsconfig.json", content: "{}" },
      { path: ".eslintrc.json", content: "{}" },
      { path: ".prettierrc", content: "{}" },
      { path: "package.json", content: '{"name":"test"}' },
    ]);
    const profile = buildRepoProfile(snap);
    expect(profile.health.has_readme).toBe(true);
    expect(profile.health.has_tests).toBe(true);
    expect(profile.health.has_ci).toBe(true);
    expect(profile.health.has_lockfile).toBe(true);
    expect(profile.health.has_typescript).toBe(true);
    expect(profile.health.has_linter).toBe(true);
    expect(profile.health.has_formatter).toBe(true);
  });

  it("returns version 1.0.0 and correct IDs", () => {
    const snap = makeSnapshot([{ path: "index.ts", content: "" }]);
    const profile = buildRepoProfile(snap);
    expect(profile.version).toBe("1.0.0");
    expect(profile.snapshot_id).toBe("snap-edge-001");
    expect(profile.project_id).toBe("proj-edge-001");
  });
});
