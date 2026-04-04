import { useState, useEffect } from "react";
import type { SnapshotResponse, GeneratedFile } from "../api.ts";
import { getGeneratedFiles, runProgram, downloadExport } from "../api.ts";
import { OverviewTab } from "../components/OverviewTab.tsx";
import { FilesTab } from "../components/FilesTab.tsx";
import { GraphTab } from "../components/GraphTab.tsx";
import { GeneratedTab } from "../components/GeneratedTab.tsx";
import { ProgramLauncher } from "../components/ProgramLauncher.tsx";

interface Props {
  result: SnapshotResponse;
}

const TABS = ["Overview", "Structure", "Dependencies", "Generated Files", "Programs"] as const;
type Tab = (typeof TABS)[number];

export function DashboardPage({ result }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    getGeneratedFiles(result.project_id)
      .then((data) => setGeneratedFiles(data.files))
      .catch(() => {});
  }, [result.project_id]);

  async function handleRunProgram(endpoint: string) {
    const res = await runProgram(endpoint, result.snapshot_id);
    // Merge new files into the list (replace existing by path)
    setGeneratedFiles((prev) => {
      const existing = new Map(prev.map((f) => [f.path, f]));
      for (const f of res.files) existing.set(f.path, f);
      return [...existing.values()];
    });
    setActiveTab("Generated Files");
  }

  async function handleDownloadAll() {
    setDownloading(true);
    try {
      await downloadExport(result.project_id);
    } catch {
      // silently fail — could show toast
    } finally {
      setDownloading(false);
    }
  }

  const ctx = result.context_map;
  const profile = result.repo_profile;

  return (
    <div>
      <div className="card" style={{ marginBottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
        <div className="flex-between" style={{ marginBottom: 8 }}>
          <div>
            <h2 style={{ fontSize: "1.25rem" }}>{ctx.project_identity.name}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              {ctx.project_identity.type.replace(/_/g, " ")} · {ctx.project_identity.primary_language}
            </p>
          </div>
          <div className="flex" style={{ gap: 6 }}>
            <span className="badge badge-green">{result.status}</span>
            <span className="badge">{ctx.structure.total_files} files</span>
            <span className="badge">{ctx.structure.total_loc.toLocaleString()} LOC</span>
            {generatedFiles.length > 0 && (
              <button
                className="btn btn-primary"
                style={{ fontSize: "0.8125rem", padding: "4px 12px" }}
                disabled={downloading}
                onClick={handleDownloadAll}
              >
                {downloading ? <><span className="spinner" /> Zipping...</> : "⬇ Download All"}
              </button>
            )}
          </div>
        </div>
        {ctx.ai_context.project_summary && (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            {ctx.ai_context.project_summary}
          </p>
        )}
      </div>

      <div className="tabs">
        {TABS.map((tab) => (
          <div
            key={tab}
            className={`tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === "Generated Files" && generatedFiles.length > 0 && (
              <span className="badge badge-accent" style={{ marginLeft: 6, fontSize: "0.6875rem" }}>
                {generatedFiles.length}
              </span>
            )}
          </div>
        ))}
      </div>

      {activeTab === "Overview" && <OverviewTab ctx={ctx} profile={profile} />}
      {activeTab === "Structure" && <FilesTab ctx={ctx} />}
      {activeTab === "Dependencies" && <GraphTab ctx={ctx} />}
      {activeTab === "Generated Files" && (
        <GeneratedTab files={generatedFiles} projectId={result.project_id} />
      )}
      {activeTab === "Programs" && (
        <ProgramLauncher
          snapshotId={result.snapshot_id}
          generatedFiles={generatedFiles}
          onRun={handleRunProgram}
        />
      )}
    </div>
  );
}
