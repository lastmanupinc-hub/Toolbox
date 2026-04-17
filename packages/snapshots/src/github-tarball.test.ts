import { describe, it, expect } from "vitest";
import { gzipSync } from "node:zlib";
import { parseTarball, shouldInclude } from "./github.js";

// ─── Tar builder helpers ────────────────────────────────────────

function buildTarEntry(
  name: string,
  content: string,
  opts?: { typeFlag?: number; prefix?: string },
): Buffer {
  const contentBuf = Buffer.from(content, "utf-8");
  const header = Buffer.alloc(512, 0);

  const actualName = name.length <= 100 ? name : name.slice(0, 100);
  header.write(actualName, 0, Math.min(actualName.length, 100), "utf-8");

  // mode
  header.write("0000644\0", 100, 8, "utf-8");
  // uid
  header.write("0001000\0", 108, 8, "utf-8");
  // gid
  header.write("0001000\0", 116, 8, "utf-8");
  // size (octal)
  header.write(contentBuf.length.toString(8).padStart(11, "0") + "\0", 124, 12, "utf-8");
  // mtime
  header.write("00000000000\0", 136, 12, "utf-8");
  // typeflag
  header[156] = opts?.typeFlag ?? 48; // '0' = regular file

  // UStar prefix
  if (opts?.prefix) {
    header.write(opts.prefix, 345, Math.min(opts.prefix.length, 155), "utf-8");
  }

  // Compute checksum
  header.fill(0x20, 148, 156);
  let checksum = 0;
  for (let i = 0; i < 512; i++) checksum += header[i];
  header.write(checksum.toString(8).padStart(6, "0") + "\0 ", 148, 8, "utf-8");

  // Content block padded to 512
  const paddedSize = Math.ceil(contentBuf.length / 512) * 512;
  const contentBlock = Buffer.alloc(paddedSize, 0);
  contentBuf.copy(contentBlock);

  return Buffer.concat([header, contentBlock]);
}

function buildTar(entries: Array<{ name: string; content: string; typeFlag?: number; prefix?: string }>): Buffer {
  const parts = entries.map((e) =>
    buildTarEntry(e.name, e.content, { typeFlag: e.typeFlag, prefix: e.prefix }),
  );
  // End-of-archive: two 512-byte zero blocks
  parts.push(Buffer.alloc(1024, 0));
  return Buffer.concat(parts);
}

// ─── shouldInclude ──────────────────────────────────────────────

describe("shouldInclude", () => {
  it("includes TypeScript files", () => {
    expect(shouldInclude("src/index.ts", 100)).toBe(true);
  });

  it("includes JSX/TSX files", () => {
    expect(shouldInclude("App.tsx", 100)).toBe(true);
    expect(shouldInclude("App.jsx", 100)).toBe(true);
  });

  it("includes JSON and YAML", () => {
    expect(shouldInclude("package.json", 100)).toBe(true);
    expect(shouldInclude("config.yaml", 100)).toBe(true);
    expect(shouldInclude("config.yml", 100)).toBe(true);
  });

  it("includes markdown", () => {
    expect(shouldInclude("README.md", 100)).toBe(true);
    expect(shouldInclude("docs/guide.mdx", 100)).toBe(true);
  });

  it("includes CSS/SCSS", () => {
    expect(shouldInclude("styles/main.css", 100)).toBe(true);
    expect(shouldInclude("styles/app.scss", 100)).toBe(true);
  });

  it("includes Python files", () => {
    expect(shouldInclude("app.py", 100)).toBe(true);
    expect(shouldInclude("main.rb", 100)).toBe(true);
  });

  it("includes Dockerfile (via .dockerfile extension match)", () => {
    expect(shouldInclude("Dockerfile", 100)).toBe(true);
  });

  it("rejects Makefile (no matching extension)", () => {
    // "Makefile".split(".").pop() → "Makefile" → ext = ".makefile" → not in set
    expect(shouldInclude("Makefile", 100)).toBe(false);
  });

  it("rejects files exceeding MAX_FILE_SIZE", () => {
    expect(shouldInclude("big.ts", 256 * 1024 + 1)).toBe(false);
  });

  it("accepts files at exactly MAX_FILE_SIZE", () => {
    expect(shouldInclude("exact.ts", 256 * 1024)).toBe(true);
  });

  it("includes lockfiles for health and package-manager detection", () => {
    expect(shouldInclude("package-lock.json", 100)).toBe(true);
    expect(shouldInclude("pnpm-lock.yaml", 100)).toBe(true);
    expect(shouldInclude("yarn.lock", 100)).toBe(true);
    expect(shouldInclude("Cargo.lock", 100)).toBe(true);
    expect(shouldInclude("poetry.lock", 100)).toBe(true);
    expect(shouldInclude("Gemfile.lock", 100)).toBe(true);
  });

  it("rejects hidden directories", () => {
    expect(shouldInclude(".git/config", 100)).toBe(false);
    expect(shouldInclude(".cache/data.json", 100)).toBe(false);
    expect(shouldInclude("src/.hidden/file.ts", 100)).toBe(false);
  });

  it("includes GitHub workflow files under .github/workflows", () => {
    expect(shouldInclude(".github/workflows/ci.yml", 100)).toBe(true);
    expect(shouldInclude(".github/workflows/release.yaml", 100)).toBe(true);
  });

  it("rejects node_modules", () => {
    expect(shouldInclude("node_modules/react/index.js", 100)).toBe(false);
  });

  it("rejects dist/build directories", () => {
    expect(shouldInclude("dist/bundle.js", 100)).toBe(false);
    expect(shouldInclude("build/output.js", 100)).toBe(false);
  });

  it("rejects __pycache__", () => {
    expect(shouldInclude("__pycache__/module.pyc", 100)).toBe(false);
  });

  it("rejects unknown extensions", () => {
    expect(shouldInclude("image.png", 100)).toBe(false);
    expect(shouldInclude("archive.zip", 100)).toBe(false);
    expect(shouldInclude("binary.exe", 100)).toBe(false);
  });

  it("rejects extensionless files that aren't Dockerfile/Makefile", () => {
    expect(shouldInclude("LICENSE", 100)).toBe(false);
    expect(shouldInclude("CODEOWNERS", 100)).toBe(false);
  });

  it("handles deeply nested paths", () => {
    expect(shouldInclude("a/b/c/d/e/index.ts", 100)).toBe(true);
  });

  it("rejects hidden dir deep in path", () => {
    expect(shouldInclude("src/.internal/secret.ts", 100)).toBe(false);
  });

  it("includes HTML and Vue/Svelte", () => {
    expect(shouldInclude("index.html", 100)).toBe(true);
    expect(shouldInclude("App.vue", 100)).toBe(true);
    expect(shouldInclude("Page.svelte", 100)).toBe(true);
    expect(shouldInclude("Layout.astro", 100)).toBe(true);
  });

  it("includes SQL and GraphQL", () => {
    expect(shouldInclude("schema.sql", 100)).toBe(true);
    expect(shouldInclude("queries.graphql", 100)).toBe(true);
    expect(shouldInclude("schema.prisma", 100)).toBe(true);
  });

  it("includes shell scripts", () => {
    expect(shouldInclude("deploy.sh", 100)).toBe(true);
    expect(shouldInclude("setup.bash", 100)).toBe(true);
    expect(shouldInclude("run.ps1", 100)).toBe(true);
  });
});

// ─── parseTarball ───────────────────────────────────────────────

describe("parseTarball", () => {
  it("parses a single-file archive", () => {
    const tar = buildTar([
      { name: "root-dir/src/index.ts", content: "export const x = 1;" },
    ]);
    const result = parseTarball(tar);
    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe("src/index.ts");
    expect(result.files[0].content).toBe("export const x = 1;");
  });

  it("strips root directory (GitHub convention)", () => {
    const tar = buildTar([
      { name: "owner-repo-abc123/package.json", content: '{"name":"test"}' },
      { name: "owner-repo-abc123/src/app.ts", content: "console.log('hi');" },
    ]);
    const result = parseTarball(tar);
    expect(result.files.map((f) => f.path).sort()).toEqual([
      "package.json",
      "src/app.ts",
    ]);
  });

  it("computes total bytes", () => {
    const content = "x".repeat(100);
    const tar = buildTar([
      { name: "root/a.ts", content },
      { name: "root/b.ts", content },
    ]);
    const result = parseTarball(tar);
    expect(result.totalBytes).toBeGreaterThanOrEqual(200);
  });

  it("counts skipped files", () => {
    const tar = buildTar([
      { name: "root/src/index.ts", content: "ok" },
      { name: "root/image.png", content: "binary" },
      { name: "root/node_modules/dep/index.js", content: "dep" },
    ]);
    const result = parseTarball(tar);
    expect(result.files).toHaveLength(1);
    expect(result.skipped).toBe(2);
  });

  it("handles empty archive (just end-of-archive blocks)", () => {
    const tar = Buffer.alloc(1024, 0);
    const result = parseTarball(tar);
    expect(result.files).toHaveLength(0);
    expect(result.skipped).toBe(0);
    expect(result.totalBytes).toBe(0);
  });

  it("skips directory entries (typeFlag 53)", () => {
    const tar = buildTar([
      { name: "root/src/", content: "", typeFlag: 53 },
      { name: "root/src/index.ts", content: "export {}" },
    ]);
    const result = parseTarball(tar);
    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe("src/index.ts");
  });

  it("handles NUL typeFlag as regular file", () => {
    const tar = buildTar([
      { name: "root/file.ts", content: "hello", typeFlag: 0 },
    ]);
    const result = parseTarball(tar);
    expect(result.files).toHaveLength(1);
  });

  it("handles files with UStar prefix field", () => {
    const tar = buildTar([
      { name: "file.ts", content: "prefixed", prefix: "root/deep/path" },
    ]);
    const result = parseTarball(tar);
    // Full path = prefix/name = root/deep/path/file.ts → strip root → deep/path/file.ts
    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe("deep/path/file.ts");
  });

  it("preserves file content exactly", () => {
    const content = "line1\nline2\n\ttabbed\n  spaced\n";
    const tar = buildTar([
      { name: "root/data.ts", content },
    ]);
    const result = parseTarball(tar);
    expect(result.files[0].content).toBe(content);
  });

  it("handles multiple files across programs", () => {
    const tar = buildTar([
      { name: "root/src/a.ts", content: "a" },
      { name: "root/src/b.ts", content: "b" },
      { name: "root/lib/c.js", content: "c" },
      { name: "root/package.json", content: "{}" },
      { name: "root/README.md", content: "# Hi" },
    ]);
    const result = parseTarball(tar);
    expect(result.files).toHaveLength(5);
  });

  it("keeps lockfiles in tar for health detection", () => {
    const tar = buildTar([
      { name: "root/package.json", content: "{}" },
      { name: "root/package-lock.json", content: "{}" },
      { name: "root/yarn.lock", content: "lock" },
    ]);
    const result = parseTarball(tar);
    expect(result.files).toHaveLength(3);
    expect(result.files.map((f) => f.path).sort()).toEqual([
      "package-lock.json",
      "package.json",
      "yarn.lock",
    ]);
  });

  it("filters large files from tar", () => {
    const big = "x".repeat(256 * 1024 + 1);
    const tar = buildTar([
      { name: "root/small.ts", content: "ok" },
      { name: "root/big.ts", content: big },
    ]);
    const result = parseTarball(tar);
    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe("small.ts");
  });

  it("enforces MAX_FILES limit (500)", () => {
    const entries = Array.from({ length: 510 }, (_, i) => ({
      name: `root/file${String(i).padStart(3, "0")}.ts`,
      content: `export const f${i} = ${i};`,
    }));
    const tar = buildTar(entries);
    const result = parseTarball(tar);
    expect(result.files.length).toBeLessThanOrEqual(500);
  });

  it("retains priority lockfile even when archive exceeds MAX_FILES", () => {
    const entries = Array.from({ length: 510 }, (_, i) => ({
      name: `root/src/file${String(i).padStart(3, "0")}.ts`,
      content: `export const f${i} = ${i};`,
    }));
    entries.push({ name: "root/pnpm-lock.yaml", content: "lockfileVersion: 9" });

    const tar = buildTar(entries);
    const result = parseTarball(tar);

    expect(result.files.length).toBeLessThanOrEqual(500);
    expect(result.files.some((f) => f.path === "pnpm-lock.yaml")).toBe(true);
  });

  it("handles file with zero size", () => {
    // Zero-size regular file should be skipped (fileSize > 0 check)
    const tar = buildTar([
      { name: "root/empty.ts", content: "" },
      { name: "root/real.ts", content: "x" },
    ]);
    const result = parseTarball(tar);
    // empty.ts has size 0 → skipped by the isRegularFile && fileSize > 0 check
    expect(result.files.some((f) => f.path === "real.ts")).toBe(true);
  });

  it("handles hidden directories in tar", () => {
    const tar = buildTar([
      { name: "root/.git/config", content: "[core]" },
      { name: "root/src/index.ts", content: "ok" },
      { name: "root/.cache/data.json", content: "{}" },
    ]);
    const result = parseTarball(tar);
    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe("src/index.ts");
  });

  it("handles UTF-8 content", () => {
    const content = "const msg = '日本語テスト';\nconst emoji = '🚀';";
    const tar = buildTar([
      { name: "root/i18n.ts", content },
    ]);
    const result = parseTarball(tar);
    expect(result.files[0].content).toBe(content);
  });

  it("correctly pads files to 512-byte boundaries", () => {
    // File exactly 512 bytes — should not cause off-by-one
    const content = "x".repeat(512);
    const tar = buildTar([
      { name: "root/exact.ts", content },
      { name: "root/next.ts", content: "after" },
    ]);
    const result = parseTarball(tar);
    expect(result.files).toHaveLength(2);
    expect(result.files[1].content).toBe("after");
  });

  it("handles file just under 512 boundary", () => {
    // 511 bytes — pads to 512
    const content = "y".repeat(511);
    const tar = buildTar([
      { name: "root/under.ts", content },
      { name: "root/next.ts", content: "ok" },
    ]);
    const result = parseTarball(tar);
    expect(result.files).toHaveLength(2);
  });

  it("handles file just over 512 boundary", () => {
    // 513 bytes — pads to 1024
    const content = "z".repeat(513);
    const tar = buildTar([
      { name: "root/over.ts", content },
      { name: "root/next.ts", content: "ok" },
    ]);
    const result = parseTarball(tar);
    expect(result.files).toHaveLength(2);
    expect(result.files[0].content).toBe(content);
  });
});
