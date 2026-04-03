import type { FileEntry } from "@axis/snapshots";
import type {
  ParseResult,
  LanguageStats,
  FileAnnotation,
  DependencyInfo,
} from "./types.js";
import { detectLanguage, countLines } from "./language-detector.js";
import { detectFrameworks } from "./framework-detector.js";
import { extractImports } from "./import-resolver.js";

export function parseRepo(files: FileEntry[]): ParseResult {
  const deps = extractDependencies(files);
  const allDeps = { ...deps.production, ...deps.development, ...deps.peer };
  const languages = computeLanguageStats(files);
  const frameworks = detectFrameworks(files, allDeps);
  const annotations = annotateFiles(files);
  const imports = extractImports(files);
  const topLevelDirs = computeTopLevelDirs(files);

  return {
    languages,
    frameworks,
    build_tools: detectBuildTools(files, allDeps),
    test_frameworks: detectTestFrameworks(files, allDeps),
    package_managers: detectPackageManagers(files),
    ci_platform: detectCI(files),
    deployment_target: detectDeployment(files, allDeps),
    file_annotations: annotations,
    dependencies: flattenDeps(deps),
    internal_imports: imports,
    top_level_dirs: topLevelDirs,
    health: {
      has_readme: files.some((f) => /^readme\.(md|txt|rst)?$/i.test(f.path)),
      has_tests: files.some((f) => isTestFile(f.path)),
      test_file_count: files.filter((f) => isTestFile(f.path)).length,
      has_ci: files.some((f) =>
        f.path.startsWith(".github/workflows/") ||
        f.path === ".gitlab-ci.yml" ||
        f.path.startsWith(".circleci/"),
      ),
      has_lockfile: files.some((f) =>
        ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "Gemfile.lock", "poetry.lock", "Cargo.lock", "go.sum"].includes(f.path),
      ),
      has_typescript: files.some((f) => f.path === "tsconfig.json" || f.path.endsWith(".ts") || f.path.endsWith(".tsx")),
      has_linter: files.some((f) =>
        f.path.includes(".eslintrc") || f.path === ".eslintrc.json" || f.path === "eslint.config" ||
        f.path.includes("pylintrc") || f.path === ".flake8" || f.path === "ruff.toml",
      ),
      has_formatter: files.some((f) =>
        f.path.includes(".prettierrc") || f.path === ".prettierrc.json" ||
        f.path === ".editorconfig" || f.path.includes("black"),
      ),
    },
  };
}

function computeLanguageStats(files: FileEntry[]): LanguageStats[] {
  const langMap = new Map<string, { files: number; loc: number }>();
  let totalLoc = 0;

  for (const file of files) {
    const lang = detectLanguage(file.path);
    if (!lang) continue;
    const loc = countLines(file.content);
    totalLoc += loc;
    const existing = langMap.get(lang) ?? { files: 0, loc: 0 };
    existing.files += 1;
    existing.loc += loc;
    langMap.set(lang, existing);
  }

  return Array.from(langMap.entries())
    .map(([name, stats]) => ({
      name,
      file_count: stats.files,
      loc: stats.loc,
      loc_percent: totalLoc > 0 ? Math.round((stats.loc / totalLoc) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.loc - a.loc);
}

function annotateFiles(files: FileEntry[]): FileAnnotation[] {
  return files.map((f) => ({
    path: f.path,
    type: "file" as const,
    language: detectLanguage(f.path),
    loc: countLines(f.content),
    role: classifyRole(f.path),
  }));
}

function classifyRole(path: string): FileAnnotation["role"] {
  if (isTestFile(path)) return "test";
  if (isConfigFile(path)) return "config";
  if (isDocFile(path)) return "documentation";
  if (isBuildFile(path)) return "build";
  if (isAssetFile(path)) return "asset";
  if (isGeneratedFile(path)) return "generated";
  if (isSourceFile(path)) return "source";
  return "unknown";
}

function isTestFile(path: string): boolean {
  return /\.(test|spec|_test)\.(ts|tsx|js|jsx|py|go|rs)$/.test(path) ||
    path.includes("__tests__/") ||
    path.startsWith("tests/") ||
    path.startsWith("test/");
}

function isConfigFile(path: string): boolean {
  const configPatterns = [
    "tsconfig", "package.json", ".eslintrc", ".prettierrc", ".env",
    "webpack.config", "vite.config", "next.config", "tailwind.config",
    ".babelrc", "jest.config", "vitest.config", "turbo.json",
    "docker-compose", ".dockerignore", ".gitignore", ".editorconfig",
  ];
  return configPatterns.some((p) => path.includes(p)) || path.startsWith(".");
}

function isDocFile(path: string): boolean {
  return /\.(md|mdx|txt|rst|adoc)$/i.test(path) || path.toLowerCase().startsWith("docs/");
}

function isBuildFile(path: string): boolean {
  return path.includes("Makefile") || path.includes("Dockerfile") || path.includes("Jenkinsfile") ||
    path.startsWith(".github/workflows/");
}

function isAssetFile(path: string): boolean {
  return /\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|mp4|webm|pdf)$/i.test(path);
}

function isGeneratedFile(path: string): boolean {
  return path.includes("node_modules/") || path.includes("dist/") || path.includes(".next/") ||
    path.includes("__pycache__/") || path.endsWith(".lock") || path === "pnpm-lock.yaml" ||
    path === "package-lock.json" || path === "yarn.lock";
}

function isSourceFile(path: string): boolean {
  return /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|rb|java|kt|swift|c|cpp|cs|php|vue|svelte)$/.test(path);
}

interface DepGroups {
  production: Record<string, string>;
  development: Record<string, string>;
  peer: Record<string, string>;
}

function extractDependencies(files: FileEntry[]): DepGroups {
  const result: DepGroups = { production: {}, development: {}, peer: {} };
  const pkgFile = files.find((f) => f.path === "package.json");
  if (!pkgFile) return result;

  try {
    const pkg = JSON.parse(pkgFile.content);
    result.production = pkg.dependencies ?? {};
    result.development = pkg.devDependencies ?? {};
    result.peer = pkg.peerDependencies ?? {};
  } catch {
    // invalid JSON — skip
  }
  return result;
}

function flattenDeps(groups: DepGroups): DependencyInfo[] {
  const deps: DependencyInfo[] = [];
  for (const [name, version] of Object.entries(groups.production)) {
    deps.push({ name, version, type: "production" });
  }
  for (const [name, version] of Object.entries(groups.development)) {
    deps.push({ name, version, type: "development" });
  }
  for (const [name, version] of Object.entries(groups.peer)) {
    deps.push({ name, version, type: "peer" });
  }
  return deps;
}

function detectBuildTools(files: FileEntry[], deps: Record<string, string>): string[] {
  const tools: string[] = [];
  if (deps["turbo"] || files.some((f) => f.path === "turbo.json")) tools.push("turbo");
  if (deps["webpack"] || files.some((f) => f.path.includes("webpack.config"))) tools.push("webpack");
  if (deps["vite"] || files.some((f) => f.path.includes("vite.config"))) tools.push("vite");
  if (deps["esbuild"]) tools.push("esbuild");
  if (deps["rollup"] || files.some((f) => f.path.includes("rollup.config"))) tools.push("rollup");
  if (deps["tsup"]) tools.push("tsup");
  if (files.some((f) => f.path === "Makefile")) tools.push("make");
  return tools;
}

function detectTestFrameworks(files: FileEntry[], deps: Record<string, string>): string[] {
  const frameworks: string[] = [];
  if (deps["vitest"] || files.some((f) => f.path.includes("vitest.config"))) frameworks.push("vitest");
  if (deps["jest"] || files.some((f) => f.path.includes("jest.config"))) frameworks.push("jest");
  if (deps["mocha"]) frameworks.push("mocha");
  if (deps["playwright"] || deps["@playwright/test"]) frameworks.push("playwright");
  if (deps["cypress"]) frameworks.push("cypress");
  if (files.some((f) => f.path === "pytest.ini" || f.path === "pyproject.toml" && f.content.includes("[tool.pytest"))) frameworks.push("pytest");
  return frameworks;
}

function detectPackageManagers(files: FileEntry[]): string[] {
  const managers: string[] = [];
  if (files.some((f) => f.path === "pnpm-lock.yaml" || f.path === "pnpm-workspace.yaml")) managers.push("pnpm");
  if (files.some((f) => f.path === "yarn.lock")) managers.push("yarn");
  if (files.some((f) => f.path === "package-lock.json")) managers.push("npm");
  if (files.some((f) => f.path === "Gemfile")) managers.push("bundler");
  if (files.some((f) => f.path === "Cargo.toml")) managers.push("cargo");
  if (files.some((f) => f.path === "go.mod")) managers.push("go modules");
  if (files.some((f) => f.path === "pyproject.toml" || f.path === "requirements.txt")) managers.push("pip");
  return managers;
}

function detectCI(files: FileEntry[]): string | null {
  if (files.some((f) => f.path.startsWith(".github/workflows/"))) return "github_actions";
  if (files.some((f) => f.path === ".gitlab-ci.yml")) return "gitlab_ci";
  if (files.some((f) => f.path.startsWith(".circleci/"))) return "circleci";
  if (files.some((f) => f.path === "Jenkinsfile")) return "jenkins";
  return null;
}

function detectDeployment(files: FileEntry[], deps: Record<string, string>): string | null {
  if (files.some((f) => f.path === "vercel.json") || deps["vercel"]) return "vercel";
  if (files.some((f) => f.path === "netlify.toml")) return "netlify";
  if (files.some((f) => f.path.includes("Dockerfile"))) return "docker";
  if (files.some((f) => f.path.includes("fly.toml"))) return "fly.io";
  if (files.some((f) => f.path === "render.yaml")) return "render";
  if (files.some((f) => f.path.includes("serverless.yml") || f.path.includes("serverless.ts"))) return "serverless";
  return null;
}

function computeTopLevelDirs(files: FileEntry[]): { name: string; purpose: string; file_count: number }[] {
  const dirMap = new Map<string, number>();
  for (const f of files) {
    const parts = f.path.split("/");
    if (parts.length > 1) {
      const dir = parts[0];
      dirMap.set(dir, (dirMap.get(dir) ?? 0) + 1);
    }
  }

  return Array.from(dirMap.entries())
    .map(([name, count]) => ({
      name,
      purpose: guessDirPurpose(name),
      file_count: count,
    }))
    .sort((a, b) => b.file_count - a.file_count);
}

function guessDirPurpose(name: string): string {
  const purposes: Record<string, string> = {
    src: "application_source",
    app: "application_source",
    lib: "library_source",
    pages: "page_routes",
    components: "ui_components",
    api: "api_routes",
    server: "server_source",
    public: "static_assets",
    static: "static_assets",
    assets: "static_assets",
    tests: "test_suites",
    test: "test_suites",
    __tests__: "test_suites",
    spec: "test_suites",
    docs: "documentation",
    scripts: "build_scripts",
    config: "configuration",
    prisma: "database_schema",
    migrations: "database_migrations",
    styles: "stylesheets",
    utils: "utilities",
    helpers: "utilities",
    types: "type_definitions",
    hooks: "react_hooks",
    store: "state_management",
    services: "service_layer",
    middleware: "middleware",
    packages: "monorepo_packages",
    apps: "monorepo_apps",
  };
  return purposes[name.toLowerCase()] ?? "project_directory";
}
