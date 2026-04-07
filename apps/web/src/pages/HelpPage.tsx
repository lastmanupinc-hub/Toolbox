import { useState } from "react";

type HelpSection = "getting-started" | "upload" | "programs" | "account" | "troubleshooting";

interface Step {
  number: number;
  title: string;
  description: string;
  icon: string;
}

interface TroubleshootItem {
  problem: string;
  solution: string;
}

const GETTING_STARTED_STEPS: Step[] = [
  { number: 1, title: "Create an Account", description: "Go to the Account page and sign up with your name and email. You'll receive an API key with the axis_ prefix — save it somewhere safe.", icon: "👤" },
  { number: 2, title: "Upload Your Project", description: "Head to the Analyze page. Drag and drop a folder, upload a ZIP file, or paste a GitHub repository URL. Axis will scan all source files.", icon: "📤" },
  { number: 3, title: "Review the Snapshot", description: "Once analysis completes, you'll land on the Dashboard. Explore the Overview, Structure, Dependencies, and other tabs to understand your codebase.", icon: "📊" },
  { number: 4, title: "Run Programs", description: "Switch to the Programs tab and click any program card to generate tailored output files. Free-tier users get 3 programs; upgrade for all 17.", icon: "🧰" },
  { number: 5, title: "Download or Search", description: "Use the Generated Files tab to view and copy output, or export everything as a ZIP. The Search tab lets you query your indexed snapshot.", icon: "⬇️" },
];

const UPLOAD_TIPS = [
  { title: "Folder Upload", description: "Click 'Choose Folder' to select a project directory. Axis reads all source files recursively, ignoring common exclusions like node_modules and .git." },
  { title: "ZIP Upload", description: "Click the ZIP button or drag a .zip file onto the upload area. Axis extracts and analyzes all files inside." },
  { title: "GitHub URL", description: "Paste any public GitHub repository URL (e.g. https://github.com/user/repo). Axis clones and analyzes the default branch." },
  { title: "Project Settings", description: "Optionally name your project, select a project type, describe your goals, and choose which output categories to generate." },
];

const TROUBLESHOOTING: TroubleshootItem[] = [
  { problem: "API shows red dot in the status bar", solution: "The API server isn't running. Start it with `pnpm dev` in the apps/api directory. Make sure port 4000 is available." },
  { problem: "\"Unauthorized\" error on program run", solution: "Your API key may be missing or invalid. Go to Account, check your key, or create a new one. Keys must start with axis_." },
  { problem: "Dashboard won't load after upload", solution: "The upload may have failed silently. Check the browser console for errors. Try re-uploading with a smaller project first." },
  { problem: "Programs show as locked (🔒)", solution: "You're on the Free tier which includes 3 programs. Upgrade to Pro or Enterprise to unlock all 17 programs." },
  { problem: "ZIP upload fails", solution: "Ensure the ZIP file isn't corrupted and contains source files. Maximum recommended size is 50MB. Very large repos should use GitHub URL instead." },
  { problem: "Search returns no results", solution: "You need to build the search index first. Go to the Search tab and click 'Index Snapshot' before running queries." },
  { problem: "Slow analysis for large repo", solution: "Large repositories take longer to scan. Consider uploading only the relevant source directories instead of the entire project root." },
  { problem: "Generated files look generic", solution: "Make sure you're uploading actual source files, not just config. The more source code Axis can analyze, the more specific the output." },
];

export function HelpPage() {
  const [section, setSection] = useState<HelpSection>("getting-started");

  const sections: { id: HelpSection; label: string; icon: string }[] = [
    { id: "getting-started", label: "Getting Started", icon: "🚀" },
    { id: "upload", label: "Upload Guide", icon: "📤" },
    { id: "programs", label: "Using Programs", icon: "🧰" },
    { id: "account", label: "Account & Billing", icon: "💳" },
    { id: "troubleshooting", label: "Troubleshooting", icon: "🔧" },
  ];

  return (
    <div>
      <div className="card" style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: 8 }}>Help Center</h2>
        <p style={{ color: "var(--text-muted)", maxWidth: 520, margin: "0 auto" }}>
          Step-by-step guides, tips, and troubleshooting for Axis Toolbox.
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

      {section === "getting-started" && <GettingStartedSection />}
      {section === "upload" && <UploadGuideSection />}
      {section === "programs" && <ProgramsGuideSection />}
      {section === "account" && <AccountGuideSection />}
      {section === "troubleshooting" && <TroubleshootingSection />}
    </div>
  );
}

function GettingStartedSection() {
  return (
    <div className="stagger">
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Quick Start Guide</h3>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 20 }}>
          Get up and running with Axis Toolbox in 5 steps.
        </p>
        {GETTING_STARTED_STEPS.map((step) => (
          <div
            key={step.number}
            className="flex"
            style={{
              gap: 16,
              padding: "16px 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "var(--accent)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {step.number}
            </div>
            <div>
              <div className="flex" style={{ gap: 8, marginBottom: 4 }}>
                <span>{step.icon}</span>
                <strong style={{ fontSize: "0.9375rem" }}>{step.title}</strong>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", lineHeight: 1.6 }}>
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Keyboard Shortcuts</h3>
        <table>
          <thead>
            <tr>
              <th style={{ width: "30%" }}>Shortcut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><kbd>Ctrl+1</kbd></td><td style={{ color: "var(--text-muted)" }}>Go to Analyze page</td></tr>
            <tr><td><kbd>Ctrl+2</kbd></td><td style={{ color: "var(--text-muted)" }}>Go to Dashboard (when available)</td></tr>
            <tr><td><kbd>Ctrl+3</kbd></td><td style={{ color: "var(--text-muted)" }}>Go to Plans page</td></tr>
            <tr><td><kbd>Ctrl+4</kbd></td><td style={{ color: "var(--text-muted)" }}>Go to Account page</td></tr>
            <tr><td><kbd>Ctrl+K</kbd></td><td style={{ color: "var(--text-muted)" }}>Open Command Palette</td></tr>
            <tr><td><kbd>Alt+1–6</kbd></td><td style={{ color: "var(--text-muted)" }}>Switch Dashboard tabs</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UploadGuideSection() {
  return (
    <div className="stagger">
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Upload Methods</h3>
        <div className="grid grid-2">
          {UPLOAD_TIPS.map((tip) => (
            <div
              key={tip.title}
              className="card"
              style={{ padding: 16, marginBottom: 0 }}
            >
              <h4 style={{ fontSize: "0.875rem", marginBottom: 8 }}>{tip.title}</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", lineHeight: 1.6 }}>
                {tip.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>What Gets Scanned</h3>
        <div className="grid grid-2">
          <div>
            <h4 style={{ fontSize: "0.875rem", color: "var(--green)", marginBottom: 8 }}>✓ Included</h4>
            <ul style={{ color: "var(--text-muted)", fontSize: "0.8125rem", lineHeight: 1.8, paddingLeft: 20 }}>
              <li>Source files (.ts, .js, .py, .go, .rs, etc.)</li>
              <li>Config files (package.json, tsconfig, etc.)</li>
              <li>Markdown documentation (.md)</li>
              <li>Stylesheets (.css, .scss)</li>
              <li>Templates (.html, .svelte, .vue)</li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: "0.875rem", color: "var(--red)", marginBottom: 8 }}>✗ Excluded</h4>
            <ul style={{ color: "var(--text-muted)", fontSize: "0.8125rem", lineHeight: 1.8, paddingLeft: 20 }}>
              <li>node_modules / vendor directories</li>
              <li>.git directory</li>
              <li>Binary files (images, PDFs, etc.)</li>
              <li>Build output (dist, build, .next)</li>
              <li>Lock files (package-lock, yarn.lock)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Supported Languages</h3>
        <div className="flex-wrap" style={{ gap: 8 }}>
          {["TypeScript", "JavaScript", "Python", "Go", "Rust", "Java", "C#", "C/C++", "Ruby", "PHP", "Swift", "Kotlin", "Svelte", "Vue", "HTML", "CSS", "SCSS", "YAML", "JSON", "Markdown"].map((lang) => (
            <span key={lang} className="badge badge-accent" style={{ fontSize: "0.75rem" }}>
              {lang}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgramsGuideSection() {
  return (
    <div className="stagger">
      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Running Programs</h3>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 16 }}>
          After uploading and analyzing your project, switch to the <strong>Programs</strong> tab
          on the Dashboard. Each card represents a program that generates specialized output files.
        </p>
        <div className="grid grid-3">
          <div className="card" style={{ padding: 16, marginBottom: 0, textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>1️⃣</div>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Click a program card</p>
          </div>
          <div className="card" style={{ padding: 16, marginBottom: 0, textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>2️⃣</div>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Wait for generation</p>
          </div>
          <div className="card" style={{ padding: 16, marginBottom: 0, textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>3️⃣</div>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>View in Generated Files tab</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Program Tiers</h3>
        <table>
          <thead>
            <tr>
              <th>Tier</th>
              <th>Programs</th>
              <th>Examples</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="badge badge-green">Free</span></td>
              <td>3 programs</td>
              <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Search Context, Skills & Agents, Debug Playbook</td>
            </tr>
            <tr>
              <td><span className="badge badge-accent">Pro</span></td>
              <td>14 programs</td>
              <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Frontend Audit, SEO, Theme, Brand, Marketing, MCP, and more</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Tips for Better Output</h3>
        <ul style={{ color: "var(--text-muted)", fontSize: "0.8125rem", lineHeight: 1.8, paddingLeft: 20 }}>
          <li>Upload your <strong>source code</strong>, not just config files — more context means better output</li>
          <li>Include your <strong>package.json</strong> or equivalent — it helps detect frameworks and dependencies</li>
          <li>Add a <strong>README.md</strong> — it provides project context to the generators</li>
          <li>Set meaningful <strong>goals</strong> in the upload form — they guide the output focus</li>
          <li>Re-run programs after making changes to your codebase for updated output</li>
        </ul>
      </div>
    </div>
  );
}

function AccountGuideSection() {
  return (
    <div className="stagger">
      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Account Management</h3>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 16 }}>
          Your Axis Toolbox account is managed through API keys. There are no passwords — your
          API key is your identity.
        </p>
        <div className="grid grid-2">
          <div className="card" style={{ padding: 16, marginBottom: 0 }}>
            <h4 style={{ fontSize: "0.875rem", marginBottom: 8 }}>Creating an Account</h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", lineHeight: 1.6 }}>
              Go to the Account page, enter your name and email, and click Sign Up.
              You'll get an API key immediately — store it safely as it cannot be retrieved later.
            </p>
          </div>
          <div className="card" style={{ padding: 16, marginBottom: 0 }}>
            <h4 style={{ fontSize: "0.875rem", marginBottom: 8 }}>Using Your API Key</h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", lineHeight: 1.6 }}>
              Paste your API key in the Account page to sign in. It's stored in localStorage
              and sent as a Bearer token with every API request.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Team Management</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", lineHeight: 1.7, marginBottom: 12 }}>
          Pro and Enterprise plans include team seats. Invite team members by email and assign
          roles (admin or member). Revoke access at any time.
        </p>
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Permissions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="badge badge-accent">Admin</span></td>
              <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Full access — manage seats, keys, billing, all programs</td>
            </tr>
            <tr>
              <td><span className="badge badge-green">Member</span></td>
              <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Run programs, view results, generate files</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Upgrading Your Plan</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", lineHeight: 1.7 }}>
          Visit the Plans page to compare tiers. The Free plan includes 3 core programs and 10
          snapshots per month. Pro unlocks all 17 programs, 200 snapshots, and team seats.
          Enterprise offers unlimited usage with dedicated support.
        </p>
      </div>
    </div>
  );
}

function TroubleshootingSection() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="stagger">
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Common Issues</h3>
        {TROUBLESHOOTING.map((item, i) => (
          <div
            key={i}
            style={{
              borderBottom: i < TROUBLESHOOTING.length - 1 ? "1px solid var(--border)" : undefined,
              padding: "12px 0",
            }}
          >
            <div
              className="flex-between"
              style={{ cursor: "pointer" }}
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <div className="flex" style={{ gap: 8 }}>
                <span style={{ color: "var(--yellow)" }}>⚠️</span>
                <strong style={{ fontSize: "0.875rem" }}>{item.problem}</strong>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                {expanded === i ? "▲" : "▼"}
              </span>
            </div>
            {expanded === i && (
              <div
                className="animate-fade-in"
                style={{
                  marginTop: 8,
                  paddingLeft: 32,
                  color: "var(--text-muted)",
                  fontSize: "0.8125rem",
                  lineHeight: 1.6,
                }}
              >
                {item.solution}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Still Need Help?</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", lineHeight: 1.7, marginBottom: 16 }}>
          If you can't find an answer here, try these resources:
        </p>
        <div className="grid grid-3">
          <div className="card" style={{ padding: 16, marginBottom: 0, textAlign: "center" }}>
            <div style={{ fontSize: "1.25rem", marginBottom: 8 }}>📖</div>
            <strong style={{ fontSize: "0.8125rem", display: "block", marginBottom: 4 }}>Docs</strong>
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Full documentation and API reference</p>
          </div>
          <div className="card" style={{ padding: 16, marginBottom: 0, textAlign: "center" }}>
            <div style={{ fontSize: "1.25rem", marginBottom: 8 }}>❓</div>
            <strong style={{ fontSize: "0.8125rem", display: "block", marginBottom: 4 }}>Q&A</strong>
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Community questions and answers</p>
          </div>
          <div className="card" style={{ padding: 16, marginBottom: 0, textAlign: "center" }}>
            <div style={{ fontSize: "1.25rem", marginBottom: 8 }}>📧</div>
            <strong style={{ fontSize: "0.8125rem", display: "block", marginBottom: 4 }}>Contact</strong>
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>support@axistoolbox.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
