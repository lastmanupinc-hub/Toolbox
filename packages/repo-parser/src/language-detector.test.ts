import { describe, it, expect } from "vitest";
import { detectLanguage, countLines } from "./language-detector.js";

describe("detectLanguage", () => {
  it("detects TypeScript for .ts", () => {
    expect(detectLanguage("src/index.ts")).toBe("TypeScript");
  });

  it("detects TypeScript for .tsx", () => {
    expect(detectLanguage("components/App.tsx")).toBe("TypeScript");
  });

  it("detects JavaScript for .js/.jsx/.mjs/.cjs", () => {
    expect(detectLanguage("index.js")).toBe("JavaScript");
    expect(detectLanguage("App.jsx")).toBe("JavaScript");
    expect(detectLanguage("entry.mjs")).toBe("JavaScript");
    expect(detectLanguage("config.cjs")).toBe("JavaScript");
  });

  it("detects Python for .py", () => {
    expect(detectLanguage("app/main.py")).toBe("Python");
  });

  it("detects Go for .go", () => {
    expect(detectLanguage("cmd/server/main.go")).toBe("Go");
  });

  it("detects Rust for .rs", () => {
    expect(detectLanguage("src/lib.rs")).toBe("Rust");
  });

  it("detects C and C++ with header variants", () => {
    expect(detectLanguage("main.c")).toBe("C");
    expect(detectLanguage("main.h")).toBe("C");
    expect(detectLanguage("main.cpp")).toBe("C++");
    expect(detectLanguage("main.hpp")).toBe("C++");
  });

  it("detects Dockerfile from path containing 'dockerfile'", () => {
    expect(detectLanguage("Dockerfile")).toBe("Dockerfile");
    expect(detectLanguage("docker/Dockerfile.prod")).toBe("Dockerfile");
    expect(detectLanguage("path/dockerfile")).toBe("Dockerfile");
  });

  it("detects markup and style languages", () => {
    expect(detectLanguage("index.html")).toBe("HTML");
    expect(detectLanguage("styles.css")).toBe("CSS");
    expect(detectLanguage("styles.scss")).toBe("SCSS");
    expect(detectLanguage("styles.less")).toBe("LESS");
  });

  it("detects config formats", () => {
    expect(detectLanguage("config.yaml")).toBe("YAML");
    expect(detectLanguage("config.yml")).toBe("YAML");
    expect(detectLanguage("data.json")).toBe("JSON");
    expect(detectLanguage("config.toml")).toBe("TOML");
  });

  it("detects shell scripts", () => {
    expect(detectLanguage("deploy.sh")).toBe("Shell");
    expect(detectLanguage("setup.bash")).toBe("Shell");
    expect(detectLanguage("profile.zsh")).toBe("Shell");
  });

  it("returns null for unknown extensions", () => {
    expect(detectLanguage("file.xyz")).toBeNull();
    expect(detectLanguage("file.unknown")).toBeNull();
  });

  it("returns null for files with no extension", () => {
    expect(detectLanguage("Makefile")).toBeNull();
  });

  it("handles case-insensitive Dockerfile detection", () => {
    expect(detectLanguage("DOCKERFILE")).toBe("Dockerfile");
    expect(detectLanguage("path/DockerFile.dev")).toBe("Dockerfile");
  });
});

describe("countLines", () => {
  it("counts non-empty non-comment lines", () => {
    expect(countLines("const x = 1;\nconst y = 2;")).toBe(2);
  });

  it("returns 0 for empty string", () => {
    expect(countLines("")).toBe(0);
  });

  it("skips blank lines", () => {
    expect(countLines("const x = 1;\n\n\nconst y = 2;")).toBe(2);
  });

  it("skips // comments", () => {
    expect(countLines("// comment\nconst x = 1;")).toBe(1);
  });

  it("skips # comments", () => {
    expect(countLines("# comment\nname: value")).toBe(1);
  });

  it("skips /* and * comment lines", () => {
    expect(countLines("/* start\n * middle\n */\nconst x = 1;")).toBe(1);
  });

  it("counts lines with inline comments as code", () => {
    expect(countLines("const x = 1; // inline")).toBe(1);
  });

  it("handles whitespace-only lines", () => {
    expect(countLines("  \n\t\nconst x = 1;")).toBe(1);
  });
});
