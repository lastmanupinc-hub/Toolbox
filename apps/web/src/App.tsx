import { useState, useCallback, useEffect, useRef, Component, type ReactNode } from "react";
import { UploadPage } from "./pages/UploadPage.tsx";
import { DashboardPage } from "./pages/DashboardPage.tsx";
import { PlansPage } from "./pages/PlansPage.tsx";
import { AccountPage } from "./pages/AccountPage.tsx";
import type { SnapshotResponse } from "./api.ts";

// ─── Error Boundary ─────────────────────────────────────────────

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error("UI crash:", error); }
  render() {
    if (this.state.error) {
      return (
        <div className="card" style={{ margin: 40, textAlign: "center", padding: 32 }}>
          <h2>Something went wrong</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>{this.state.error.message}</p>
          <button className="btn btn-primary" onClick={() => { this.setState({ error: null }); location.hash = ""; }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

type Page = "upload" | "dashboard" | "plans" | "account";

function getInitialPage(): Page {
  const h = location.hash.replace("#", "");
  if (h === "plans" || h === "account") return h;
  return "upload";
}

export function App() {
  const [page, setPage] = useState<Page>(getInitialPage);
  const [result, setResult] = useState<SnapshotResponse | null>(null);
  const resultRef = useRef(result);
  resultRef.current = result;

  useEffect(() => {
    const onHash = () => {
      const h = location.hash.replace("#", "");
      if (h === "plans") setPage("plans");
      else if (h === "account") setPage("account");
      else if (h === "dashboard" && resultRef.current) setPage("dashboard");
      else setPage("upload");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

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

  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("axis_api_key"));

  const handleAuthChange = useCallback(() => {
    setLoggedIn(!!localStorage.getItem("axis_api_key"));
  }, []);

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
            {loggedIn ? "Account" : "Sign Up"}
          </button>
        </nav>
      </header>

      <ErrorBoundary>
        {page === "upload" && <UploadPage onComplete={handleUploadComplete} />}
        {page === "dashboard" && result && <DashboardPage result={result} />}
        {page === "plans" && <PlansPage onSelectPlan={() => nav("account")} />}
        {page === "account" && <AccountPage onAuthChange={handleAuthChange} />}
      </ErrorBoundary>
    </>
  );
}
