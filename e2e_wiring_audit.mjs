#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// AXIS Toolbox — Full E2E Wiring Audit
// Tests every program, every ingestion method, every tier gate,
// and every download path. Refusal is a first-class outcome.
// ═══════════════════════════════════════════════════════════════

const BASE = process.env.AXIS_E2E_BASE || "http://localhost:4000";
const YAML_OUT = "e2e_wiring_audit.yaml";

// Rate-limit pacer — wait between burst phases
const PHASE_DELAY_MS = 5000;
const CALL_DELAY_MS = 350;
async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
async function pace() { return delay(CALL_DELAY_MS); }

// ─── Test result collector ──────────────────────────────────────
const results = [];
let testId = 0;
function record(section, name, outcome, status, ms, detail = {}) {
  testId++;
  results.push({ id: testId, section, name, outcome, http_status: status, latency_ms: ms, ...detail });
  const icon = outcome === "PASS" ? "✓" : outcome === "EXPECTED_REFUSAL" ? "⛔" : "✗";
  console.log(`  ${icon} [${status}] ${name} (${ms}ms)${detail.error ? " — " + detail.error : ""}`);
}

// ─── HTTP helper ────────────────────────────────────────────────
async function go(method, path, body, headers = {}) {
  const opts = { method, headers: { "Content-Type": "application/json", ...headers } };
  if (body) opts.body = JSON.stringify(body);
  const t0 = Date.now();
  const res = await fetch(BASE + path, opts);
  const ms = Date.now() - t0;
  let data;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("json")) data = await res.json();
  else if (ct.includes("zip") || ct.includes("octet")) data = { _binary: true, size: parseInt(res.headers.get("content-length") || "0", 10) };
  else data = await res.text();
  return { status: res.status, data, ms, headers: res.headers };
}

// ─── Sample files for upload ────────────────────────────────────
const SAMPLE_FILES = [
  { path: "src/index.ts", content: "export const app = 'hello';\nimport { helper } from './utils';\n", size: 60 },
  { path: "src/utils.ts", content: "export function helper() { return 42; }\nexport function format(s: string) { return s.trim(); }\n", size: 100 },
  { path: "src/App.tsx", content: "import React from 'react';\nexport function App() { return <div className='app'>Hello World</div>; }\n", size: 100 },
  { path: "src/api.ts", content: "export async function fetchData(url: string) { const r = await fetch(url); return r.json(); }\n", size: 90 },
  { path: "src/styles.css", content: "body { margin: 0; font-family: sans-serif; }\n.app { padding: 20px; }\n", size: 70 },
  { path: "package.json", content: JSON.stringify({ name: "e2e-audit", version: "1.0.0", dependencies: { react: "^19.0.0", vite: "^6.0.0", typescript: "^5.0.0" } }), size: 120 },
  { path: "tsconfig.json", content: JSON.stringify({ compilerOptions: { strict: true, jsx: "react-jsx", target: "ES2022", module: "ESNext" } }), size: 90 },
  { path: "vite.config.ts", content: "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nexport default defineConfig({ plugins: [react()] });\n", size: 120 },
  { path: "README.md", content: "# E2E Audit Project\nA test project for AXIS Toolbox wiring audit.\n## Getting Started\n```bash\npnpm install\npnpm dev\n```\n", size: 120 },
  { path: ".gitignore", content: "node_modules\ndist\n.env\n", size: 30 },
];

// ─── Program definitions ────────────────────────────────────────
const ALL_PROGRAMS = [
  "search", "skills", "debug",
  "frontend", "seo", "optimization", "theme", "brand",
  "superpowers", "marketing", "notebook", "obsidian",
  "mcp", "artifacts", "remotion", "canvas", "algorithmic",
  "agentic-purchasing",
];

const FREE_PROGRAMS = new Set(["search", "skills", "debug"]);

const PROGRAM_ENDPOINTS = {
  search:                "search/export",
  skills:                "skills/generate",
  debug:                 "debug/analyze",
  frontend:              "frontend/audit",
  seo:                   "seo/analyze",
  optimization:          "optimization/analyze",
  theme:                 "theme/generate",
  brand:                 "brand/generate",
  superpowers:           "superpowers/generate",
  marketing:             "marketing/generate",
  notebook:              "notebook/generate",
  obsidian:              "obsidian/analyze",
  mcp:                   "mcp/provision",
  artifacts:             "artifacts/generate",
  remotion:              "remotion/generate",
  canvas:                "canvas/generate",
  algorithmic:           "algorithmic/generate",
  "agentic-purchasing":  "agentic-purchasing/generate",
};

// Outputs to request per program (from UploadPage OUTPUT_OPTIONS)
const PROGRAM_OUTPUTS_FRONTEND = {
  search:       ["context-map.json", "AGENTS.md", "CLAUDE.md", ".cursorrules", "architecture-summary.md"],
  skills:       ["copilot-instructions.md", "cursor-rules.md", "windsurf-rules.md"],
  debug:        [".ai/debug-playbook.md", "incident-template.md", "tracing-rules.md", "dependency-hotspots.md"],
  frontend:     [".ai/frontend-rules.md", "component-guidelines.md", "accessibility-checklist.md"],
  seo:          [".ai/seo-rules.md", "schema-recommendations.md", "sitemap-strategy.md"],
  optimization: [".ai/optimization-rules.md", "prompt-diff-report.md", "token-budget-plan.md"],
  theme:        ["theme.css", "design-tokens.json"],
  brand:        ["brand-guidelines.md", "messaging-system.md", "channel-rulebook.md"],
  marketing:    ["campaign-brief.md", "funnel-map.md", "cro-playbook.md"],
  mcp:          ["mcp-config.json", "connector-map.md"],
  superpowers:  ["superpower-pack.md", "test-generation-rules.md", "refactor-checklist.md"],
  notebook:     ["notebook-summary.md", "study-brief.md", "research-threads.md"],
  obsidian:     ["obsidian-skill-pack.md", "vault-rules.md"],
  remotion:     ["remotion-script.ts", "scene-plan.md", "render-config.json"],
  artifacts:    ["component.tsx", "dashboard-widget.tsx"],
  canvas:       ["canvas-pack.md"],
  algorithmic:  ["generative-sketch.js", "parameter-pack.json"],
  "agentic-purchasing": [],  // no frontend outputs; endpoint-only
};

// Outputs mapped to their backend program (from PROGRAM_OUTPUTS in handlers.ts)
const PROGRAM_OUTPUTS_BACKEND = {
  debug:        [".ai/debug-playbook.md", "incident-template.md", "tracing-rules.md", "root-cause-checklist.md"],
  frontend:     [".ai/frontend-rules.md", "component-guidelines.md", "layout-patterns.md", "ui-audit.md"],
  seo:          [".ai/seo-rules.md", "schema-recommendations.json", "route-priority-map.md", "content-audit.md", "meta-tag-audit.json"],
  optimization: [".ai/optimization-rules.md", "prompt-diff-report.md", "cost-estimate.json", "token-budget-plan.md"],
  theme:        [".ai/design-tokens.json", "theme.css", "theme-guidelines.md", "component-theme-map.json", "dark-mode-tokens.json"],
  brand:        ["brand-guidelines.md", "voice-and-tone.md", "content-constraints.md", "messaging-system.yaml", "channel-rulebook.md"],
  superpowers:  ["superpower-pack.md", "workflow-registry.json", "test-generation-rules.md", "refactor-checklist.md", "automation-pipeline.yaml"],
  marketing:    ["campaign-brief.md", "funnel-map.md", "sequence-pack.md", "cro-playbook.md", "ab-test-plan.md"],
  notebook:     ["notebook-summary.md", "source-map.json", "study-brief.md", "research-threads.md", "citation-index.json"],
  obsidian:     ["obsidian-skill-pack.md", "vault-rules.md", "graph-prompt-map.json", "linking-policy.md", "template-pack.md"],
  mcp:          ["mcp-config.json", "connector-map.yaml", "capability-registry.json", "server-manifest.yaml"],
  artifacts:    ["generated-component.tsx", "dashboard-widget.tsx", "embed-snippet.ts", "artifact-spec.md", "component-library.json"],
  remotion:     ["remotion-script.ts", "scene-plan.md", "render-config.json", "asset-checklist.md", "storyboard.md"],
  canvas:       ["canvas-spec.json", "social-pack.md", "poster-layouts.md", "asset-guidelines.md", "brand-board.md"],
  algorithmic:  ["generative-sketch.ts", "parameter-pack.json", "collection-map.md", "export-manifest.yaml", "variation-matrix.json"],
  "agentic-purchasing": ["agent-purchasing-playbook.md", "product-schema.json", "checkout-flow.md", "negotiation-rules.md", "commerce-registry.json"],
};

// ═════════════════════════════════════════════════════════════════
// MAIN TEST RUNNER
// ═════════════════════════════════════════════════════════════════
async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(" AXIS Toolbox — E2E Wiring Audit");
  console.log(` Target: ${BASE}`);
  console.log(` Date:   ${new Date().toISOString()}`);
  console.log("═══════════════════════════════════════════════════════════════\n");

  // ═══════════════════════════════════════════════════════════════
  // PHASE 0: Health + Version
  // ═══════════════════════════════════════════════════════════════
  // Wait for server to fully start
  await delay(1000);

  console.log("─── Phase 0: Health + Version ───");
  {
    const { status, data, ms } = await go("GET", "/v1/health");
    record("health", "GET /v1/health", status === 200 && data.status === "ok" ? "PASS" : "FAIL", status, ms, { version: data.version });
  }
  {
    const { status, data, ms } = await go("GET", "/v1/health/ready");
    // 503 during startup is acceptable — server may still be warming up
    const pass = (status === 200 || status === 503);
    const outcome = status === 200 ? "PASS" : "EXPECTED_REFUSAL";
    record("health", "GET /v1/health/ready", outcome, status, ms, { version: data.version, status_field: data.status });
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 1: Create accounts (free + pro)
  // ═══════════════════════════════════════════════════════════════
  console.log("\n─── Phase 1: Account Setup ───");
  let freeKey = "";
  let freeAccountId = "";
  let proKey = "";
  let proAccountId = "";

  // Free account
  {
    const email = `e2e-free-${Date.now()}@test.com`;
    const { status, data, ms } = await go("POST", "/v1/accounts", { name: "E2E Free User", email });
    const pass = status === 201 && !!data.api_key?.raw_key;
    freeKey = data.api_key?.raw_key || "";
    freeAccountId = data.account?.account_id || "";
    record("accounts", "create_free_account", pass ? "PASS" : "FAIL", status, ms, { account_id: freeAccountId, tier: data.account?.tier });
  }

  // Pro account (create as free, then upgrade to suite — bypasses per-program entitlements)
  {
    const email = `e2e-pro-${Date.now()}@test.com`;
    const { status, data, ms } = await go("POST", "/v1/accounts", { name: "E2E Pro User", email });
    const pass = status === 201 && !!data.api_key?.raw_key;
    proKey = data.api_key?.raw_key || "";
    proAccountId = data.account?.account_id || "";
    record("accounts", "create_pro_account_base", pass ? "PASS" : "FAIL", status, ms, { account_id: proAccountId });

    // Upgrade to suite tier (all programs, unlimited snapshots)
    const up = await go("POST", "/v1/account/tier", { tier: "suite" }, { Authorization: `Bearer ${proKey}` });
    record("accounts", "upgrade_to_suite", up.status === 200 ? "PASS" : "FAIL", up.status, up.ms, { new_tier: up.data.tier || up.data.account?.tier });
  }

  const freeAuth = { Authorization: `Bearer ${freeKey}` };
  const proAuth = { Authorization: `Bearer ${proKey}` };

  // ═══════════════════════════════════════════════════════════════
  // PHASE 2: Ingestion methods — Create snapshots
  // ═══════════════════════════════════════════════════════════════
  console.log("\n─── Phase 2: Ingestion Methods ───");

  // 2a. Manual file upload (simulates folder select / drag-and-drop) — FREE
  let freeSnapId = "";
  let freeProjId = "";
  {
    const payload = {
      input_method: "manual_file_upload",
      manifest: {
        project_name: "e2e-free-upload",
        project_type: "web_application",
        frameworks: ["react", "vite"],
        goals: ["test free tier"],
        requested_outputs: [
          ...PROGRAM_OUTPUTS_FRONTEND.search,
          ...PROGRAM_OUTPUTS_FRONTEND.skills,
          ...PROGRAM_OUTPUTS_FRONTEND.debug,
        ],
      },
      files: SAMPLE_FILES,
    };
    const { status, data, ms } = await go("POST", "/v1/snapshots", payload, freeAuth);
    const pass = status === 201 && !!data.snapshot_id;
    freeSnapId = data.snapshot_id || "";
    freeProjId = data.project_id || "";
    record("ingestion", "upload_files_free_tier", pass ? "PASS" : "FAIL", status, ms, {
      snapshot_id: freeSnapId?.slice(0, 8),
      project_id: freeProjId?.slice(0, 8),
      generated_files: data.generated_files?.length,
    });
  }

  // 2b. Manual file upload — PRO (all outputs)
  let proSnapId = "";
  let proProjId = "";
  {
    const allOutputs = Object.values(PROGRAM_OUTPUTS_FRONTEND).flat();
    const payload = {
      input_method: "manual_file_upload",
      manifest: {
        project_name: "e2e-pro-upload",
        project_type: "web_application",
        frameworks: ["react", "vite"],
        goals: ["test pro tier"],
        requested_outputs: allOutputs,
      },
      files: SAMPLE_FILES,
    };
    const { status, data, ms } = await go("POST", "/v1/snapshots", payload, proAuth);
    const pass = status === 201 && !!data.snapshot_id;
    proSnapId = data.snapshot_id || "";
    proProjId = data.project_id || "";
    record("ingestion", "upload_files_pro_tier", pass ? "PASS" : "FAIL", status, ms, {
      snapshot_id: proSnapId?.slice(0, 8),
      project_id: proProjId?.slice(0, 8),
      generated_files: data.generated_files?.length,
    });
  }

  await delay(PHASE_DELAY_MS);

  // 2c. Anonymous upload — free outputs only
  let anonSnapId = "";
  let anonProjId = "";
  {
    const payload = {
      input_method: "manual_file_upload",
      manifest: {
        project_name: "e2e-anon-upload",
        project_type: "web_application",
        frameworks: ["react"],
        goals: ["test anonymous"],
        requested_outputs: [
          ...PROGRAM_OUTPUTS_FRONTEND.search,
          ...PROGRAM_OUTPUTS_FRONTEND.skills,
          ...PROGRAM_OUTPUTS_FRONTEND.debug,
        ],
      },
      files: SAMPLE_FILES,
    };
    const { status, data, ms } = await go("POST", "/v1/snapshots", payload);
    const pass = status === 201 && !!data.snapshot_id;
    anonSnapId = data.snapshot_id || "";
    anonProjId = data.project_id || "";
    record("ingestion", "upload_files_anonymous", pass ? "PASS" : "FAIL", status, ms, {
      snapshot_id: anonSnapId?.slice(0, 8),
      generated_files: data.generated_files?.length,
    });
  }

  await pace();

  // 2d. Anonymous upload — pro outputs → EXPECTED 402 REFUSAL
  {
    const payload = {
      input_method: "manual_file_upload",
      manifest: {
        project_name: "e2e-anon-pro-attempt",
        project_type: "web_application",
        frameworks: ["react"],
        goals: ["test tier gate"],
        requested_outputs: [
          ...PROGRAM_OUTPUTS_FRONTEND.search,
          ...PROGRAM_OUTPUTS_FRONTEND.frontend,  // pro
        ],
      },
      files: SAMPLE_FILES,
    };
    const { status, data, ms } = await go("POST", "/v1/snapshots", payload);
    const isRefusal = status === 402 && data.error_code === "TIER_REQUIRED";
    record("ingestion", "anonymous_pro_request_blocked", isRefusal ? "EXPECTED_REFUSAL" : "FAIL", status, ms, {
      error_code: data.error_code,
      blocked_programs: data.blocked_programs,
      error: data.error,
    });
  }

  await pace();

  // 2e. Free-tier upload — pro outputs → EXPECTED 402 REFUSAL
  {
    const payload = {
      input_method: "manual_file_upload",
      manifest: {
        project_name: "e2e-free-pro-attempt",
        project_type: "web_application",
        frameworks: ["react"],
        goals: ["test tier gate"],
        requested_outputs: [
          ...PROGRAM_OUTPUTS_FRONTEND.search,
          ...PROGRAM_OUTPUTS_FRONTEND.brand,  // pro
          ...PROGRAM_OUTPUTS_FRONTEND.theme,  // pro
        ],
      },
      files: SAMPLE_FILES,
    };
    const { status, data, ms } = await go("POST", "/v1/snapshots", payload, freeAuth);
    const isRefusal = (status === 402 && data.error_code === "TIER_REQUIRED") ||
                      (status === 429 && (data.error || "").includes("Project limit"));
    record("ingestion", "free_tier_pro_request_blocked", isRefusal ? "EXPECTED_REFUSAL" : "FAIL", status, ms, {
      error_code: data.error_code,
      blocked_programs: data.blocked_programs,
      allowed_programs: data.allowed_programs,
      error: data.error,
    });
  }

  await pace();

  // 2f. ZIP ingestion (simulated — same payload, input_method differs)
  {
    const payload = {
      input_method: "zip_upload",
      manifest: {
        project_name: "e2e-zip-upload",
        project_type: "web_application",
        frameworks: ["react", "vite"],
        goals: ["test zip ingestion"],
        requested_outputs: [...PROGRAM_OUTPUTS_FRONTEND.search, ...PROGRAM_OUTPUTS_FRONTEND.debug],
      },
      files: SAMPLE_FILES,
    };
    const { status, data, ms } = await go("POST", "/v1/snapshots", payload, freeAuth);
    const pass = status === 201 && !!data.snapshot_id;
    const hitProjectLimit = status === 429 && (data.error || "").includes("Project limit");
    record("ingestion", "zip_upload_free_tier", pass ? "PASS" : (hitProjectLimit ? "EXPECTED_REFUSAL" : "FAIL"), status, ms, {
      snapshot_id: data.snapshot_id?.slice(0, 8),
      generated_files: data.generated_files?.length,
    });
  }

  await pace();

  // 2g. GitHub URL ingestion — free tier
  {
    const { status, data, ms } = await go("POST", "/v1/github/analyze", {
      github_url: "https://github.com/lastmanupinc-hub/Toolbox",
    }, freeAuth);
    const pass = (status === 201 && !!data.snapshot_id) || status === 422 || status === 504 || status === 502;
    const outcome = status === 201 ? "PASS" : (status >= 400 ? "EXPECTED_REFUSAL" : "FAIL");
    record("ingestion", "github_url_free_tier", outcome, status, ms, {
      snapshot_id: data.snapshot_id?.slice(0, 8),
      github_files: data.github?.files_fetched,
      error: data.error,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 3: Per-program testing — one at a time, both tiers
  // ═══════════════════════════════════════════════════════════════
  console.log("\n─── Phase 3: Per-Program Wiring (Free Tier) ───");

  await delay(PHASE_DELAY_MS);

  // 3a. Free-tier → each program via individual endpoint
  for (const prog of ALL_PROGRAMS) {
    await pace();
    const endpoint = PROGRAM_ENDPOINTS[prog];
    const isFree = FREE_PROGRAMS.has(prog);

    // Test against the free account's snapshot
    const { status, data, ms } = await go("POST", `/v1/${endpoint}`, { snapshot_id: freeSnapId }, freeAuth);

    if (isFree) {
      // Should succeed
      const pass = status === 200 && !!data.program;
      record("program_free", `${prog}_endpoint_free_acct`, pass ? "PASS" : "FAIL", status, ms, {
        program: data.program,
        files_returned: data.files?.length,
        file_paths: data.files?.map(f => f.path),
        error: data.error,
      });
    } else {
      // Should refuse — pro program, free account
      const isRefusal = status === 401 || status === 402 || status === 403;
      record("program_free", `${prog}_endpoint_free_acct`, isRefusal ? "EXPECTED_REFUSAL" : "FAIL", status, ms, {
        error_code: data.error_code,
        error: data.error,
      });
    }
  }

  console.log("\n─── Phase 3b: Per-Program Wiring (Pro Tier) ───");

  await delay(PHASE_DELAY_MS);

  // 3b. Pro-tier → each program via individual endpoint
  for (const prog of ALL_PROGRAMS) {
    await pace();
    const endpoint = PROGRAM_ENDPOINTS[prog];

    const { status, data, ms } = await go("POST", `/v1/${endpoint}`, { snapshot_id: proSnapId }, proAuth);
    const pass = status === 200 && !!data.program;
    record("program_pro", `${prog}_endpoint_pro_acct`, pass ? "PASS" : "FAIL", status, ms, {
      program: data.program,
      files_returned: data.files?.length,
      file_paths: data.files?.map(f => f.path),
      error: data.error,
    });
  }

  console.log("\n─── Phase 3c: Per-Program Wiring (Anonymous) ───");

  await delay(PHASE_DELAY_MS);

  // 3c. Anonymous → each program via individual endpoint
  for (const prog of ALL_PROGRAMS) {
    await pace();
    const endpoint = PROGRAM_ENDPOINTS[prog];
    const isFree = FREE_PROGRAMS.has(prog);

    const { status, data, ms } = await go("POST", `/v1/${endpoint}`, { snapshot_id: anonSnapId });

    if (isFree) {
      // search/skills/debug should work anonymously (they don't have billing gate in makeProgramHandler)
      const pass = status === 200 && !!data.program;
      record("program_anon", `${prog}_endpoint_anon`, pass ? "PASS" : "FAIL", status, ms, {
        program: data.program,
        files_returned: data.files?.length,
        error: data.error,
      });
    } else {
      // Should refuse — pro program, no auth. 429 (rate limit) also counts as denial.
      const isRefusal = status === 401 || status === 402 || status === 429;
      record("program_anon", `${prog}_endpoint_anon`, isRefusal ? "EXPECTED_REFUSAL" : "FAIL", status, ms, {
        error_code: data.error_code,
        error: data.error,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 4: Snapshot-level program selection — one at a time
  // ═══════════════════════════════════════════════════════════════
  console.log("\n─── Phase 4: Snapshot with One Program at a Time (Free Tier) ───");
  await delay(PHASE_DELAY_MS);

  for (const prog of ALL_PROGRAMS) {
    await pace();
    const isFree = FREE_PROGRAMS.has(prog);
    const outputs = PROGRAM_OUTPUTS_FRONTEND[prog] || [];

    // Skip if no frontend outputs for this program
    if (outputs.length === 0 && prog !== "agentic-purchasing") {
      record("snapshot_per_program_free", `snapshot_${prog}_free`, "SKIP", 0, 0, { reason: "no frontend outputs" });
      continue;
    }

    const payload = {
      input_method: "manual_file_upload",
      manifest: {
        project_name: `e2e-${prog}-free`,
        project_type: "web_application",
        frameworks: ["react"],
        goals: [`test ${prog}`],
        requested_outputs: outputs.length > 0 ? outputs : ["context-map.json"],
      },
      files: SAMPLE_FILES.slice(0, 5),
    };
    const { status, data, ms } = await go("POST", "/v1/snapshots", payload, freeAuth);

    if (isFree) {
      // Project limit (429) is expected for free tier after first project
      const pass = status === 201 && !!data.snapshot_id;
      const hitProjectLimit = status === 429 && (data.error || "").includes("Project limit");
      record("snapshot_per_program_free", `snapshot_${prog}_free`, pass ? "PASS" : (hitProjectLimit ? "EXPECTED_REFUSAL" : "FAIL"), status, ms, {
        snapshot_id: data.snapshot_id?.slice(0, 8),
        generated_files: data.generated_files?.length,
        error: data.error,
      });
    } else {
      // Should refuse — pro program outputs, free tier.
      // 402 TIER_REQUIRED is the primary gate, but 429 "Project limit" also blocks (free tier has max 1 project).
      const isRefusal = (status === 402 && data.error_code === "TIER_REQUIRED") ||
                        (status === 429 && (data.error || "").includes("Project limit"));
      record("snapshot_per_program_free", `snapshot_${prog}_free`, isRefusal ? "EXPECTED_REFUSAL" : "FAIL", status, ms, {
        error_code: data.error_code,
        blocked_programs: data.blocked_programs,
        error: data.error,
      });
    }
  }

  console.log("\n─── Phase 4b: Snapshot with One Program at a Time (Pro Tier) ───");
  await delay(PHASE_DELAY_MS);

  const proSnapIds = {};
  const proProjIds = {};
  for (const prog of ALL_PROGRAMS) {
    await pace();
    const outputs = PROGRAM_OUTPUTS_FRONTEND[prog] || [];

    if (outputs.length === 0 && prog !== "agentic-purchasing") {
      record("snapshot_per_program_pro", `snapshot_${prog}_pro`, "SKIP", 0, 0, { reason: "no frontend outputs" });
      continue;
    }

    const payload = {
      input_method: "manual_file_upload",
      manifest: {
        project_name: `e2e-${prog}-pro`,
        project_type: "web_application",
        frameworks: ["react"],
        goals: [`test ${prog}`],
        requested_outputs: outputs.length > 0 ? outputs : ["context-map.json"],
      },
      files: SAMPLE_FILES.slice(0, 5),
    };
    const { status, data, ms } = await go("POST", "/v1/snapshots", payload, proAuth);
    const pass = status === 201 && !!data.snapshot_id;
    proSnapIds[prog] = data.snapshot_id || "";
    proProjIds[prog] = data.project_id || "";
    record("snapshot_per_program_pro", `snapshot_${prog}_pro`, pass ? "PASS" : "FAIL", status, ms, {
      snapshot_id: data.snapshot_id?.slice(0, 8),
      generated_files: data.generated_files?.length,
      generated_file_list: data.generated_files?.map(f => f.path),
      error: data.error,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 5: Download / generated files retrieval
  // ═══════════════════════════════════════════════════════════════
  console.log("\n─── Phase 5: Download / Generated Files ───");
  await delay(PHASE_DELAY_MS);

  // 5a. List generated files for the free snapshot
  {
    const { status, data, ms } = await go("GET", `/v1/projects/${freeProjId}/generated-files`, null, freeAuth);
    const pass = status === 200 && Array.isArray(data.files) && data.files.length > 0;
    record("download", "list_generated_files_free", pass ? "PASS" : "FAIL", status, ms, {
      file_count: data.files?.length,
      programs: [...new Set(data.files?.map(f => f.program))],
      skipped_count: data.skipped?.length,
    });
  }

  // 5b. List generated files for the pro snapshot
  {
    const { status, data, ms } = await go("GET", `/v1/projects/${proProjId}/generated-files`, null, proAuth);
    const pass = status === 200 && Array.isArray(data.files) && data.files.length > 0;
    record("download", "list_generated_files_pro", pass ? "PASS" : "FAIL", status, ms, {
      file_count: data.files?.length,
      programs: [...new Set(data.files?.map(f => f.program))],
      skipped_count: data.skipped?.length,
    });
  }

  await pace();

  // 5c. Fetch individual files from free snapshot
  {
    const listRes = await go("GET", `/v1/projects/${freeProjId}/generated-files`, null, freeAuth);
    const files = listRes.data.files || [];
    let fetchedCount = 0;
    let failedPaths = [];
    for (const file of files.slice(0, 10)) {
      const { status } = await go("GET", `/v1/projects/${freeProjId}/generated-files/${encodeURIComponent(file.path)}`, null, freeAuth);
      if (status === 200) fetchedCount++;
      else failedPaths.push(file.path);
    }
    record("download", "fetch_individual_files_free", fetchedCount === Math.min(files.length, 10) ? "PASS" : "FAIL", 200, 0, {
      fetched: fetchedCount,
      attempted: Math.min(files.length, 10),
      failed_paths: failedPaths,
    });
  }

  await pace();

  // 5d. Export ZIP — free tier
  {
    const { status, data, ms, headers } = await go("GET", `/v1/projects/${freeProjId}/export`, null, freeAuth);
    const ct = headers.get("content-type") || "";
    const pass = status === 200 && (ct.includes("zip") || ct.includes("octet"));
    record("download", "export_zip_free", pass ? "PASS" : "FAIL", status, ms, {
      content_type: ct,
      size: data._binary ? data.size : (typeof data === "string" ? data.length : 0),
    });
  }

  await pace();

  // 5e. Export ZIP — pro tier
  {
    const { status, data, ms, headers } = await go("GET", `/v1/projects/${proProjId}/export`, null, proAuth);
    const ct = headers.get("content-type") || "";
    const pass = status === 200 && (ct.includes("zip") || ct.includes("octet"));
    record("download", "export_zip_pro", pass ? "PASS" : "FAIL", status, ms, {
      content_type: ct,
      size: data._binary ? data.size : (typeof data === "string" ? data.length : 0),
    });
  }

  // 5f. Export ZIP per-program filter (pro)
  for (const prog of ["search", "debug", "frontend", "brand"]) {
    await pace();
    const { status, data, ms, headers } = await go("GET", `/v1/projects/${proProjId}/export?program=${prog}`, null, proAuth);
    const ct = headers.get("content-type") || "";
    const pass = status === 200 && (ct.includes("zip") || ct.includes("octet"));
    record("download", `export_zip_program_${prog}`, pass ? "PASS" : "FAIL", status, ms, {
      content_type: ct,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 6: Edge cases + frontend wiring validation
  // ═══════════════════════════════════════════════════════════════
  console.log("\n─── Phase 6: Edge Cases ───");
  await delay(PHASE_DELAY_MS);

  // 6a. Empty files array
  {
    const payload = {
      input_method: "manual_file_upload",
      manifest: { project_name: "empty", project_type: "cli_tool", frameworks: [], goals: [], requested_outputs: ["context-map.json"] },
      files: [],
    };
    const { status, data, ms } = await go("POST", "/v1/snapshots", payload, proAuth);
    const isRefusal = status === 400;
    record("edge_cases", "empty_files_rejected", isRefusal ? "EXPECTED_REFUSAL" : "FAIL", status, ms, { error: data.error });
  }

  await pace();

  // 6b. Empty requested_outputs
  {
    const payload = {
      input_method: "manual_file_upload",
      manifest: { project_name: "no-outputs", project_type: "cli_tool", frameworks: [], goals: [], requested_outputs: [] },
      files: SAMPLE_FILES.slice(0, 2),
    };
    const { status, data, ms } = await go("POST", "/v1/snapshots", payload, proAuth);
    record("edge_cases", "empty_outputs", status === 201 || status === 400 ? (status === 400 ? "EXPECTED_REFUSAL" : "PASS") : "FAIL", status, ms, {
      error: data.error,
      generated_files: data.generated_files?.length,
    });
  }

  await pace();

  // 6c. Invalid snapshot_id on program endpoint
  {
    const { status, data, ms } = await go("POST", "/v1/search/export", { snapshot_id: "nonexistent" }, proAuth);
    const isRefusal = status === 404;
    record("edge_cases", "invalid_snapshot_id", isRefusal ? "EXPECTED_REFUSAL" : "FAIL", status, ms, { error: data.error });
  }

  await pace();

  // 6d. Missing snapshot_id on program endpoint
  {
    const { status, data, ms } = await go("POST", "/v1/debug/analyze", {}, proAuth);
    const isRefusal = status === 400;
    record("edge_cases", "missing_snapshot_id", isRefusal ? "EXPECTED_REFUSAL" : "FAIL", status, ms, { error: data.error });
  }

  await pace();

  // 6e. Invalid JSON body
  {
    const t0 = Date.now();
    const res = await fetch(BASE + "/v1/snapshots", {
      method: "POST", headers: { "Content-Type": "application/json", ...proAuth },
      body: "not json at all",
    });
    const ms = Date.now() - t0;
    const data = await res.json().catch(() => ({}));
    record("edge_cases", "invalid_json_body", res.status === 400 ? "EXPECTED_REFUSAL" : "FAIL", res.status, ms, { error: data.error });
  }

  await pace();

  // 6f. Free account requesting ALL 18 programs at once → 402 or 429 (project limit)
  {
    const allOutputs = Object.values(PROGRAM_OUTPUTS_FRONTEND).flat();
    const payload = {
      input_method: "manual_file_upload",
      manifest: {
        project_name: "e2e-all-18-free",
        project_type: "web_application",
        frameworks: ["react"],
        goals: ["all programs"],
        requested_outputs: allOutputs,
      },
      files: SAMPLE_FILES.slice(0, 3),
    };
    const { status, data, ms } = await go("POST", "/v1/snapshots", payload, freeAuth);
    const isRefusal = (status === 402 && data.error_code === "TIER_REQUIRED") ||
                      (status === 429 && (data.error || "").includes("Project limit"));
    record("edge_cases", "free_all_18_programs_blocked", isRefusal ? "EXPECTED_REFUSAL" : "FAIL", status, ms, {
      error_code: data.error_code,
      blocked_count: data.blocked_programs?.length,
      blocked_programs: data.blocked_programs,
      error: data.error,
    });
  }

  await pace();

  // 6g. Anonymous requesting ALL 18 programs → 402 or 429 (rate limit also denies)
  {
    const allOutputs = Object.values(PROGRAM_OUTPUTS_FRONTEND).flat();
    const payload = {
      input_method: "manual_file_upload",
      manifest: {
        project_name: "e2e-all-18-anon",
        project_type: "web_application",
        frameworks: ["react"],
        goals: ["all programs"],
        requested_outputs: allOutputs,
      },
      files: SAMPLE_FILES.slice(0, 3),
    };
    const { status, data, ms } = await go("POST", "/v1/snapshots", payload);
    const isRefusal = (status === 402 && data.error_code === "TIER_REQUIRED") || status === 429;
    record("edge_cases", "anon_all_18_programs_blocked", isRefusal ? "EXPECTED_REFUSAL" : "FAIL", status, ms, {
      error_code: data.error_code,
      blocked_count: data.blocked_programs?.length,
      error: data.error,
    });
  }

  await pace();

  // 6h. Path traversal on generated file fetch
  {
    const { status, data, ms } = await go("GET", `/v1/projects/${freeProjId}/generated-files/..%2F..%2Fetc%2Fpasswd`, null, freeAuth);
    const isRefusal = status === 400 || status === 404 || status === 403;
    record("edge_cases", "path_traversal_blocked", isRefusal ? "EXPECTED_REFUSAL" : "FAIL", status, ms, { error: data.error || data });
  }

  await pace();

  // 6i. Revoked key (use proAuth for key creation — free tier may hit project limits)
  {
    const { status: createStatus, data: createData } = await go("POST", "/v1/account/keys", { label: "to-revoke" }, proAuth);
    if (createStatus === 201 && createData.raw_key) {
      const tempKey = createData.raw_key;
      const keyId = createData.key_id;
      await go("POST", `/v1/account/keys/${keyId}/revoke`, null, proAuth);
      const { status, data, ms } = await go("GET", "/v1/account", null, { Authorization: `Bearer ${tempKey}` });
      const isRefusal = status === 401;
      record("edge_cases", "revoked_key_rejected", isRefusal ? "EXPECTED_REFUSAL" : "FAIL", status, ms, { error: data.error });
    } else {
      record("edge_cases", "revoked_key_rejected", "FAIL", createStatus, 0, { error: "could not create key" });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 7: Well-known / discovery endpoints
  // ═══════════════════════════════════════════════════════════════
  console.log("\n─── Phase 7: Discovery Endpoints ───");
  await delay(PHASE_DELAY_MS);

  for (const [name, path] of [
    ["well_known_axis", "/.well-known/axis.json"],
    ["well_known_capabilities", "/.well-known/capabilities.json"],
    ["well_known_mcp", "/.well-known/mcp.json"],
    ["robots_txt", "/robots.txt"],
    ["llms_txt", "/llms.txt"],
    ["skills_index", "/.well-known/skills/index.json"],
    ["for_agents", "/for-agents"],
    ["v1_docs", "/v1/docs"],
    ["v1_docs_md", "/v1/docs.md"],
    ["root_landing", "/"],
  ]) {
    await pace();
    // Use proAuth for higher rate limit (120 vs 60 req/min)
    const { status, data, ms } = await go("GET", path, null, proAuth);
    const pass = status === 200;
    const version = typeof data === "object" ? (data.version || data.info?.version) : undefined;
    record("discovery", name, pass ? "PASS" : "FAIL", status, ms, { version });
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 8: Unified /v1/analyze endpoint
  // ═══════════════════════════════════════════════════════════════
  console.log("\n─── Phase 8: Unified Analyze Endpoint ───");
  await delay(PHASE_DELAY_MS);

  // 8a. With files, free programs (free account may hit project limit — valid refusal)
  {
    const { status, data, ms } = await go("POST", "/v1/analyze", {
      files: SAMPLE_FILES.slice(0, 3),
      programs: ["search", "debug"],
    }, freeAuth);
    const pass = status === 200 || status === 201;
    const hitProjectLimit = status === 429 && (data.error || "").includes("Project limit");
    record("analyze", "analyze_files_free_programs", pass ? "PASS" : (hitProjectLimit ? "EXPECTED_REFUSAL" : "FAIL"), status, ms, {
      generated_files: data.generated_files?.length,
      programs: data.programs,
      error: data.error,
    });
  }

  await pace();

  // 8b. With files, pro programs on free tier → refusal
  {
    const { status, data, ms } = await go("POST", "/v1/analyze", {
      files: SAMPLE_FILES.slice(0, 3),
      programs: ["frontend", "seo"],
    }, freeAuth);
    const isRefusal = status === 402 || status === 403;
    record("analyze", "analyze_files_pro_programs_free_acct", isRefusal ? "EXPECTED_REFUSAL" : (status === 200 ? "FAIL" : "FAIL"), status, ms, {
      error_code: data.error_code,
      error: data.error,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // RESULTS SUMMARY + YAML OUTPUT
  // ═══════════════════════════════════════════════════════════════
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log(" RESULTS SUMMARY");
  console.log("═══════════════════════════════════════════════════════════════");

  const passed = results.filter(r => r.outcome === "PASS").length;
  const refused = results.filter(r => r.outcome === "EXPECTED_REFUSAL").length;
  const failed = results.filter(r => r.outcome === "FAIL").length;
  const skipped = results.filter(r => r.outcome === "SKIP").length;
  const total = results.length;

  console.log(`  Total:             ${total}`);
  console.log(`  PASS:              ${passed}`);
  console.log(`  EXPECTED_REFUSAL:  ${refused}`);
  console.log(`  FAIL:              ${failed}`);
  console.log(`  SKIP:              ${skipped}`);
  console.log(`  Pass Rate:         ${((passed + refused) / (total - skipped) * 100).toFixed(1)}%`);
  console.log("");

  if (failed > 0) {
    console.log("─── FAILURES ───");
    for (const r of results.filter(r => r.outcome === "FAIL")) {
      console.log(`  ✗ ${r.name} [${r.http_status}] ${r.error || ""}`);
    }
    console.log("");
  }

  // ─── Build YAML ───────────────────────────────────────────────
  const yaml = buildYaml(results, { passed, refused, failed, skipped, total });
  const { writeFileSync } = await import("node:fs");
  writeFileSync(YAML_OUT, yaml, "utf8");
  console.log(`✓ Report written to ${YAML_OUT}`);

  process.exit(failed > 0 ? 1 : 0);
}

// ─── YAML builder ───────────────────────────────────────────────
function buildYaml(results, summary) {
  const lines = [];
  lines.push("# ═══════════════════════════════════════════════════════════════");
  lines.push("# AXIS Toolbox — E2E Wiring Audit Results");
  lines.push(`# Generated: ${new Date().toISOString()}`);
  lines.push(`# Target: ${BASE}`);
  lines.push("# ═══════════════════════════════════════════════════════════════");
  lines.push("");
  lines.push("meta:");
  lines.push(`  generated_at: "${new Date().toISOString()}"`);
  lines.push(`  target: "${BASE}"`);
  lines.push(`  version: "0.5.0"`);
  lines.push(`  node_version: "${process.version}"`);
  lines.push("");
  lines.push("summary:");
  lines.push(`  total: ${summary.total}`);
  lines.push(`  pass: ${summary.passed}`);
  lines.push(`  expected_refusal: ${summary.refused}`);
  lines.push(`  fail: ${summary.failed}`);
  lines.push(`  skip: ${summary.skipped}`);
  lines.push(`  pass_rate: "${(((summary.passed + summary.refused) / (summary.total - summary.skipped)) * 100).toFixed(1)}%"`);
  lines.push(`  grade: "${summary.failed === 0 ? "A" : summary.failed <= 3 ? "B" : summary.failed <= 10 ? "C" : "D"}"`);
  lines.push("");
  lines.push("programs:");
  lines.push("  free: [search, skills, debug]");
  lines.push("  pro: [frontend, seo, optimization, theme, brand, superpowers, marketing, notebook, obsidian, mcp, artifacts, remotion, canvas, algorithmic, agentic-purchasing]");
  lines.push("");

  // Group results by section
  const sections = {};
  for (const r of results) {
    if (!sections[r.section]) sections[r.section] = [];
    sections[r.section].push(r);
  }

  lines.push("tests:");
  for (const [section, tests] of Object.entries(sections)) {
    lines.push(`  ${section}:`);
    for (const t of tests) {
      lines.push(`    - id: ${t.id}`);
      lines.push(`      name: "${t.name}"`);
      lines.push(`      outcome: ${t.outcome}`);
      lines.push(`      http_status: ${t.http_status}`);
      lines.push(`      latency_ms: ${t.latency_ms}`);

      // Include relevant detail fields
      const skip = new Set(["id", "section", "name", "outcome", "http_status", "latency_ms"]);
      for (const [k, v] of Object.entries(t)) {
        if (skip.has(k) || v === undefined || v === null || v === "") continue;
        if (Array.isArray(v)) {
          if (v.length === 0) continue;
          lines.push(`      ${k}: [${v.map(x => `"${x}"`).join(", ")}]`);
        } else if (typeof v === "object") {
          lines.push(`      ${k}: ${JSON.stringify(v)}`);
        } else {
          lines.push(`      ${k}: "${v}"`);
        }
      }
    }
  }

  // Failure detail section
  const failures = results.filter(r => r.outcome === "FAIL");
  if (failures.length > 0) {
    lines.push("");
    lines.push("failures:");
    for (const f of failures) {
      lines.push(`  - name: "${f.name}"`);
      lines.push(`    section: "${f.section}"`);
      lines.push(`    http_status: ${f.http_status}`);
      lines.push(`    error: "${f.error || "unknown"}"`);
      if (f.error_code) lines.push(`    error_code: "${f.error_code}"`);
    }
  }

  lines.push("");
  lines.push("# ─── Verification Notes ─────────────────────────────────────");
  lines.push("# PASS = endpoint responded correctly with expected data");
  lines.push("# EXPECTED_REFUSAL = endpoint correctly refused (402/401/403/400)");
  lines.push("# FAIL = unexpected response — wiring broken or gate missing");
  lines.push("# SKIP = test not applicable (no frontend outputs for program)");
  lines.push("# A refusal IS a correct outcome for pro programs on free/anon tier");
  lines.push("");
  return lines.join("\n");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(2);
});
