import { useState, useCallback, useEffect } from "react";
import { UploadPage } from "./pages/UploadPage.tsx";
import { DashboardPage } from "./pages/DashboardPage.tsx";
import { PlansPage } from "./pages/PlansPage.tsx";
import { AccountPage } from "./pages/AccountPage.tsx";
import type { SnapshotResponse } from "./api.ts";

type Page = "upload" | "dashboard" | "plans" | "account";

function getInitialPage(): Page {
  const h = location.hash.replace("#", "");
  if (h === "plans" || h === "account") return h;
  return "upload";
}

export function App() {
  const [page, setPage] = useState<Page>(getInitialPage);
  const [result, setResult] = useState<SnapshotResponse | null>(null);

  useEffect(() => {
    const onHash = () => {
      const h = location.hash.replace("#", "");
      if (h === "plans") setPage("plans");
      else if (h === "account") setPage("account");
      else if (h === "dashboard" && result) setPage("dashboard");
      else setPage("upload");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [result]);

  const nav = useCallback((p: Page) => {
    setPage(p);
    location.hash = p === "upload" ? "" : p;
  }, []);

  const handleUploadComplete = useCallback((data: SnapshotResponse) => {
    setResult(data);
    setPage("dashboard");
    location.hash = "dashboard";
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    nav("upload");
  }, [nav]);

  const isLoggedIn = !!localStorage.getItem("axis_api_key");

  return (
    <>
      <header className="header">
        <div className="flex" style={{ gap: 12 }}>
          <h1 style={{ margin: 0, cursor: "pointer" }} onClick={handleReset}>
            ⚡ Axis Toolbox
          </h1>
          <span className="badge badge-accent">v0.3.0</span>
        </div>
        <nav className="flex" style={{ gap: 4 }}>
          <button
            className={`btn ${page === "upload" ? "btn-primary" : ""}`}
            onClick={() => nav("upload")}
          >
            Analyze
          </button>
          {result && (
            <button
              className={`btn ${page === "dashboard" ? "btn-primary" : ""}`}
              onClick={() => nav("dashboard")}
            >
              Dashboard
            </button>
          )}
          <button
            className={`btn ${page === "plans" ? "btn-primary" : ""}`}
            onClick={() => nav("plans")}
          >
            Plans
          </button>
          <button
            className={`btn ${page === "account" ? "btn-primary" : ""}`}
            onClick={() => nav("account")}
          >
            {isLoggedIn ? "Account" : "Sign Up"}
          </button>
        </nav>
      </header>

      {page === "upload" && <UploadPage onComplete={handleUploadComplete} />}
      {page === "dashboard" && result && <DashboardPage result={result} />}
      {page === "plans" && <PlansPage onSelectPlan={() => nav("account")} />}
      {page === "account" && <AccountPage />}
    </>
  );
}
