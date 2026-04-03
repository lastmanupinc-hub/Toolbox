import { describe, it, expect } from "vitest";
import { parseRepo } from "./parser.js";
import type { FileEntry } from "@axis/snapshots";

function makeFiles(paths: Array<{ path: string; content?: string }>): FileEntry[] {
  return paths.map(f => ({
    path: f.path,
    content: f.content ?? "",
    size: f.content?.length ?? 0,
  }));
}

describe("parseRepo", () => {
  it("detects TypeScript as primary language", () => {
    const result = parseRepo(makeFiles([
      { path: "src/index.ts", content: "export const x = 1;\nexport const y = 2;" },
      { path: "src/util.ts", content: "export function add(a: number, b: number) { return a + b; }" },
      { path: "package.json", content: '{"name":"test"}' },
    ]));
    expect(result.languages[0].name).toBe("TypeScript");
    expect(result.languages[0].file_count).toBe(2);
  });

  it("detects Next.js framework from next.config", () => {
    const result = parseRepo(makeFiles([
      { path: "next.config.mjs", content: "export default {}" },
      {
        path: "package.json",
        content: '{"dependencies":{"next":"14.0.0","react":"18.0.0"}}',
      },
    ]));
    const nextjs = result.frameworks.find(f => f.name === "Next.js");
    expect(nextjs).toBeTruthy();
    expect(nextjs!.confidence).toBeGreaterThanOrEqual(0.89);
  });

  it("detects Prisma from schema file", () => {
    const result = parseRepo(makeFiles([
      { path: "prisma/schema.prisma", content: "model User { id Int @id }" },
      { path: "package.json", content: '{"dependencies":{"@prisma/client":"5.0.0"}}' },
    ]));
    const prisma = result.frameworks.find(f => f.name === "Prisma");
    expect(prisma).toBeTruthy();
    expect(prisma!.confidence).toBe(1);
  });

  it("detects Tailwind from config file", () => {
    const result = parseRepo(makeFiles([
      { path: "tailwind.config.ts", content: "export default {}" },
      { path: "package.json", content: '{"dependencies":{"tailwindcss":"3.0.0"}}' },
    ]));
    const tw = result.frameworks.find(f => f.name === "Tailwind CSS");
    expect(tw).toBeTruthy();
  });

  it("classifies test files", () => {
    const result = parseRepo(makeFiles([
      { path: "tests/api.test.ts", content: "test('it works', () => {})" },
      { path: "src/index.ts", content: "export const x = 1;" },
    ]));
    const testFile = result.file_annotations.find(a => a.path === "tests/api.test.ts");
    expect(testFile?.role).toBe("test");
    const srcFile = result.file_annotations.find(a => a.path === "src/index.ts");
    expect(srcFile?.role).toBe("source");
  });

  it("detects CI platform", () => {
    const result = parseRepo(makeFiles([
      { path: ".github/workflows/ci.yml", content: "name: CI" },
    ]));
    expect(result.ci_platform).toBe("github_actions");
  });

  it("detects package managers", () => {
    const result = parseRepo(makeFiles([
      { path: "pnpm-lock.yaml", content: "lockfileVersion: 9" },
    ]));
    expect(result.package_managers).toContain("pnpm");
  });

  it("detects test frameworks", () => {
    const result = parseRepo(makeFiles([
      {
        path: "package.json",
        content: '{"devDependencies":{"vitest":"1.0.0","@playwright/test":"1.40.0"}}',
      },
    ]));
    expect(result.test_frameworks).toContain("vitest");
    expect(result.test_frameworks).toContain("playwright");
  });

  it("extracts internal imports", () => {
    const result = parseRepo(makeFiles([
      { path: "lib/db.ts", content: 'import { PrismaClient } from "@prisma/client"\nexport const prisma = new PrismaClient()' },
      { path: "lib/stats.ts", content: 'import { prisma } from "./db"' },
    ]));
    const edge = result.internal_imports.find(e => e.source === "lib/stats.ts");
    expect(edge).toBeTruthy();
    expect(edge!.target).toBe("lib/db.ts");
  });

  it("computes top-level directories", () => {
    const result = parseRepo(makeFiles([
      { path: "src/index.ts", content: "" },
      { path: "src/util.ts", content: "" },
      { path: "tests/test.ts", content: "" },
    ]));
    const src = result.top_level_dirs.find(d => d.name === "src");
    expect(src).toBeTruthy();
    expect(src!.file_count).toBe(2);
  });

  it("detects health indicators", () => {
    const result = parseRepo(makeFiles([
      { path: "tsconfig.json", content: '{"compilerOptions":{}}' },
      { path: ".eslintrc.json", content: "{}" },
      { path: ".prettierrc", content: "{}" },
      { path: "tests/foo.test.ts", content: "" },
      { path: ".github/workflows/ci.yml", content: "" },
      { path: "pnpm-lock.yaml", content: "" },
    ]));
    expect(result.health.has_typescript).toBe(true);
    expect(result.health.has_linter).toBe(true);
    expect(result.health.has_formatter).toBe(true);
    expect(result.health.has_tests).toBe(true);
    expect(result.health.has_ci).toBe(true);
    expect(result.health.has_lockfile).toBe(true);
  });
});
