import { useState } from "react";

type QACategory = "all" | "general" | "programs" | "api" | "billing" | "technical";

interface QAItem {
  question: string;
  answer: string;
  category: QACategory;
}

const QA_ITEMS: QAItem[] = [
  // General
  {
    category: "general",
    question: "What is Axis Toolbox?",
    answer: "Axis Toolbox is a codebase analysis platform with 17 specialized programs. Upload your source code and it generates tailored documentation, rules, configurations, and other artifacts specific to your project's architecture, frameworks, and patterns.",
  },
  {
    category: "general",
    question: "What kind of projects does it work with?",
    answer: "Axis Toolbox works with any source code project — web apps, APIs, CLI tools, libraries, monorepos, and more. It supports TypeScript, JavaScript, Python, Go, Rust, Java, C#, Ruby, PHP, Swift, Kotlin, and many other languages.",
  },
  {
    category: "general",
    question: "Is my code stored on your servers?",
    answer: "Your source code is processed during the analysis session and stored only as a snapshot for as long as you need it. Snapshots can be deleted at any time. No code is shared with third parties or used for training.",
  },
  {
    category: "general",
    question: "How is this different from other analysis tools?",
    answer: "Unlike linters or static analyzers, Axis Toolbox generates actionable output files — AGENTS.md, .cursorrules, debug playbooks, brand guidelines, design tokens, and more. It's not just finding issues; it's creating ready-to-use artifacts for your workflow.",
  },

  // Programs
  {
    category: "programs",
    question: "Which programs are free?",
    answer: "Three programs are always free: Search Context (🔍), Skills & Agents (🤖), and Debug Playbook (🐛). These cover AI search context, coding agent rules, and debugging workflows.",
  },
  {
    category: "programs",
    question: "What do the 14 Pro programs include?",
    answer: "Pro programs cover Frontend Audit, SEO Analysis, Optimization, Theme & Design Tokens, Brand System, Superpowers (automation), Marketing, Notebook, Obsidian vault tools, MCP Provision, Artifacts, Remotion Video, Canvas Design, and Algorithmic Art.",
  },
  {
    category: "programs",
    question: "Can I run multiple programs at once?",
    answer: "In the web UI, run programs one at a time by clicking their cards. Via CLI, use the --programs flag with comma-separated names to run several in sequence: npx axis-toolbox analyze . --programs search,skills,debug",
  },
  {
    category: "programs",
    question: "How long does a program take to run?",
    answer: "Most programs complete in 2–10 seconds depending on project size. Larger repos (1000+ files) may take 15–30 seconds. The UI shows a spinner while a program is generating.",
  },
  {
    category: "programs",
    question: "What output files are generated?",
    answer: "Each program generates 2–5 files, typically in Markdown (.md), JSON (.json), CSS (.css), or TypeScript/JavaScript (.tsx, .js). The Generated Files tab shows all outputs grouped by program, and you can download them individually or as a ZIP.",
  },
  {
    category: "programs",
    question: "Can I re-run a program to get updated output?",
    answer: "Yes. Re-running a program replaces the previously generated files for that program with fresh output based on the current snapshot. Other programs' files are not affected.",
  },

  // API
  {
    category: "api",
    question: "What is the API base URL?",
    answer: "The API runs at http://localhost:4000 with all endpoints prefixed under /v1. For example: POST /v1/snapshots, GET /v1/health.",
  },
  {
    category: "api",
    question: "How do I authenticate API requests?",
    answer: "Include your API key as a Bearer token in the Authorization header: Authorization: Bearer axis_your_key_here. API keys always start with the axis_ prefix.",
  },
  {
    category: "api",
    question: "What's the rate limit?",
    answer: "Free tier: 10 snapshots/month, 60 requests/minute. Pro tier: 200 snapshots/month, 300 requests/minute. Enterprise: unlimited. Rate-limited requests receive a 429 response.",
  },
  {
    category: "api",
    question: "Can I use the API without the web UI?",
    answer: "Absolutely. The API is fully independent — you can create snapshots, run programs, and download generated files using curl, Postman, or any HTTP client. The CLI also wraps the API.",
  },
  {
    category: "api",
    question: "Is there an OpenAPI specification?",
    answer: "The API follows REST conventions with JSON request/response bodies. Check the Docs page for the full endpoint reference including request formats, response shapes, and error codes.",
  },

  // Billing
  {
    category: "billing",
    question: "How much does Pro cost?",
    answer: "Pro is $29/month or $279/year (save 20% with annual billing). It includes all 17 programs, 200 snapshots/month, 20 projects, and 5 team seats.",
  },
  {
    category: "billing",
    question: "Can I try Pro before committing?",
    answer: "Start with the Free tier to try the 3 core programs. The output quality and format is identical to Pro — you just have access to fewer programs and lower limits.",
  },
  {
    category: "billing",
    question: "What's included in Enterprise?",
    answer: "Enterprise includes unlimited snapshots, programs, projects, and team seats. Plus SSO integration, audit logs, and dedicated support. Contact sales for pricing.",
  },
  {
    category: "billing",
    question: "How do team seats work?",
    answer: "Pro includes 5 seats and Enterprise is unlimited. Invite team members by email from the Account page. Each member gets their own API key. Admins can manage seats and billing.",
  },
  {
    category: "billing",
    question: "Can I cancel or downgrade?",
    answer: "Yes. Change your plan at any time from the Account page. Downgrading takes effect at the end of your current billing period. Your generated files remain accessible.",
  },

  // Technical
  {
    category: "technical",
    question: "What's the maximum upload size?",
    answer: "The recommended maximum is 50MB for ZIP uploads and ~5,000 files for folder uploads. For very large repos, use the GitHub URL method which handles cloning more efficiently.",
  },
  {
    category: "technical",
    question: "How does the full-text search work?",
    answer: "Search uses SQLite FTS5 — a high-performance full-text search engine. Click 'Index Snapshot' to build the index, then type any query. Results show file path, line number, and matching content.",
  },
  {
    category: "technical",
    question: "What frameworks does Axis detect?",
    answer: "Axis detects 50+ frameworks and libraries including React, Next.js, Vue, Svelte, Angular, Express, Fastify, Django, Flask, Rails, Spring Boot, ASP.NET, and many more. Detection is based on dependencies, imports, and code patterns.",
  },
  {
    category: "technical",
    question: "Does Axis work offline?",
    answer: "The web UI and API server run locally on your machine, so the core analysis and generation works offline. GitHub URL analysis requires internet access to clone the repository.",
  },
  {
    category: "technical",
    question: "Which browsers are supported?",
    answer: "Axis Toolbox works in all modern browsers — Chrome, Firefox, Safari, and Edge. The dark theme renders best with system-level dark mode enabled.",
  },
];

const CATEGORY_LABELS: Record<QACategory, { label: string; icon: string }> = {
  all: { label: "All", icon: "📋" },
  general: { label: "General", icon: "💡" },
  programs: { label: "Programs", icon: "🧰" },
  api: { label: "API", icon: "🔗" },
  billing: { label: "Billing", icon: "💳" },
  technical: { label: "Technical", icon: "⚙️" },
};

export function QAPage() {
  const [category, setCategory] = useState<QACategory>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = QA_ITEMS.filter((item) => {
    const matchesCategory = category === "all" || item.category === category;
    const matchesSearch =
      !search ||
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryCounts = new Map<QACategory, number>();
  for (const item of QA_ITEMS) {
    categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + 1);
  }

  return (
    <div>
      <div className="card" style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: 8 }}>Questions & Answers</h2>
        <p style={{ color: "var(--text-muted)", maxWidth: 520, margin: "0 auto 16px" }}>
          Find answers to common questions about Axis Toolbox.
        </p>
        <div style={{ maxWidth: 400, margin: "0 auto" }}>
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", textAlign: "center" }}
          />
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 24 }}>
        {(Object.keys(CATEGORY_LABELS) as QACategory[]).map((cat) => (
          <button
            key={cat}
            className={`tab ${category === cat ? "active" : ""}`}
            onClick={() => { setCategory(cat); setExpanded(null); }}
          >
            {CATEGORY_LABELS[cat].icon} {CATEGORY_LABELS[cat].label}
            {cat !== "all" && (
              <span
                style={{
                  marginLeft: 4,
                  fontSize: "0.6875rem",
                  color: "var(--text-muted)",
                }}
              >
                ({categoryCounts.get(cat) ?? 0})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: "2rem", display: "block", marginBottom: 8 }}>🔍</span>
          No questions match your search.
        </div>
      ) : (
        <div className="card stagger">
          {filtered.map((item, i) => {
            const globalIndex = QA_ITEMS.indexOf(item);
            return (
              <div
                key={globalIndex}
                style={{
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : undefined,
                  padding: "14px 0",
                }}
              >
                <div
                  className="flex-between"
                  style={{ cursor: "pointer" }}
                  onClick={() => setExpanded(expanded === globalIndex ? null : globalIndex)}
                >
                  <div className="flex" style={{ gap: 10 }}>
                    <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: "0.875rem" }}>Q</span>
                    <strong style={{ fontSize: "0.875rem" }}>{item.question}</strong>
                  </div>
                  <div className="flex" style={{ gap: 8 }}>
                    <span
                      className={`badge ${item.category === "general" ? "badge-green" : item.category === "programs" ? "badge-accent" : item.category === "api" ? "badge-blue" : item.category === "billing" ? "badge-yellow" : ""}`}
                      style={{ fontSize: "0.625rem" }}
                    >
                      {CATEGORY_LABELS[item.category].label}
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                      {expanded === globalIndex ? "▲" : "▼"}
                    </span>
                  </div>
                </div>
                {expanded === globalIndex && (
                  <div
                    className="animate-fade-in"
                    style={{
                      marginTop: 10,
                      paddingLeft: 24,
                      color: "var(--text-muted)",
                      fontSize: "0.8125rem",
                      lineHeight: 1.7,
                    }}
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="card" style={{ textAlign: "center", marginTop: 24 }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>
          Don't see your question? Check the{" "}
          <strong style={{ color: "var(--accent)", cursor: "pointer" }}>Help Center</strong> or reach out to{" "}
          <strong style={{ color: "var(--accent)" }}>support@axistoolbox.com</strong>
        </p>
      </div>
    </div>
  );
}
