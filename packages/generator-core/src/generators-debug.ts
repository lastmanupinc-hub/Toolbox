import type { ContextMap } from "@axis/context-engine";
import type { GeneratedFile } from "./types.js";

export function generateDebugPlaybook(ctx: ContextMap): GeneratedFile {
  const id = ctx.project_identity;
  const lines: string[] = [];

  lines.push(`# Debug Playbook — ${id.name}`);
  lines.push("");
  lines.push(`> Structured debugging guide for a ${id.type.replace(/_/g, " ")} built with ${id.primary_language}`);
  lines.push("");

  // Quick Reference
  lines.push("## Quick Reference");
  lines.push("");
  lines.push("| Item | Value |");
  lines.push("|------|-------|");
  lines.push(`| Language | ${id.primary_language} |`);
  lines.push(`| Frameworks | ${ctx.detection.frameworks.map(f => f.name).join(", ") || "none"} |`);
  lines.push(`| Test Runner | ${ctx.detection.test_frameworks.join(", ") || "none"} |`);
  lines.push(`| CI | ${ctx.detection.ci_platform ?? "none"} |`);
  const pm = ctx.detection.package_managers[0] ?? "npm";
  lines.push(`| Package Manager | ${pm} |`);
  lines.push("");

  // Triage Steps
  lines.push("## Triage Steps");
  lines.push("");
  lines.push("### 1. Reproduce");
  lines.push("");
  lines.push("```bash");
  lines.push(`${pm} install`);
  if (ctx.detection.test_frameworks.length > 0) {
    lines.push(`${pm} test           # run existing tests`);
  }
  lines.push(`${pm} run dev         # start dev server`);
  lines.push("```");
  lines.push("");

  lines.push("### 2. Isolate");
  lines.push("");
  lines.push("Check these files first based on the dependency graph:");
  lines.push("");

  // Entry points as primary suspects
  for (const ep of ctx.entry_points.slice(0, 5)) {
    lines.push(`- \`${ep.path}\` — ${ep.description}`);
  }
  lines.push("");

  // Hotspots
  if (ctx.dependency_graph.hotspots.length > 0) {
    lines.push("### High-Risk Files (Dependency Hotspots)");
    lines.push("");
    lines.push("These files have many inbound or outbound imports — changes here cascade:");
    lines.push("");
    for (const h of ctx.dependency_graph.hotspots.slice(0, 10)) {
      lines.push(`- \`${h.path}\` — ${h.inbound_count} importers, ${h.outbound_count} imports (risk: ${(h.risk_score * 100).toFixed(0)}%)`);
    }
    lines.push("");
  }

  // Framework-specific debugging
  lines.push("### 3. Framework-Specific Debugging");
  lines.push("");

  if (ctx.detection.frameworks.some(f => f.name === "Next.js")) {
    lines.push("#### Next.js");
    lines.push("");
    lines.push("- **Build errors:** `next build` — check for missing exports or type errors");
    lines.push("- **Hydration mismatches:** Check Server vs Client component boundaries");
    lines.push("- **API route errors:** Check `app/api/` route handlers — ensure proper Response returns");
    lines.push("- **Data fetching:** Verify `fetch()` calls in Server Components aren't cached unexpectedly");
    lines.push("- **Middleware:** Check `middleware.ts` for request interception issues");
    lines.push("");
  }

  if (ctx.detection.frameworks.some(f => f.name === "React")) {
    lines.push("#### React");
    lines.push("");
    lines.push("- **State bugs:** Check for stale closures in `useEffect` and `useCallback`");
    lines.push("- **Re-render loops:** Add `React.StrictMode` (already on if using Next.js)");
    lines.push("- **Props drilling:** Check component hierarchy for unnecessary prop chains");
    lines.push("");
  }

  if (ctx.detection.frameworks.some(f => f.name === "Prisma")) {
    lines.push("#### Prisma");
    lines.push("");
    lines.push("- **Migration issues:** `prisma migrate dev --name <name>`");
    lines.push("- **Query errors:** Enable `log: ['query']` in PrismaClient constructor");
    lines.push("- **Connection errors:** Check `DATABASE_URL` in `.env`");
    lines.push("- **Schema drift:** `prisma db pull` to check production schema matches");
    lines.push("");
  }

  if (ctx.detection.frameworks.some(f => f.name === "Express" || f.name === "Fastify")) {
    lines.push("#### API Server");
    lines.push("");
    lines.push("- **Route 404:** Verify route registration order — catch-all routes must be last");
    lines.push("- **Middleware errors:** Check error-handling middleware order");
    lines.push("- **CORS:** Verify origin whitelist and preflight handling");
    lines.push("");
  }

  // Routes table
  if (ctx.routes.length > 0) {
    lines.push("### Route Map");
    lines.push("");
    lines.push("| Method | Path | Source |");
    lines.push("|--------|------|--------|");
    for (const r of ctx.routes) {
      lines.push(`| ${r.method} | \`${r.path}\` | ${r.source_file} |`);
    }
    lines.push("");
  }

  // Architecture boundaries
  if (ctx.architecture_signals.layer_boundaries.length > 0) {
    lines.push("### 4. Check Layer Boundaries");
    lines.push("");
    lines.push("Bugs often occur at layer boundaries. Verify data flow between:");
    lines.push("");
    for (const l of ctx.architecture_signals.layer_boundaries) {
      lines.push(`- **${l.layer}**: ${l.directories.join(", ")}`);
    }
    lines.push("");
  }

  // Common traps
  lines.push("### 5. Common Traps");
  lines.push("");
  if (!ctx.ai_context.conventions.some(c => c.includes("Linter")))
    lines.push("- ⚠️ No linter configured — silent type/syntax errors possible");
  if (!ctx.ai_context.conventions.some(c => c.includes("Formatter")))
    lines.push("- ⚠️ No formatter — inconsistent whitespace can mask diffs");
  for (const w of ctx.ai_context.warnings) {
    lines.push(`- ⚠️ ${w}`);
  }
  if (ctx.ai_context.warnings.length === 0 && ctx.ai_context.conventions.some(c => c.includes("Linter")))
    lines.push("- None detected — project health looks good");
  lines.push("");

  lines.push("---");
  lines.push("*Generated by Axis Debug*");
  lines.push("");

  return {
    path: ".ai/debug-playbook.md",
    content: lines.join("\n"),
    content_type: "text/markdown",
    program: "debug",
    description: "Structured debugging playbook with framework-specific steps, hotspots, and common traps",
  };
}

export function generateIncidentTemplate(ctx: ContextMap): GeneratedFile {
  const lines: string[] = [];

  lines.push(`# Incident Report — ${ctx.project_identity.name}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("**Date:** YYYY-MM-DD");
  lines.push("**Severity:** P0 / P1 / P2 / P3");
  lines.push("**Status:** investigating / identified / resolved");
  lines.push("**Reporter:**");
  lines.push("");
  lines.push("## Description");
  lines.push("");
  lines.push("<!-- What happened? What was the expected behavior? -->");
  lines.push("");
  lines.push("## Reproduction Steps");
  lines.push("");
  lines.push("1. ");
  lines.push("2. ");
  lines.push("3. ");
  lines.push("");
  lines.push("## Impact");
  lines.push("");
  lines.push("- **Users affected:**");
  lines.push("- **Features affected:**");
  lines.push("- **Data impact:**");
  lines.push("");
  lines.push("## Root Cause");
  lines.push("");
  lines.push("<!-- What went wrong? Which file/function? -->");
  lines.push("");

  if (ctx.dependency_graph.hotspots.length > 0) {
    lines.push("### Likely Suspect Files");
    lines.push("");
    for (const h of ctx.dependency_graph.hotspots.slice(0, 5)) {
      lines.push(`- [ ] \`${h.path}\` (${h.inbound_count} inbound, risk ${(h.risk_score * 100).toFixed(0)}%)`);
    }
    lines.push("");
  }

  lines.push("## Fix");
  lines.push("");
  lines.push("- **Commit:**");
  lines.push("- **PR:**");
  lines.push("- **Test added:** yes / no");
  lines.push("");
  lines.push("## Timeline");
  lines.push("");
  lines.push("| Time | Event |");
  lines.push("|------|-------|");
  lines.push("| | Issue reported |");
  lines.push("| | Investigation started |");
  lines.push("| | Root cause identified |");
  lines.push("| | Fix deployed |");
  lines.push("| | Verified resolved |");
  lines.push("");
  lines.push("## Follow-up");
  lines.push("");
  lines.push("- [ ] Post-mortem completed");
  lines.push("- [ ] Monitoring added");
  lines.push("- [ ] Documentation updated");
  lines.push("");
  lines.push("---");
  lines.push("*Generated by Axis Debug*");
  lines.push("");

  return {
    path: "incident-template.md",
    content: lines.join("\n"),
    content_type: "text/markdown",
    program: "debug",
    description: "Incident report template with project-aware suspect files",
  };
}

export function generateTracingRules(ctx: ContextMap): GeneratedFile {
  const id = ctx.project_identity;
  const lines: string[] = [];

  lines.push(`# Tracing Rules — ${id.name}`);
  lines.push("");
  lines.push("## Purpose");
  lines.push("");
  lines.push("Define which code paths should be traced, logged, or monitored.");
  lines.push("");

  // Entry points to trace
  lines.push("## Trace Points");
  lines.push("");

  if (ctx.routes.length > 0) {
    lines.push("### API Routes");
    lines.push("");
    lines.push("All API routes should log: request method, path, status code, duration (ms).");
    lines.push("");
    for (const r of ctx.routes.filter(r => r.path.includes("api"))) {
      lines.push(`- \`${r.method} ${r.path}\` → ${r.source_file}`);
    }
    lines.push("");
  }

  if (ctx.entry_points.length > 0) {
    lines.push("### Entry Points");
    lines.push("");
    for (const ep of ctx.entry_points) {
      lines.push(`- \`${ep.path}\` (${ep.type})`);
    }
    lines.push("");
  }

  // Framework-specific tracing
  if (ctx.detection.frameworks.some(f => f.name === "Prisma")) {
    lines.push("### Database Queries");
    lines.push("");
    lines.push("Enable Prisma query logging in development:");
    lines.push("");
    lines.push("```typescript");
    lines.push("const prisma = new PrismaClient({");
    lines.push("  log: [");
    lines.push("    { level: 'query', emit: 'event' },");
    lines.push("    { level: 'warn', emit: 'stdout' },");
    lines.push("    { level: 'error', emit: 'stdout' },");
    lines.push("  ],");
    lines.push("});");
    lines.push("```");
    lines.push("");
  }

  // Hotspot monitoring
  if (ctx.dependency_graph.hotspots.length > 0) {
    lines.push("### Hotspot Monitoring");
    lines.push("");
    lines.push("These high-connectivity files should be monitored for regressions:");
    lines.push("");
    for (const h of ctx.dependency_graph.hotspots.slice(0, 8)) {
      lines.push(`- \`${h.path}\` — watch for: import changes, export signature changes`);
    }
    lines.push("");
  }

  // Layer boundary monitoring
  if (ctx.architecture_signals.layer_boundaries.length > 0) {
    lines.push("### Layer Boundary Rules");
    lines.push("");
    lines.push("Monitor for layer violations:");
    lines.push("");
    for (const l of ctx.architecture_signals.layer_boundaries) {
      if (l.layer === "data") {
        lines.push(`- **${l.layer}** (${l.directories.join(", ")}): Only business_logic layer should import directly`);
      } else if (l.layer === "presentation") {
        lines.push(`- **${l.layer}** (${l.directories.join(", ")}): Should not import from data layer directly`);
      } else {
        lines.push(`- **${l.layer}** (${l.directories.join(", ")}): Standard import rules apply`);
      }
    }
    lines.push("");
  }

  lines.push("## Log Format");
  lines.push("");
  lines.push("```");
  lines.push("[TIMESTAMP] [LEVEL] [TRACE_ID] [COMPONENT] message");
  lines.push("```");
  lines.push("");
  lines.push("## Retention");
  lines.push("");
  lines.push("- **Debug logs:** 7 days");
  lines.push("- **Info logs:** 30 days");
  lines.push("- **Error logs:** 90 days");
  lines.push("- **Audit logs:** 1 year");
  lines.push("");
  lines.push("---");
  lines.push("*Generated by Axis Debug*");
  lines.push("");

  return {
    path: "tracing-rules.md",
    content: lines.join("\n"),
    content_type: "text/markdown",
    program: "debug",
    description: "Tracing and logging rules derived from project architecture and routes",
  };
}
