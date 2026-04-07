import { useState } from "react";

type DocSection = "overview" | "programs" | "api" | "outputs" | "cli";

interface ProgramDoc {
  name: string;
  label: string;
  icon: string;
  category: string;
  promise: string;
  endpoints: string[];
  tier: "free" | "pro";
  description: string;
  generatorCount: number;
  outputFiles: string[];
  freeFeatures: string[];
  paidFeatures: string[];
  notes?: string;
}

const PROGRAM_DOCS: ProgramDoc[] = [
  {
    name: "search", label: "Axis Search", icon: "🔍", category: "Repo Intelligence",
    promise: "Understand the repo faster",
    description: "Search and map codebases, docs, prompts, and architecture context from a project snapshot.",
    tier: "free", generatorCount: 4,
    endpoints: ["POST /v1/search/analyze", "POST /v1/search/export"],
    outputFiles: [".ai/context-map.json", ".ai/repo-profile.yaml", "architecture-summary.md", "dependency-hotspots.md"],
    freeFeatures: ["Limited snapshot runs", "Basic repo map", "Preview results"],
    paidFeatures: ["Full repo index", "Saved indexes", "Cross-project search", "Export context map", "API access"],
  },
  {
    name: "skills", label: "Axis Skills", icon: "🤖", category: "Governance",
    promise: "Generate project-specific AI governance files",
    description: "Generate root-level guidance, workflows, and AI control files tailored to the project.",
    tier: "free", generatorCount: 5,
    endpoints: ["POST /v1/skills/generate", "POST /v1/skills/export"],
    outputFiles: ["AGENTS.md", "CLAUDE.md", "CURSOR.md", ".cursorrules", ".ai/workflows/", ".ai/policies/"],
    freeFeatures: ["Limited file previews", "Basic skill generation"],
    paidFeatures: ["Full file exports", "Versioned governance", "Workflow library", "Reusable templates", "API access"],
    notes: "Framework-aware (TS/JS/Python-specific rules)",
  },
  {
    name: "debug", label: "Axis Debug", icon: "🐛", category: "Repo Intelligence",
    promise: "Find root cause faster",
    description: "Turn code, logs, traces, and project context into repeatable debugging reports and playbooks.",
    tier: "free", generatorCount: 4,
    endpoints: ["POST /v1/debug/analyze", "POST /v1/debug/generate"],
    outputFiles: [".ai/debug-playbook.md", "incident-template.md", "tracing-rules.md", "root-cause-checklist.md"],
    freeFeatures: ["Limited debug runs", "Issue preview", "Basic playbook preview"],
    paidFeatures: ["Full debug reports", "Saved incidents", "Root-cause playbooks", "Trace evaluations", "API access"],
  },
  {
    name: "frontend", label: "Axis Frontend", icon: "🎨", category: "Engineering Delivery",
    promise: "Make UI work match the project's actual standards",
    description: "Audit frontend structure and produce component, layout, and interface rules aligned to the repo.",
    tier: "pro", generatorCount: 4,
    endpoints: ["POST /v1/frontend/audit", "POST /v1/frontend/generate"],
    outputFiles: [".ai/frontend-rules.md", "component-guidelines.md", "layout-patterns.md", "ui-audit.md"],
    freeFeatures: ["Limited UI audits", "Preview guidelines"],
    paidFeatures: ["Full UI audits", "Component guidelines", "Screen generation", "Design specs", "API access"],
    notes: "Framework-aware (React, Next.js, Vue, Svelte)",
  },
  {
    name: "seo", label: "Axis SEO", icon: "📈", category: "Growth & Content",
    promise: "Improve discoverability from inside the codebase",
    description: "Analyze routes, content structure, schema, and technical SEO directly from the project.",
    tier: "pro", generatorCount: 5,
    endpoints: ["POST /v1/seo/analyze", "POST /v1/seo/generate"],
    outputFiles: [".ai/seo-rules.md", "schema-recommendations.json", "route-priority-map.md", "content-audit.md", "meta-tag-audit.json"],
    freeFeatures: ["Single route audit", "Preview recommendations"],
    paidFeatures: ["Full site analysis", "Route priority maps", "Schema recommendations", "Competitor exports", "API access"],
    notes: "SSR/SSG vs SPA awareness (Next.js, React)",
  },
  {
    name: "optimization", label: "Axis Optimization", icon: "⚡", category: "Repo Intelligence",
    promise: "Reduce waste and improve prompt and context efficiency",
    description: "Analyze prompts, context packing, and model workflows for cost, clarity, and output quality.",
    tier: "pro", generatorCount: 4,
    endpoints: ["POST /v1/optimization/analyze", "POST /v1/optimization/generate"],
    outputFiles: [".ai/optimization-rules.md", "prompt-diff-report.md", "cost-estimate.json", "token-budget-plan.md"],
    freeFeatures: ["Single analysis", "Optimization score preview"],
    paidFeatures: ["Batch optimization", "Before/after comparisons", "Cost reports", "Organization rules", "API access"],
    notes: "Calculates actual LOC and token estimates from scanned code",
  },
  {
    name: "theme", label: "Axis Theme", icon: "🎭", category: "Design System",
    promise: "Generate project-consistent themes and token systems",
    description: "Produce design tokens, theme packs, and implementation rules from existing brand and UI signals.",
    tier: "pro", generatorCount: 5,
    endpoints: ["POST /v1/theme/generate", "POST /v1/theme/export"],
    outputFiles: [".ai/design-tokens.json", "theme.css", "theme-guidelines.md", "component-theme-map.json", "dark-mode-tokens.json"],
    freeFeatures: ["Basic palette generation", "Preview tokens"],
    paidFeatures: ["Full token systems", "Export theme files", "Multiple theme variants", "Brand sync", "API access"],
  },
  {
    name: "brand", label: "Axis Brand", icon: "📣", category: "Growth & Content",
    promise: "Turn brand intent into enforceable AI content rules",
    description: "Structure tone, voice, and content constraints into reusable system files and prompt-ready guidance.",
    tier: "pro", generatorCount: 5,
    endpoints: ["POST /v1/brand/generate", "POST /v1/brand/export"],
    outputFiles: ["brand-guidelines.md", "voice-and-tone.md", "content-constraints.md", "messaging-system.yaml", "channel-rulebook.md"],
    freeFeatures: ["One brand profile", "Tone preview"],
    paidFeatures: ["Multiple brand kits", "Channel-specific rules", "Team sharing", "Export packs", "API access"],
    notes: "Adapts to project type (web app, CLI, library)",
  },
  {
    name: "superpowers", label: "Axis Superpowers", icon: "💪", category: "Engineering Delivery",
    promise: "Give builders reusable high-leverage development workflows",
    description: "Package debugging, planning, testing, and refactoring actions into repeatable, project-aware tools.",
    tier: "pro", generatorCount: 5,
    endpoints: ["POST /v1/superpowers/generate", "POST /v1/superpowers/export"],
    outputFiles: ["superpower-pack.md", "workflow-registry.json", "test-generation-rules.md", "refactor-checklist.md", "automation-pipeline.yaml"],
    freeFeatures: ["Utility-level functions", "Limited runs"],
    paidFeatures: ["Project workflows", "Pipeline automation", "Team playbooks", "Reusable actions", "API access"],
  },
  {
    name: "marketing", label: "Axis Marketing", icon: "📊", category: "Growth & Content",
    promise: "Build reusable growth systems from one project context",
    description: "Generate campaigns, copy systems, funnel logic, and growth playbooks tied to the product.",
    tier: "pro", generatorCount: 5,
    endpoints: ["POST /v1/marketing/generate", "POST /v1/marketing/export"],
    outputFiles: ["campaign-brief.md", "funnel-map.md", "sequence-pack.md", "cro-playbook.md", "ab-test-plan.md"],
    freeFeatures: ["Limited templates", "One campaign preview"],
    paidFeatures: ["Campaign workspaces", "Sequence exports", "Funnel maps", "Team templates", "API access"],
  },
  {
    name: "notebook", label: "Axis Notebook", icon: "📓", category: "Knowledge & Context",
    promise: "Turn source materials into structured research artifacts",
    description: "Build project-specific notebooks, summaries, and source-linked outputs from uploaded materials.",
    tier: "pro", generatorCount: 5,
    endpoints: ["POST /v1/notebook/generate", "POST /v1/notebook/export"],
    outputFiles: ["notebook-summary.md", "source-map.json", "study-brief.md", "research-threads.md", "citation-index.json"],
    freeFeatures: ["Limited uploads", "Summary preview"],
    paidFeatures: ["Larger collections", "Saved notebooks", "Export artifacts", "Workflow generation", "API access"],
  },
  {
    name: "obsidian", label: "Axis Obsidian", icon: "💎", category: "Knowledge & Context",
    promise: "Bring structured AI workflows into vault-based knowledge systems",
    description: "Generate vault-aware workflows, linking rules, and knowledge graph helpers for Obsidian users.",
    tier: "pro", generatorCount: 5,
    endpoints: ["POST /v1/obsidian/analyze", "POST /v1/obsidian/generate"],
    outputFiles: ["obsidian-skill-pack.md", "vault-rules.md", "graph-prompt-map.json", "linking-policy.md", "template-pack.md"],
    freeFeatures: ["Basic vault helpers", "Limited skill packs"],
    paidFeatures: ["Advanced vault analysis", "Graph workflows", "Premium skill packs", "Export/import tools", "API access"],
  },
  {
    name: "mcp", label: "Axis MCP", icon: "🔌", category: "Engineering Delivery",
    promise: "Connect tools and services through a hosted protocol layer",
    description: "Provide private, hosted MCP endpoints and capability orchestration for build workflows.",
    tier: "pro", generatorCount: 4,
    endpoints: ["POST /v1/mcp/provision", "POST /v1/mcp/configure", "GET /v1/mcp/registry"],
    outputFiles: ["mcp-config.json", "connector-map.yaml", "capability-registry.json", "server-manifest.yaml"],
    freeFeatures: ["Sandbox server", "Limited connections"],
    paidFeatures: ["Hosted private endpoints", "Persistent configs", "Auth management", "Usage logs", "Webhooks"],
  },
  {
    name: "artifacts", label: "Axis Artifacts", icon: "🧩", category: "Engineering Delivery",
    promise: "Generate drop-in web artifacts for the active project",
    description: "Create dashboards, widgets, calculators, and mini-apps that match the project stack and style.",
    tier: "pro", generatorCount: 5,
    endpoints: ["POST /v1/artifacts/generate", "POST /v1/artifacts/export"],
    outputFiles: ["generated-component.tsx", "dashboard-widget.tsx", "embed-snippet.ts", "artifact-spec.md", "component-library.json"],
    freeFeatures: ["Preview artifacts", "Limited generations"],
    paidFeatures: ["Export code", "Save templates", "Deploy support", "Embed outputs", "API access"],
  },
  {
    name: "remotion", label: "Axis Remotion", icon: "🎬", category: "Creative Generation",
    promise: "Turn structured inputs into automated video workflows",
    description: "Generate scripts, scenes, and render-ready plans for video output tied to product or brand context.",
    tier: "pro", generatorCount: 5,
    endpoints: ["POST /v1/remotion/generate", "POST /v1/remotion/export"],
    outputFiles: ["remotion-script.ts", "scene-plan.md", "render-config.json", "asset-checklist.md", "storyboard.md"],
    freeFeatures: ["Short script generation", "Scene preview"],
    paidFeatures: ["Rendering workflows", "Reusable templates", "Batch generation", "Branded exports", "API access"],
  },
  {
    name: "canvas", label: "Axis Canvas", icon: "🖼️", category: "Creative Generation",
    promise: "Generate structured design assets in the Axis visual language",
    description: "Create posters, social assets, panels, and visual surfaces aligned to the system theme.",
    tier: "pro", generatorCount: 5,
    endpoints: ["POST /v1/canvas/generate", "POST /v1/canvas/export"],
    outputFiles: ["canvas-spec.json", "social-pack.md", "poster-layouts.md", "asset-guidelines.md", "brand-board.md"],
    freeFeatures: ["Watermarked exports", "Limited templates"],
    paidFeatures: ["Clean exports", "Full template library", "Multi-format output", "Brand sync", "API access"],
  },
  {
    name: "algorithmic", label: "Axis Algorithmic", icon: "🧬", category: "Creative Generation",
    promise: "Turn parameter spaces into generative visual outputs",
    description: "Generate p5.js sketches, parameter packs, collection maps, and variation matrices for creative coding.",
    tier: "pro", generatorCount: 5,
    endpoints: ["POST /v1/algorithmic/generate", "POST /v1/algorithmic/export"],
    outputFiles: ["generative-sketch.ts", "parameter-pack.json", "collection-map.md", "export-manifest.yaml", "variation-matrix.json"],
    freeFeatures: ["Single sketch generation", "Preview output"],
    paidFeatures: ["Batch generation", "Collection management", "Export manifests", "High-res output", "API access"],
  },
];

const API_ENDPOINTS = [
  { method: "POST", path: "/v1/snapshots", description: "Create a new snapshot from uploaded source files", auth: true },
  { method: "GET", path: "/v1/projects/:id/generated-files", description: "List all generated files for a project", auth: true },
  { method: "GET", path: "/v1/projects/:id/generated-files/:path", description: "Get contents of a specific generated file", auth: true },
  { method: "POST", path: "/v1/{program}/endpoint", description: "Run a specific program against a snapshot", auth: true },
  { method: "GET", path: "/v1/projects/:id/export", description: "Export all generated files as ZIP", auth: true },
  { method: "GET", path: "/v1/health", description: "Health check — returns status and version", auth: false },
  { method: "POST", path: "/v1/search/index", description: "Build full-text search index for a snapshot", auth: true },
  { method: "POST", path: "/v1/search/query", description: "Full-text search across indexed snapshot", auth: true },
  { method: "POST", path: "/v1/accounts", description: "Create a new account", auth: false },
  { method: "GET", path: "/v1/account", description: "Get current account details", auth: true },
  { method: "POST", path: "/v1/account/keys", description: "Create a new API key", auth: true },
  { method: "GET", path: "/v1/account/keys", description: "List all API keys", auth: true },
  { method: "GET", path: "/v1/account/usage", description: "Get usage statistics", auth: true },
  { method: "GET", path: "/v1/plans", description: "List available plans and features", auth: false },
  { method: "GET", path: "/v1/account/funnel", description: "Get funnel/onboarding status", auth: true },
  { method: "POST", path: "/v1/account/seats", description: "Invite a team member", auth: true },
  { method: "GET", path: "/v1/account/seats", description: "List team seats", auth: true },
];

export function DocsPage() {
  const [section, setSection] = useState<DocSection>("overview");
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);

  const sections: { id: DocSection; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📖" },
    { id: "programs", label: "Programs", icon: "🧰" },
    { id: "api", label: "API Reference", icon: "🔗" },
    { id: "outputs", label: "Output Formats", icon: "📄" },
    { id: "cli", label: "CLI Usage", icon: "⌨️" },
  ];

  return (
    <div>
      <div className="card" style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: 8 }}>Documentation</h2>
        <p style={{ color: "var(--text-muted)", maxWidth: 520, margin: "0 auto" }}>
          Everything you need to know about Axis Toolbox — programs, API, outputs, and CLI.
        </p>
      </div>

      <div className="tabs" style={{ marginBottom: 24 }}>
        {sections.map((s) => (
          <button
            key={s.id}
            className={`tab ${section === s.id ? "active" : ""}`}
            onClick={() => setSection(s.id)}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {section === "overview" && <OverviewSection />}
      {section === "programs" && (
        <ProgramsSection expanded={expandedProgram} onToggle={setExpandedProgram} />
      )}
      {section === "api" && <ApiSection />}
      {section === "outputs" && <OutputsSection />}
      {section === "cli" && <CliSection />}
    </div>
  );
}

function OverviewSection() {
  return (
    <div className="stagger">
      <div className="card">
        <h3 style={{ marginBottom: 12 }}>What is Axis Toolbox?</h3>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
          Axis is the umbrella platform for AI-native development — a multi-program system
          that turns project snapshots into diagnostics, governed outputs, and build-integrated
          tooling. It provides shared identity, snapshot intake, project context, and a unified
          design system across 17 separately billable programs organized into 6 categories:
          Repo Intelligence, Governance, Engineering Delivery, Growth &amp; Content,
          Knowledge &amp; Context, Design System, and Creative Generation.
        </p>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginTop: 12 }}>
          <strong style={{ color: "var(--accent)" }}>Positioning:</strong>{" "}
          The operating system for AI-native development. Free gives diagnosis — paid gives execution.
          Every program is purchasable individually, while the Suite bundle is optional.
        </p>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>How It Works</h3>
        <div className="grid grid-3">
          <div style={{ textAlign: "center", padding: 16 }}>
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>📤</div>
            <h4 style={{ marginBottom: 4 }}>1. Upload</h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>
              Drop a folder, upload a ZIP, or paste a GitHub URL. Axis scans all source files.
            </p>
          </div>
          <div style={{ textAlign: "center", padding: 16 }}>
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>🔬</div>
            <h4 style={{ marginBottom: 4 }}>2. Analyze</h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>
              The snapshot engine detects frameworks, languages, structure, dependencies, and patterns.
            </p>
          </div>
          <div style={{ textAlign: "center", padding: 16 }}>
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>🧰</div>
            <h4 style={{ marginBottom: 4 }}>3. Generate</h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>
              Run any of 17 programs to produce specialized output files — rules, configs, docs, and more.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Quick Stats</h3>
        <div className="grid grid-4">
          <div style={{ textAlign: "center" }}>
            <div className="stat-value">17</div>
            <div className="stat-label">Programs</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div className="stat-value">80</div>
            <div className="stat-label">Generators</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div className="stat-value">3 Free</div>
            <div className="stat-label">14 Pro</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div className="stat-value">6</div>
            <div className="stat-label">Categories</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Authentication</h3>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 12 }}>
          All authenticated endpoints require a Bearer token in the <code className="mono">Authorization</code> header.
          API keys use the <code className="mono">axis_</code> prefix.
        </p>
        <div style={{ background: "var(--bg)", padding: 12, borderRadius: "var(--radius)", fontFamily: "var(--mono)", fontSize: "0.8125rem" }}>
          <span style={{ color: "var(--text-muted)" }}>Authorization:</span>{" "}
          <span style={{ color: "var(--accent)" }}>Bearer axis_your_api_key_here</span>
        </div>
      </div>
    </div>
  );
}

function ProgramsSection({
  expanded,
  onToggle,
}: {
  expanded: string | null;
  onToggle: (name: string | null) => void;
}) {
  const free = PROGRAM_DOCS.filter((p) => p.tier === "free");
  const pro = PROGRAM_DOCS.filter((p) => p.tier === "pro");

  return (
    <div className="stagger">
      <div className="card">
        <div className="flex-between" style={{ marginBottom: 12 }}>
          <h3>Free Programs</h3>
          <span className="badge badge-green">{free.length} programs</span>
        </div>
        {free.map((p) => (
          <ProgramDocCard
            key={p.name}
            program={p}
            expanded={expanded === p.name}
            onToggle={() => onToggle(expanded === p.name ? null : p.name)}
          />
        ))}
      </div>

      <div className="card">
        <div className="flex-between" style={{ marginBottom: 12 }}>
          <h3>Pro Programs</h3>
          <span className="badge badge-accent">{pro.length} programs</span>
        </div>
        {pro.map((p) => (
          <ProgramDocCard
            key={p.name}
            program={p}
            expanded={expanded === p.name}
            onToggle={() => onToggle(expanded === p.name ? null : p.name)}
          />
        ))}
      </div>
    </div>
  );
}

function ProgramDocCard({
  program,
  expanded,
  onToggle,
}: {
  program: ProgramDoc;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        borderBottom: "1px solid var(--border)",
        padding: "12px 0",
      }}
    >
      <div
        className="flex-between"
        style={{ cursor: "pointer" }}
        onClick={onToggle}
      >
        <div className="flex" style={{ gap: 10 }}>
          <span style={{ fontSize: "1.1rem" }}>{program.icon}</span>
          <div>
            <strong style={{ fontSize: "0.875rem" }}>{program.label}</strong>
            <span
              className={`badge ${program.tier === "free" ? "badge-green" : "badge-accent"}`}
              style={{ marginLeft: 8, fontSize: "0.6875rem" }}
            >
              {program.tier}
            </span>
            <span
              className="badge"
              style={{ marginLeft: 4, fontSize: "0.6875rem", background: "var(--bg)" }}
            >
              {program.category}
            </span>
          </div>
        </div>
        <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: 12, paddingLeft: 32 }} className="animate-fade-in">
          <p style={{ color: "var(--accent)", fontSize: "0.875rem", fontStyle: "italic", marginBottom: 8 }}>
            "{program.promise}"
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", lineHeight: 1.6, marginBottom: 12 }}>
            {program.description}
          </p>
          {program.notes && (
            <p style={{ color: "var(--yellow)", fontSize: "0.75rem", marginBottom: 12 }}>
              ⚡ {program.notes}
            </p>
          )}

          <div className="grid grid-2" style={{ gap: 12, marginBottom: 12 }}>
            <div>
              <strong style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Endpoints</strong>
              <div style={{ marginTop: 4 }}>
                {program.endpoints.map((ep) => {
                  const [method, ...pathParts] = ep.split(" ");
                  return (
                    <div
                      key={ep}
                      className="mono"
                      style={{
                        background: "var(--bg)",
                        padding: "4px 8px",
                        borderRadius: "var(--radius)",
                        fontSize: "0.75rem",
                        marginBottom: 2,
                      }}
                    >
                      <span style={{ color: method === "GET" ? "var(--green)" : "var(--accent)" }}>{method}</span>{" "}
                      {pathParts.join(" ")}
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <strong style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Output Files ({program.generatorCount} generators)
              </strong>
              <div className="flex-wrap" style={{ gap: 4, marginTop: 4 }}>
                {program.outputFiles.map((f) => (
                  <span
                    key={f}
                    className="badge"
                    style={{ fontSize: "0.6875rem", background: "var(--bg)" }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-2" style={{ gap: 12 }}>
            <div>
              <strong style={{ fontSize: "0.75rem", color: "var(--green)" }}>Free Features</strong>
              <ul style={{ paddingLeft: 16, margin: "4px 0 0", fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                {program.freeFeatures.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
            <div>
              <strong style={{ fontSize: "0.75rem", color: "var(--accent)" }}>Paid Features</strong>
              <ul style={{ paddingLeft: 16, margin: "4px 0 0", fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                {program.paidFeatures.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ApiSection() {
  return (
    <div className="stagger">
      <div className="card">
        <h3 style={{ marginBottom: 8 }}>Base URL</h3>
        <div
          className="mono"
          style={{
            background: "var(--bg)",
            padding: 12,
            borderRadius: "var(--radius)",
            fontSize: "0.875rem",
          }}
        >
          http://localhost:4000/v1
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", marginTop: 8 }}>
          All endpoints are prefixed with <code className="mono">/v1</code>.
          Authenticated endpoints require a valid <code className="mono">axis_*</code> Bearer token.
        </p>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Endpoints</h3>
        <table>
          <thead>
            <tr>
              <th style={{ width: "10%" }}>Method</th>
              <th style={{ width: "40%" }}>Path</th>
              <th style={{ width: "40%" }}>Description</th>
              <th style={{ width: "10%", textAlign: "center" }}>Auth</th>
            </tr>
          </thead>
          <tbody>
            {API_ENDPOINTS.map((ep) => (
              <tr key={`${ep.method}-${ep.path}`}>
                <td>
                  <span
                    className="badge"
                    style={{
                      fontSize: "0.6875rem",
                      background: ep.method === "GET" ? "var(--green)" : "var(--accent)",
                      color: "white",
                    }}
                  >
                    {ep.method}
                  </span>
                </td>
                <td className="mono" style={{ fontSize: "0.8125rem" }}>{ep.path}</td>
                <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>{ep.description}</td>
                <td style={{ textAlign: "center" }}>
                  {ep.auth ? (
                    <span style={{ color: "var(--yellow)" }}>🔑</span>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Example: Create Snapshot</h3>
        <div
          style={{
            background: "var(--bg)",
            padding: 16,
            borderRadius: "var(--radius)",
            fontFamily: "var(--mono)",
            fontSize: "0.8125rem",
            lineHeight: 1.6,
            overflowX: "auto",
          }}
        >
          <div><span style={{ color: "var(--text-muted)" }}>curl</span> -X POST http://localhost:4000/v1/snapshots \</div>
          <div>&nbsp; -H <span style={{ color: "var(--green)" }}>"Authorization: Bearer axis_your_key"</span> \</div>
          <div>&nbsp; -H <span style={{ color: "var(--green)" }}>"Content-Type: application/json"</span> \</div>
          <div>&nbsp; -d <span style={{ color: "var(--yellow)" }}>'{`{"project_name": "my-app", "files": [...]}`}'</span></div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Error Responses</h3>
        <table>
          <thead>
            <tr>
              <th style={{ width: "15%" }}>Code</th>
              <th style={{ width: "30%" }}>Status</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><span className="badge badge-yellow">400</span></td><td>Bad Request</td><td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Invalid or missing parameters</td></tr>
            <tr><td><span className="badge badge-yellow">401</span></td><td>Unauthorized</td><td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Missing or invalid API key</td></tr>
            <tr><td><span className="badge badge-yellow">403</span></td><td>Forbidden</td><td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Insufficient tier for this program</td></tr>
            <tr><td><span className="badge badge-red">404</span></td><td>Not Found</td><td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Resource does not exist</td></tr>
            <tr><td><span className="badge badge-red">429</span></td><td>Rate Limit</td><td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Too many requests — retry after cooldown</td></tr>
            <tr><td><span className="badge badge-red">500</span></td><td>Server Error</td><td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Internal error — check server logs</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OutputsSection() {
  return (
    <div className="stagger">
      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Output Structure</h3>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 16 }}>
          Every program generates files organized by program name. Files are returned as part
          of the snapshot response and can be downloaded individually or exported as a ZIP archive.
        </p>
        <div
          style={{
            background: "var(--bg)",
            padding: 16,
            borderRadius: "var(--radius)",
            fontFamily: "var(--mono)",
            fontSize: "0.8125rem",
            lineHeight: 1.8,
          }}
        >
          <div style={{ color: "var(--text-muted)" }}>generated-files/</div>
          <div>&nbsp; search/</div>
          <div>&nbsp;&nbsp;&nbsp; context-map.md</div>
          <div>&nbsp;&nbsp;&nbsp; project-summary.md</div>
          <div>&nbsp; skills/</div>
          <div>&nbsp;&nbsp;&nbsp; AGENTS.md</div>
          <div>&nbsp;&nbsp;&nbsp; CLAUDE.md</div>
          <div>&nbsp;&nbsp;&nbsp; .cursorrules</div>
          <div>&nbsp; debug/</div>
          <div>&nbsp;&nbsp;&nbsp; debug-playbook.md</div>
          <div>&nbsp;&nbsp;&nbsp; incident-template.md</div>
          <div style={{ color: "var(--text-muted)" }}>&nbsp; ...</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>File Formats</h3>
        <table>
          <thead>
            <tr>
              <th>Format</th>
              <th>Extension</th>
              <th>Used By</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="badge badge-green">Markdown</span></td>
              <td className="mono">.md</td>
              <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Most programs — documentation, rules, playbooks</td>
            </tr>
            <tr>
              <td><span className="badge badge-accent">JSON</span></td>
              <td className="mono">.json</td>
              <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Design tokens, MCP config, parameter packs</td>
            </tr>
            <tr>
              <td><span className="badge badge-yellow">CSS</span></td>
              <td className="mono">.css</td>
              <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Theme program — generated theme stylesheets</td>
            </tr>
            <tr>
              <td><span className="badge badge-blue">TypeScript/JS</span></td>
              <td className="mono">.tsx, .js</td>
              <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Artifacts, Remotion scripts, algorithmic sketches</td>
            </tr>
            <tr>
              <td><span className="badge" style={{ background: "var(--red)", color: "white" }}>HTML</span></td>
              <td className="mono">.html</td>
              <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Embed snippets, canvas exports</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Export Options</h3>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
          Download all generated files as a ZIP archive, or export a single program's output.
          The export endpoint supports an optional <code className="mono">?program=name</code> query
          parameter to filter by program.
        </p>
        <div
          className="mono"
          style={{
            background: "var(--bg)",
            padding: 12,
            borderRadius: "var(--radius)",
            fontSize: "0.8125rem",
            marginTop: 12,
          }}
        >
          <div>GET /v1/projects/:id/export <span style={{ color: "var(--text-muted)" }}>→ full ZIP</span></div>
          <div>GET /v1/projects/:id/export?program=search <span style={{ color: "var(--text-muted)" }}>→ search-only ZIP</span></div>
        </div>
      </div>
    </div>
  );
}

function CliSection() {
  return (
    <div className="stagger">
      <div className="card">
        <h3 style={{ marginBottom: 12 }}>CLI Overview</h3>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 16 }}>
          Axis Toolbox includes a CLI for running analysis directly from your terminal.
          Point it at any directory to generate a snapshot and run programs.
        </p>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Basic Usage</h3>
        <div
          style={{
            background: "var(--bg)",
            padding: 16,
            borderRadius: "var(--radius)",
            fontFamily: "var(--mono)",
            fontSize: "0.8125rem",
            lineHeight: 1.8,
          }}
        >
          <div><span style={{ color: "var(--text-muted)" }}># Analyze the current directory</span></div>
          <div>npx axis-toolbox analyze .</div>
          <div style={{ marginTop: 8 }}><span style={{ color: "var(--text-muted)" }}># Analyze and run specific programs</span></div>
          <div>npx axis-toolbox analyze ./my-project --programs search,skills,debug</div>
          <div style={{ marginTop: 8 }}><span style={{ color: "var(--text-muted)" }}># Export generated files</span></div>
          <div>npx axis-toolbox export ./my-project --output ./output</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>CLI Options</h3>
        <table>
          <thead>
            <tr>
              <th style={{ width: "30%" }}>Flag</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="mono" style={{ fontSize: "0.8125rem" }}>--programs</td>
              <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Comma-separated list of programs to run</td>
            </tr>
            <tr>
              <td className="mono" style={{ fontSize: "0.8125rem" }}>--output, -o</td>
              <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Output directory for generated files</td>
            </tr>
            <tr>
              <td className="mono" style={{ fontSize: "0.8125rem" }}>--api-key</td>
              <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>API key (or set AXIS_API_KEY env var)</td>
            </tr>
            <tr>
              <td className="mono" style={{ fontSize: "0.8125rem" }}>--format</td>
              <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Output format: json, markdown, or zip</td>
            </tr>
            <tr>
              <td className="mono" style={{ fontSize: "0.8125rem" }}>--verbose, -v</td>
              <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Enable verbose logging</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
