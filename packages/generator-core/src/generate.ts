import type { ContextMap, RepoProfile } from "@axis/context-engine";
import type { GeneratedFile, GeneratorInput, GeneratorResult } from "./types.js";
import { generateContextMapJSON, generateRepoProfileYAML, generateArchitectureSummary } from "./generators-search.js";
import { generateAgentsMD, generateClaudeMD, generateCursorRules } from "./generators-skills.js";

type GeneratorFn = (ctx: ContextMap, profile: RepoProfile) => GeneratedFile;

const REGISTRY: Record<string, GeneratorFn> = {
  ".ai/context-map.json": (ctx) => generateContextMapJSON(ctx),
  ".ai/repo-profile.yaml": (_ctx, profile) => generateRepoProfileYAML(profile),
  "architecture-summary.md": (ctx) => generateArchitectureSummary(ctx),
  "AGENTS.md": (ctx) => generateAgentsMD(ctx),
  "CLAUDE.md": (ctx) => generateClaudeMD(ctx),
  ".cursorrules": (ctx) => generateCursorRules(ctx),
};

// Aliases (user may request with different naming)
const ALIASES: Record<string, string> = {
  "CURSOR.md": ".cursorrules",
  "context-map.json": ".ai/context-map.json",
  "repo-profile.yaml": ".ai/repo-profile.yaml",
  ".ai/project-profile.yaml": ".ai/repo-profile.yaml",
};

export function generateFiles(input: GeneratorInput): GeneratorResult {
  const { context_map, repo_profile, requested_outputs } = input;
  const files: GeneratedFile[] = [];
  const skipped: Array<{ path: string; reason: string }> = [];

  // Always include the core search outputs
  const outputSet = new Set(requested_outputs);
  outputSet.add(".ai/context-map.json");
  outputSet.add(".ai/repo-profile.yaml");
  outputSet.add("architecture-summary.md");

  for (const requested of outputSet) {
    const resolved = ALIASES[requested] ?? requested;
    const generator = REGISTRY[resolved];

    if (generator) {
      files.push(generator(context_map, repo_profile));
    } else {
      skipped.push({ path: requested, reason: "No generator registered for this output" });
    }
  }

  // Deduplicate by path (in case aliases pointed to already-included outputs)
  const seen = new Set<string>();
  const deduped = files.filter(f => {
    if (seen.has(f.path)) return false;
    seen.add(f.path);
    return true;
  });

  return {
    snapshot_id: context_map.snapshot_id,
    project_id: context_map.project_id,
    generated_at: new Date().toISOString(),
    files: deduped,
    skipped,
  };
}

export function listAvailableGenerators(): Array<{ path: string; program: string }> {
  return Object.entries(REGISTRY).map(([path, fn]) => {
    // Call with null to get metadata — safe because we only read path/program
    const dummy = fn as unknown as { toString: () => string };
    return { path, program: path.startsWith(".ai/") || path === "architecture-summary.md" ? "search" : "skills" };
  });
}
