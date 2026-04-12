// ForAgentsPage — discovery landing for AI agents and API-first integrations
import { useState } from "react";

const API_BASE = "https://api.axis-toolbox.com";

// ─── Copy button ─────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button
      onClick={handleCopy}
      style={{
        position: "absolute", top: 8, right: 8,
        background: copied ? "var(--green)" : "var(--bg-hover)",
        color: copied ? "#fff" : "var(--text-muted)",
        border: "1px solid var(--border)", borderRadius: "var(--radius)",
        fontSize: "0.7rem", padding: "3px 8px", cursor: "pointer",
        fontFamily: "var(--font)", transition: "background 0.15s, color 0.15s",
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ─── Code block ──────────────────────────────────────────────────

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  return (
    <div style={{ position: "relative" }}>
      <pre style={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "14px 16px",
        fontFamily: "var(--mono)",
        fontSize: "0.78rem",
        lineHeight: 1.6,
        overflowX: "auto",
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
        color: "var(--text)",
      }}>
        <span style={{ color: "var(--text-muted)", userSelect: "none", marginRight: 6 }}>{lang}</span>
        {code}
      </pre>
      <CopyButton text={code} />
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────

function SectionHeader({ title, subtitle, tag }: { title: string; subtitle?: string; tag?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 700 }}>{title}</h2>
        {tag && (
          <span style={{
            fontSize: "0.65rem", fontWeight: 700, padding: "2px 7px",
            borderRadius: 99, background: "var(--accent)", color: "#fff",
            letterSpacing: "0.04em", textTransform: "uppercase",
          }}>
            {tag}
          </span>
        )}
      </div>
      {subtitle && <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{subtitle}</p>}
    </div>
  );
}

// ─── Programs table ───────────────────────────────────────────────

const PROGRAMS = [
  { name: "search",              tier: "free", outputs: 5,  key: "AGENTS.md, .cursorrules, CLAUDE.md, context-map.json, repo-profile.yaml" },
  { name: "skills",              tier: "free", outputs: 5,  key: "AGENTS.md, CLAUDE.md, .cursorrules, workflow-pack.md, policy-pack.md" },
  { name: "debug",               tier: "free", outputs: 4,  key: "debug-playbook.md, incident-template.md, tracing-rules.md, root-cause-checklist.md" },
  { name: "frontend",            tier: "pro",  outputs: 4,  key: "frontend-rules.md, component-guidelines.md, layout-patterns.md, ui-audit.md" },
  { name: "seo",                 tier: "pro",  outputs: 5,  key: "seo-rules.md, schema-recommendations.json, route-priority-map.md, content-audit.md, meta-tag-audit.json" },
  { name: "optimization",        tier: "pro",  outputs: 4,  key: "optimization-rules.md, prompt-diff-report.md, cost-estimate.json, token-budget-plan.md" },
  { name: "theme",               tier: "pro",  outputs: 5,  key: "design-tokens.json, theme.css, theme-guidelines.md, component-theme-map.json, dark-mode-tokens.json" },
  { name: "brand",               tier: "pro",  outputs: 5,  key: "brand-guidelines.md, voice-and-tone.md, content-constraints.md, messaging-system.yaml, channel-rulebook.md" },
  { name: "superpowers",         tier: "pro",  outputs: 5,  key: "superpower-pack.md, workflow-registry.json, test-generation-rules.md, refactor-checklist.md, automation-pipeline.yaml" },
  { name: "marketing",           tier: "pro",  outputs: 5,  key: "campaign-brief.md, funnel-map.md, sequence-pack.md, cro-playbook.md, ab-test-plan.md" },
  { name: "notebook",            tier: "pro",  outputs: 5,  key: "notebook-summary.md, source-map.json, study-brief.md, research-threads.md, citation-index.json" },
  { name: "obsidian",            tier: "pro",  outputs: 5,  key: "obsidian-skill-pack.md, vault-rules.md, graph-prompt-map.json, linking-policy.md, template-pack.md" },
  { name: "mcp",                 tier: "pro",  outputs: 4,  key: "mcp-config.json, connector-map.yaml, capability-registry.json, server-manifest.yaml" },
  { name: "artifacts",           tier: "pro",  outputs: 5,  key: "generated-component.tsx, dashboard-widget.tsx, embed-snippet.ts, artifact-spec.md, component-library.json" },
  { name: "remotion",            tier: "pro",  outputs: 5,  key: "remotion-script.ts, scene-plan.md, render-config.json, asset-checklist.md, storyboard.md" },
  { name: "canvas",              tier: "pro",  outputs: 5,  key: "canvas-spec.json, social-pack.md, poster-layouts.md, asset-guidelines.md, brand-board.md" },
  { name: "algorithmic",         tier: "pro",  outputs: 5,  key: "generative-sketch.ts, parameter-pack.json, collection-map.md, export-manifest.yaml, variation-matrix.json" },
  { name: "agentic-purchasing",  tier: "pro",  outputs: 5,  key: "agent-purchasing-playbook.md, product-schema.json, checkout-flow.md, negotiation-rules.md, commerce-registry.json" },
];

// ─── Key outputs ──────────────────────────────────────────────────

const KEY_OUTPUTS = [
  { path: "AGENTS.md",                    program: "search",             purpose: "Loaded by Cursor, Copilot, and Claude — instant AI grounding for any codebase" },
  { path: ".cursorrules",                  program: "search",             purpose: "Cursor reads at session start. Governs AI behavior for the entire project" },
  { path: "CLAUDE.md",                     program: "search",             purpose: "Claude project context — paste into system prompt for persistent memory" },
  { path: "mcp-config.json",               program: "mcp",                purpose: "Agents discover AXIS tools automatically via MCP — no manual registration" },
  { path: "commerce-registry.json",        program: "agentic-purchasing", purpose: "Product catalog + bearer auth for purchasing agent integration" },
  { path: "agent-purchasing-playbook.md",  program: "agentic-purchasing", purpose: "Authorized procurement protocol — add to purchasing agent system prompt" },
  { path: "debug-playbook.md",             program: "debug",              purpose: "AI incident triage context — share with on-call team" },
  { path: "design-tokens.json",            program: "theme",              purpose: "Design system tokens — import into Figma Token Studio or CSS pipeline" },
  { path: "capability-registry.json",      program: "mcp",                purpose: "All queryable capabilities in machine-readable form — add to agent startup context" },
];

// ─── Page ─────────────────────────────────────────────────────────

export function ForAgentsPage() {
  const quickStartStep1 = `curl -X POST ${API_BASE}/v1/accounts \\
  -H "Content-Type: application/json" \\
  -d '{"email":"agent@example.com","name":"My Agent","tier":"free"}'`;

  const quickStartStep2 = `curl -X POST ${API_BASE}/v1/analyze \\
  -H "Authorization: Bearer <raw_key>" \\
  -H "Content-Type: application/json" \\
  -d '{"github_url":"https://github.com/your/repo"}'`;

  const quickStartStep2Files = `curl -X POST ${API_BASE}/v1/analyze \\
  -H "Authorization: Bearer <raw_key>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "files": [
      {"path":"package.json","content":"{\\"name\\":\\"my-app\\"}"},
      {"path":"src/index.ts","content":"export const app = () => {};"}
    ]
  }'`;

  const mcpCurl = `curl -X POST ${API_BASE}/mcp \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'`;

  const wellKnownCurl = `curl ${API_BASE}/.well-known/axis.json`;

  const filterProgramsCurl = `curl -X POST ${API_BASE}/v1/analyze \\
  -H "Authorization: Bearer <raw_key>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "github_url": "https://github.com/your/repo",
    "programs": ["search", "mcp", "debug"]
  }'`;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 4px" }}>

      {/* ── Hero ── */}
      <div className="card" style={{ marginBottom: 24, padding: "28px 28px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>AXIS Toolbox</h1>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "var(--accent)", color: "#fff", letterSpacing: "0.04em", textTransform: "uppercase" }}>For Agents</span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", maxWidth: 560 }}>
              Analyze any codebase. Generate 86 structured artifacts across 18 programs. Every file includes <code style={{ fontFamily: "var(--mono)", fontSize: "0.82rem" }}>placement</code> and <code style={{ fontFamily: "var(--mono)", fontSize: "0.82rem" }}>adoption_hint</code> — you know exactly where each file goes.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "right" }}>
              <div><strong style={{ color: "var(--text)" }}>18</strong> programs</div>
              <div><strong style={{ color: "var(--text)" }}>86</strong> generators</div>
              <div><strong style={{ color: "var(--text)" }}>v0.4.0</strong></div>
            </div>
          </div>
        </div>

        {/* Discovery manifest pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--bg)" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--mono)", flexShrink: 0 }}>GET</span>
          <code style={{ fontFamily: "var(--mono)", fontSize: "0.8rem", color: "var(--accent)", flex: 1 }}>{API_BASE}/.well-known/axis.json</code>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Machine-readable manifest</span>
        </div>
      </div>

      {/* ── Quick Start ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <SectionHeader title="Quick Start" subtitle="Three steps from zero to 86 structured artifacts." tag="API" />

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 8 }}>
              <strong style={{ color: "var(--text)" }}>Step 1</strong> — Create a free account and get your API key:
            </p>
            <CodeBlock code={quickStartStep1} />
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 6 }}>
              Response includes <code style={{ fontFamily: "var(--mono)", fontSize: "0.78rem" }}>raw_key</code> — use it in Step 2. Anonymous requests also work on the free tier (no key needed).
            </p>
          </div>

          <div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 8 }}>
              <strong style={{ color: "var(--text)" }}>Step 2a</strong> — Analyze by GitHub URL:
            </p>
            <CodeBlock code={quickStartStep2} />
          </div>

          <div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 8 }}>
              <strong style={{ color: "var(--text)" }}>Step 2b</strong> — Or inline your files directly:
            </p>
            <CodeBlock code={quickStartStep2Files} />
          </div>

          <div style={{ padding: "12px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 6 }}>
              <strong style={{ color: "var(--text)" }}>Step 3</strong> — Read the response. Every file tells you exactly where to place it:
            </p>
            <pre style={{ fontFamily: "var(--mono)", fontSize: "0.75rem", color: "var(--text)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{`{
  "files": [
    {
      "path": "AGENTS.md",
      "program": "search",
      "placement": "repo root",
      "adoption_hint": "Place in repo root. Cursor, Copilot, and Claude auto-load this as codebase context — instant AI grounding.",
      "content": "..."
    },
    ...
  ],
  "next_steps": [
    "Place AGENTS.md in your repo root — AI coding assistants auto-load codebase context",
    "Place .cursorrules in your repo root — Cursor reads it at the start of every session",
    "Add CLAUDE.md to your Claude project system prompt for persistent context"
  ]
}`}</pre>
          </div>
        </div>
      </div>

      {/* ── Filter by program ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <SectionHeader title="Filter by Program" subtitle="Request only the programs you need. Reduces response size and processing time." />
        <CodeBlock code={filterProgramsCurl} />
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 10 }}>
          Valid program names: <code style={{ fontFamily: "var(--mono)", fontSize: "0.78rem" }}>
            search, skills, debug, frontend, seo, optimization, theme, brand, superpowers, marketing, notebook, obsidian, mcp, artifacts, remotion, canvas, algorithmic, agentic-purchasing
          </code>
        </p>
      </div>

      {/* ── Key Outputs ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <SectionHeader title="Key Outputs" subtitle="Eight highest-ROI files across all programs. Each is returned with placement and adoption_hint." />
        <div style={{ display: "flex", flexDirection: "column", gap: 0, borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
          {KEY_OUTPUTS.map((out, i) => (
            <div key={out.path} style={{
              display: "grid", gridTemplateColumns: "200px 120px 1fr",
              gap: 12, padding: "10px 14px", alignItems: "center",
              borderBottom: i < KEY_OUTPUTS.length - 1 ? "1px solid var(--border)" : "none",
              background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg)",
            }}>
              <code style={{ fontFamily: "var(--mono)", fontSize: "0.75rem", color: "var(--accent)", wordBreak: "break-all" }}>{out.path}</code>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--mono)" }}>{out.program}</span>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{out.purpose}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── All Programs ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <SectionHeader title="All 18 Programs" subtitle="Free tier: search, skills, debug. Pro tier: remaining 15 programs." />
        <div style={{ display: "flex", flexDirection: "column", gap: 0, borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
          {PROGRAMS.map((p, i) => (
            <div key={p.name} style={{
              display: "grid", gridTemplateColumns: "160px 56px 36px 1fr",
              gap: 12, padding: "9px 14px", alignItems: "start",
              borderBottom: i < PROGRAMS.length - 1 ? "1px solid var(--border)" : "none",
              background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg)",
            }}>
              <code style={{ fontFamily: "var(--mono)", fontSize: "0.78rem", color: "var(--text)" }}>{p.name}</code>
              <span style={{
                fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px",
                borderRadius: 99, alignSelf: "center",
                background: p.tier === "free" ? "rgba(22,163,74,0.12)" : "rgba(99,102,241,0.12)",
                color: p.tier === "free" ? "var(--green)" : "var(--accent)",
              }}>{p.tier}</span>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "center", alignSelf: "center" }}>{p.outputs}</span>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{p.key}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 10 }}>Column order: program name · tier · output count · key files</p>
      </div>

      {/* ── MCP ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <SectionHeader title="MCP Integration" subtitle="Streamable HTTP transport, 2025-03-26 spec. 8 tools for agent-native access." tag="MCP" />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { tool: "analyze_repo",        desc: "Analyze a GitHub repo or inline files in one call" },
              { tool: "run_generator",       desc: "Run a specific program against an existing snapshot" },
              { tool: "get_context_map",     desc: "Retrieve the dependency and symbol graph" },
              { tool: "get_generated_files", desc: "Fetch all generated files for a project" },
              { tool: "create_snapshot",     desc: "Create a named snapshot from source files" },
              { tool: "search_index",        desc: "Index snapshot content for full-text search" },
              { tool: "search_query",        desc: "Search indexed content with a natural language query" },
              { tool: "list_programs",       desc: "List all 18 programs and their output files" },
            ].map(t => (
              <div key={t.tool} style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--bg)" }}>
                <code style={{ fontFamily: "var(--mono)", fontSize: "0.78rem", color: "var(--accent)", display: "block", marginBottom: 4 }}>{t.tool}</code>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{t.desc}</span>
              </div>
            ))}
          </div>
          <CodeBlock code={mcpCurl} />
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Endpoint: <code style={{ fontFamily: "var(--mono)", fontSize: "0.78rem" }}>{API_BASE}/mcp</code> · Transport: Streamable HTTP · Spec: 2025-03-26
          </p>
        </div>
      </div>

      {/* ── Discovery Manifest ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <SectionHeader title="Discovery Manifest" subtitle="Machine-readable endpoint description. Agents should fetch this first." tag="Well-Known" />
        <CodeBlock code={wellKnownCurl} />
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 10 }}>
          Returns JSON with <code style={{ fontFamily: "var(--mono)", fontSize: "0.78rem" }}>analyze_endpoint</code>, <code style={{ fontFamily: "var(--mono)", fontSize: "0.78rem" }}>programs</code>, <code style={{ fontFamily: "var(--mono)", fontSize: "0.78rem" }}>key_outputs</code>, <code style={{ fontFamily: "var(--mono)", fontSize: "0.78rem" }}>quick_start</code>, and <code style={{ fontFamily: "var(--mono)", fontSize: "0.78rem" }}>for_agents</code> fields.
        </p>
      </div>

      {/* ── Auth & Tiers ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <SectionHeader title="Authentication & Tiers" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <p style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: 8 }}>Free Tier (anonymous or with key)</p>
            <ul style={{ paddingLeft: 18, fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 2 }}>
              <li>search, skills, debug programs</li>
              <li>Anonymous requests accepted</li>
              <li>Rate-limited by IP</li>
              <li>No file storage</li>
            </ul>
          </div>
          <div>
            <p style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: 8 }}>Pro Tier (Bearer token)</p>
            <ul style={{ paddingLeft: 18, fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 2 }}>
              <li>All 18 programs unlocked</li>
              <li>Higher file limits</li>
              <li>Project history</li>
              <li>Priority processing</li>
            </ul>
          </div>
        </div>
        <div style={{ marginTop: 14, padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--bg)" }}>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--text)" }}>Header:</strong>{" "}
            <code style={{ fontFamily: "var(--mono)", fontSize: "0.78rem" }}>Authorization: Bearer {"<raw_key>"}</code>
            {" · "}
            <strong style={{ color: "var(--text)" }}>Get key:</strong>{" "}
            <code style={{ fontFamily: "var(--mono)", fontSize: "0.78rem" }}>POST /v1/accounts</code>
          </p>
        </div>
      </div>

      {/* ── Additional Endpoints ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <SectionHeader title="Additional Endpoints" />
        <div style={{ display: "flex", flexDirection: "column", gap: 0, borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
          {[
            { method: "GET",  path: "/v1/docs",                          desc: "Full OpenAPI 3.1 spec" },
            { method: "GET",  path: "/.well-known/axis.json",            desc: "Machine-readable discovery manifest" },
            { method: "GET",  path: "/mcp",                              desc: "MCP server (Streamable HTTP, tools/list + tools/call)" },
            { method: "POST", path: "/v1/accounts",                      desc: "Create account, get raw_key" },
            { method: "POST", path: "/v1/snapshots",                     desc: "Create snapshot from files (low-level API)" },
            { method: "GET",  path: "/v1/projects/:id/files",            desc: "Get all generated files for a project" },
            { method: "GET",  path: "/v1/projects/:id/files/:file_path", desc: "Get a single generated file by path" },
            { method: "POST", path: "/v1/search/index",                  desc: "Index a snapshot for full-text search" },
            { method: "POST", path: "/v1/search/query",                  desc: "Query indexed snapshot content" },
            { method: "GET",  path: "/health",                           desc: "Health check" },
          ].map((ep, i, arr) => (
            <div key={ep.path} style={{
              display: "grid", gridTemplateColumns: "48px 280px 1fr",
              gap: 12, padding: "9px 14px", alignItems: "center",
              borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
              background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg)",
            }}>
              <span style={{
                fontSize: "0.65rem", fontWeight: 700,
                color: ep.method === "GET" ? "var(--blue)" : "var(--green)",
                fontFamily: "var(--mono)",
              }}>{ep.method}</span>
              <code style={{ fontFamily: "var(--mono)", fontSize: "0.75rem", color: "var(--text)", wordBreak: "break-all" }}>{ep.path}</code>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{ep.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── For purchasing agents ── */}
      <div className="card" style={{ marginBottom: 8 }}>
        <SectionHeader title="Agentic Purchasing" subtitle="Structured procurement protocol for autonomous purchasing agents." tag="Pro" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            The <code style={{ fontFamily: "var(--mono)", fontSize: "0.8rem" }}>agentic-purchasing</code> program generates five files your purchasing agent needs to operate authorized transactions against any product catalog derived from the analyzed codebase.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { file: "commerce-registry.json",       placement: "/.well-known/ or agent tooling",    desc: "Product catalog, bearer auth config, endpoint routing" },
              { file: "product-schema.json",           placement: "agent tool definitions",            desc: "Validates product structure before purchase" },
              { file: "checkout-flow.md",              placement: "purchasing agent context",          desc: "Step-by-step authorized purchase protocol" },
              { file: "negotiation-rules.md",          placement: "agent-to-agent context",            desc: "Governs pricing negotiation constraints" },
              { file: "agent-purchasing-playbook.md",  placement: "purchasing agent system prompt",   desc: "Complete procurement authority and protocol document" },
            ].map(item => (
              <div key={item.file} style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--bg)" }}>
                <code style={{ fontFamily: "var(--mono)", fontSize: "0.72rem", color: "var(--accent)", display: "block", marginBottom: 4 }}>{item.file}</code>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 4 }}>{item.desc}</p>
                <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontStyle: "italic" }}>→ {item.placement}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
