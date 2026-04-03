import type { SnapshotRecord } from "@axis/snapshots";
import type { ParseResult } from "@axis/repo-parser";
import { parseRepo } from "@axis/repo-parser";
import type { ContextMap, RepoProfile } from "./types.js";

export function buildContextMap(snapshot: SnapshotRecord): ContextMap {
  const parsed = parseRepo(snapshot.files);
  const now = new Date().toISOString();

  return {
    version: "1.0.0",
    snapshot_id: snapshot.snapshot_id,
    project_id: snapshot.project_id,
    generated_at: now,
    project_identity: buildProjectIdentity(snapshot, parsed),
    structure: buildStructure(snapshot, parsed),
    detection: {
      languages: parsed.languages,
      frameworks: parsed.frameworks,
      build_tools: parsed.build_tools,
      test_frameworks: parsed.test_frameworks,
      package_managers: parsed.package_managers,
      ci_platform: parsed.ci_platform,
      deployment_target: parsed.deployment_target,
    },
    dependency_graph: buildDependencyGraph(parsed),
    entry_points: detectEntryPoints(snapshot, parsed),
    routes: detectRoutes(snapshot),
    architecture_signals: analyzeArchitecture(snapshot, parsed),
    ai_context: buildAIContext(snapshot, parsed),
  };
}

export function buildRepoProfile(snapshot: SnapshotRecord): RepoProfile {
  const parsed = parseRepo(snapshot.files);
  const now = new Date().toISOString();

  const prodDeps = parsed.dependencies.filter((d) => d.type === "production").length;
  const devDeps = parsed.dependencies.filter((d) => d.type === "development").length;
  const arch = analyzeArchitecture(snapshot, parsed);

  return {
    version: "1.0.0",
    snapshot_id: snapshot.snapshot_id,
    project_id: snapshot.project_id,
    generated_at: now,
    project: buildProjectIdentity(snapshot, parsed),
    detection: {
      languages: parsed.languages,
      frameworks: parsed.frameworks,
      build_tools: parsed.build_tools,
      test_frameworks: parsed.test_frameworks,
      package_managers: parsed.package_managers,
      ci_platform: parsed.ci_platform,
      deployment_target: parsed.deployment_target,
    },
    structure_summary: {
      total_files: snapshot.file_count,
      total_directories: countDirectories(snapshot),
      total_loc: parsed.file_annotations.reduce((s, a) => s + a.loc, 0),
      top_level_dirs: parsed.top_level_dirs,
    },
    health: {
      ...parsed.health,
      dependency_count: prodDeps,
      dev_dependency_count: devDeps,
      architecture_patterns: arch.patterns_detected,
      separation_score: arch.separation_score,
    },
    goals: snapshot.manifest.goals.length > 0
      ? {
          objectives: snapshot.manifest.goals,
          requested_outputs: snapshot.manifest.requested_outputs,
        }
      : null,
  };
}

function buildProjectIdentity(snapshot: SnapshotRecord, parsed: ParseResult): ContextMap["project_identity"] {
  const readme = snapshot.files.find((f) => /^readme\.(md|txt)?$/i.test(f.path));
  const firstLine = readme?.content.split("\n").find((l) => l.trim().length > 0 && !l.startsWith("#"))?.trim() ?? null;

  return {
    name: snapshot.manifest.project_name,
    type: snapshot.manifest.project_type,
    primary_language: parsed.languages[0]?.name ?? "unknown",
    description: firstLine,
    repo_url: null,
  };
}

function buildStructure(snapshot: SnapshotRecord, parsed: ParseResult): ContextMap["structure"] {
  return {
    total_files: snapshot.file_count,
    total_directories: countDirectories(snapshot),
    total_loc: parsed.file_annotations.reduce((s, a) => s + a.loc, 0),
    file_tree_summary: parsed.file_annotations,
    top_level_layout: parsed.top_level_dirs,
  };
}

function countDirectories(snapshot: SnapshotRecord): number {
  const dirs = new Set<string>();
  for (const f of snapshot.files) {
    const parts = f.path.split("/");
    for (let i = 1; i < parts.length; i++) {
      dirs.add(parts.slice(0, i).join("/"));
    }
  }
  return dirs.size;
}

function buildDependencyGraph(parsed: ParseResult): ContextMap["dependency_graph"] {
  const inboundMap = new Map<string, number>();
  const outboundMap = new Map<string, number>();

  for (const edge of parsed.internal_imports) {
    inboundMap.set(edge.target, (inboundMap.get(edge.target) ?? 0) + 1);
    outboundMap.set(edge.source, (outboundMap.get(edge.source) ?? 0) + 1);
  }

  const allFiles = new Set([...inboundMap.keys(), ...outboundMap.keys()]);
  const hotspots = Array.from(allFiles)
    .map((path) => {
      const inbound = inboundMap.get(path) ?? 0;
      const outbound = outboundMap.get(path) ?? 0;
      const total = inbound + outbound;
      return {
        path,
        inbound_count: inbound,
        outbound_count: outbound,
        risk_score: Math.min(total / 20, 1),
      };
    })
    .filter((h) => h.inbound_count >= 3 || h.outbound_count >= 5)
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 20);

  return {
    external_dependencies: parsed.dependencies,
    internal_imports: parsed.internal_imports,
    hotspots,
  };
}

function detectEntryPoints(snapshot: SnapshotRecord, parsed: ParseResult): ContextMap["entry_points"] {
  const entries: ContextMap["entry_points"] = [];

  for (const f of snapshot.files) {
    if (f.path === "src/index.ts" || f.path === "src/index.js" || f.path === "src/main.ts" || f.path === "src/main.js") {
      entries.push({ path: f.path, type: "app_entry", description: "Application entry point" });
    }
    if (f.path === "src/app.ts" || f.path === "src/app.js" || f.path === "app/layout.tsx" || f.path === "app/page.tsx") {
      entries.push({ path: f.path, type: "app_entry", description: "Application root" });
    }
    if (f.path.startsWith("src/pages/api/") || f.path.startsWith("app/api/")) {
      entries.push({ path: f.path, type: "api_route", description: `API route: ${f.path}` });
    }
    if (f.path.match(/^(src\/)?pages\/.*\.(tsx|jsx|ts|js)$/)) {
      entries.push({ path: f.path, type: "page_route", description: `Page: ${f.path}` });
    }
    if (f.path === "src/cli.ts" || f.path === "bin/cli.js") {
      entries.push({ path: f.path, type: "cli_command", description: "CLI entry point" });
    }
  }

  return entries;
}

function detectRoutes(snapshot: SnapshotRecord): ContextMap["routes"] {
  const routes: ContextMap["routes"] = [];

  for (const f of snapshot.files) {
    // Next.js app router
    if (f.path.startsWith("app/") && (f.path.endsWith("/page.tsx") || f.path === "app/page.tsx")) {
      const stripped = f.path.replace(/^app\//, "").replace(/\/?page\.tsx$/, "");
      const route = "/" + stripped.replace(/\[([^\]]+)\]/g, ":$1");
      routes.push({ path: route, method: "GET", source_file: f.path });
    }
    // Next.js API routes
    if (f.path.startsWith("app/api/") && f.path.endsWith("/route.ts")) {
      const route = "/" + f.path.replace("app/", "").replace("/route.ts", "").replace(/\[([^\]]+)\]/g, ":$1");
      const methods = extractHTTPMethods(f.content);
      for (const method of methods) {
        routes.push({ path: route, method, source_file: f.path });
      }
    }
    // Express-style routes
    if (f.content.includes("router.get") || f.content.includes("router.post") || f.content.includes("app.get") || f.content.includes("app.post")) {
      const expressRoutes = extractExpressRoutes(f.path, f.content);
      routes.push(...expressRoutes);
    }
  }

  return routes;
}

function extractHTTPMethods(content: string): string[] {
  const methods: string[] = [];
  if (content.includes("export async function GET") || content.includes("export function GET")) methods.push("GET");
  if (content.includes("export async function POST") || content.includes("export function POST")) methods.push("POST");
  if (content.includes("export async function PUT") || content.includes("export function PUT")) methods.push("PUT");
  if (content.includes("export async function DELETE") || content.includes("export function DELETE")) methods.push("DELETE");
  if (content.includes("export async function PATCH") || content.includes("export function PATCH")) methods.push("PATCH");
  return methods.length > 0 ? methods : ["GET"];
}

function extractExpressRoutes(filePath: string, content: string): ContextMap["routes"] {
  const routes: ContextMap["routes"] = [];
  const routePattern = /(?:router|app)\.(get|post|put|delete|patch)\s*\(\s*["'`]([^"'`]+)["'`]/gi;
  let match: RegExpExecArray | null;
  while ((match = routePattern.exec(content)) !== null) {
    routes.push({
      path: match[2],
      method: match[1].toUpperCase(),
      source_file: filePath,
    });
  }
  return routes;
}

function analyzeArchitecture(snapshot: SnapshotRecord, parsed: ParseResult): ContextMap["architecture_signals"] {
  const patterns: string[] = [];
  const layers: Array<{ layer: string; directories: string[] }> = [];

  const dirNames = new Set(parsed.top_level_dirs.map((d) => d.name.toLowerCase()));

  // Detect patterns
  if (dirNames.has("app") || dirNames.has("pages")) patterns.push("page_based_routing");
  if (dirNames.has("services") && dirNames.has("controllers")) patterns.push("mvc");
  if (dirNames.has("commands") || dirNames.has("queries")) patterns.push("cqrs");
  if (dirNames.has("packages") || dirNames.has("apps")) patterns.push("monorepo");
  if (snapshot.files.some((f) => f.path.includes("serverless"))) patterns.push("serverless");
  if (snapshot.files.some((f) => f.path.includes("Dockerfile"))) patterns.push("containerized");
  if (parsed.frameworks.some((f) => f.name === "Next.js")) patterns.push("nextjs_fullstack");

  // Detect layers
  const layerMapping: Record<string, string> = {
    components: "presentation",
    pages: "presentation",
    app: "presentation",
    api: "api",
    server: "api",
    services: "business_logic",
    lib: "business_logic",
    utils: "shared",
    helpers: "shared",
    prisma: "data",
    models: "data",
    db: "data",
    types: "shared",
  };

  const layerDirs = new Map<string, string[]>();
  for (const dir of parsed.top_level_dirs) {
    const layer = layerMapping[dir.name.toLowerCase()];
    if (layer) {
      const existing = layerDirs.get(layer) ?? [];
      existing.push(dir.name);
      layerDirs.set(layer, existing);
    }
  }
  for (const [layer, dirs] of layerDirs) {
    layers.push({ layer, directories: dirs });
  }

  // Compute separation score (rough)
  const detectedLayers = layers.length;
  const score = Math.min(detectedLayers / 4, 1);

  return {
    patterns_detected: patterns,
    layer_boundaries: layers,
    separation_score: Math.round(score * 100) / 100,
  };
}

function buildAIContext(snapshot: SnapshotRecord, parsed: ParseResult): ContextMap["ai_context"] {
  const primaryLang = parsed.languages[0]?.name ?? "unknown";
  const frameworkNames = parsed.frameworks.map((f) => f.name).join(", ");
  const type = snapshot.manifest.project_type.replace(/_/g, " ");

  const summary = `${snapshot.manifest.project_name} is a ${type} built with ${primaryLang}${frameworkNames ? ` using ${frameworkNames}` : ""}. It contains ${snapshot.file_count} files across ${parsed.top_level_dirs.length} top-level directories.`;

  const conventions: string[] = [];
  if (parsed.health.has_typescript) conventions.push("TypeScript strict mode");
  if (parsed.health.has_linter) conventions.push("Linter configured");
  if (parsed.health.has_formatter) conventions.push("Formatter configured");
  if (parsed.package_managers.includes("pnpm")) conventions.push("pnpm workspaces");

  const warnings: string[] = [];
  if (!parsed.health.has_tests) warnings.push("No test files detected");
  if (!parsed.health.has_ci) warnings.push("No CI/CD pipeline detected");
  if (!parsed.health.has_lockfile) warnings.push("No lockfile found — dependency versions may be inconsistent");
  if (parsed.dependencies.filter((d) => d.type === "production").length > 80) {
    warnings.push("High dependency count (>80) — review for unused packages");
  }

  const abstractions: string[] = [];
  for (const dir of parsed.top_level_dirs.slice(0, 8)) {
    abstractions.push(`${dir.name}/ (${dir.purpose})`);
  }

  return {
    project_summary: summary,
    key_abstractions: abstractions,
    conventions,
    warnings,
  };
}
