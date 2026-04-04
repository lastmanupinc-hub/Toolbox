import { useState, useEffect, useCallback, type FormEvent } from "react";
import {
  createAccount,
  getAccount,
  createApiKey,
  listApiKeys,
  revokeApiKey,
  getUsage,
  type Account,
  type ApiKeyInfo,
  type UsageSummary,
  type BillingTier,
} from "../api.ts";

export function AccountPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [usage, setUsage] = useState<{ tier: BillingTier; monthly_snapshots: number; project_count: number; by_program: UsageSummary[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Registration form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  const isLoggedIn = !!localStorage.getItem("axis_api_key");

  const loadAccount = useCallback(async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    try {
      const [acct, keysData, usageData] = await Promise.all([
        getAccount(),
        listApiKeys(),
        getUsage(),
      ]);
      setAccount(acct);
      setKeys(keysData.keys);
      setUsage(usageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load account");
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const result = await createAccount(name.trim(), email.trim());
      localStorage.setItem("axis_api_key", result.api_key.raw_key);
      setRevealedKey(result.api_key.raw_key);
      setAccount(result.account);
      setLoading(true);
      await loadAccount();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    }
  }

  async function handleCreateKey(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const result = await createApiKey(newKeyLabel.trim() || "default");
      setRevealedKey(result.raw_key);
      setNewKeyLabel("");
      const keysData = await listApiKeys();
      setKeys(keysData.keys);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create key");
    }
  }

  async function handleRevoke(keyId: string) {
    try {
      await revokeApiKey(keyId);
      const keysData = await listApiKeys();
      setKeys(keysData.keys);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke key");
    }
  }

  function handleLogout() {
    localStorage.removeItem("axis_api_key");
    setAccount(null);
    setKeys([]);
    setUsage(null);
    setRevealedKey(null);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="empty-state">
        <span className="spinner" /> Loading account...
      </div>
    );
  }

  // Not logged in — show registration form
  if (!isLoggedIn && !account) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div className="card">
          <h2 style={{ marginBottom: 4 }}>Create Your Account</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: 16 }}>
            Start with the Free plan — no credit card required. Get 10 snapshots/month, 3 programs, and full API access.
          </p>

          <form onSubmit={handleSignUp}>
            <div style={{ marginBottom: 12 }}>
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" required />
            </div>
            {error && (
              <div style={{ color: "var(--red)", fontSize: "0.875rem", marginBottom: 12 }}>{error}</div>
            )}
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Create Free Account
            </button>
          </form>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 8 }}>Already have an API key?</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", marginBottom: 12 }}>
            Paste your API key to connect this browser session.
          </p>
          <div className="flex" style={{ gap: 8 }}>
            <input
              placeholder="axis_..."
              style={{ flex: 1 }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val.startsWith("axis_")) {
                    localStorage.setItem("axis_api_key", val);
                    window.location.reload();
                  }
                }
              }}
            />
            <button
              className="btn"
              onClick={() => {
                const input = document.querySelector<HTMLInputElement>("input[placeholder='axis_...']");
                const val = input?.value.trim() ?? "";
                if (val.startsWith("axis_")) {
                  localStorage.setItem("axis_api_key", val);
                  window.location.reload();
                }
              }}
            >
              Connect
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tierLabels: Record<BillingTier, string> = { free: "Free", paid: "Pro", suite: "Enterprise Suite" };
  const tierColors: Record<BillingTier, string> = { free: "badge-green", paid: "badge-accent", suite: "badge-yellow" };

  return (
    <div>
      {/* Account Info */}
      <div className="card">
        <div className="flex-between">
          <div>
            <h2>{account?.name ?? "Account"}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{account?.email}</p>
          </div>
          <div className="flex" style={{ gap: 8 }}>
            <span className={`badge ${tierColors[account?.tier ?? "free"]}`}>
              {tierLabels[account?.tier ?? "free"]}
            </span>
            <button className="btn" onClick={handleLogout} style={{ fontSize: "0.8125rem" }}>
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Revealed key banner */}
      {revealedKey && (
        <div className="card" style={{ borderColor: "var(--yellow)", marginTop: 0 }}>
          <div className="flex-between">
            <div>
              <h3 style={{ color: "var(--yellow)" }}>Save your API key — it won't be shown again</h3>
              <code className="mono" style={{ fontSize: "0.875rem", wordBreak: "break-all" }}>
                {revealedKey}
              </code>
            </div>
            <button
              className="btn"
              onClick={() => {
                navigator.clipboard.writeText(revealedKey);
              }}
            >
              📋 Copy
            </button>
          </div>
        </div>
      )}

      {/* Usage Overview */}
      {usage && (
        <div className="grid grid-4" style={{ marginTop: 0 }}>
          <div className="card" style={{ textAlign: "center" }}>
            <div className="stat-value">{usage.monthly_snapshots}</div>
            <div className="stat-label">Snapshots This Month</div>
            <div className="progress-bar" style={{ marginTop: 8 }}>
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, (usage.monthly_snapshots / (account?.tier === "free" ? 10 : account?.tier === "paid" ? 200 : 999)) * 100)}%`,
                  background: "var(--accent)",
                }}
              />
            </div>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <div className="stat-value">{usage.project_count}</div>
            <div className="stat-label">Active Projects</div>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <div className="stat-value">{usage.by_program.length}</div>
            <div className="stat-label">Programs Used</div>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <div className="stat-value">
              {usage.by_program.reduce((s, p) => s + p.total_generators, 0)}
            </div>
            <div className="stat-label">Files Generated</div>
          </div>
        </div>
      )}

      {/* Per-program usage */}
      {usage && usage.by_program.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Program Usage</h3>
          <table>
            <thead>
              <tr>
                <th>Program</th>
                <th style={{ textAlign: "right" }}>Runs</th>
                <th style={{ textAlign: "right" }}>Generators</th>
                <th style={{ textAlign: "right" }}>Input Files</th>
              </tr>
            </thead>
            <tbody>
              {usage.by_program.map((p) => (
                <tr key={p.program}>
                  <td><span className="badge">{p.program}</span></td>
                  <td style={{ textAlign: "right" }}>{p.total_runs}</td>
                  <td style={{ textAlign: "right" }}>{p.total_generators}</td>
                  <td style={{ textAlign: "right" }}>{p.total_input_files}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* API Keys */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: 12 }}>
          <h3>API Keys</h3>
          <form onSubmit={handleCreateKey} className="flex" style={{ gap: 8 }}>
            <input
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
              placeholder="Key label (optional)"
              style={{ width: 200 }}
            />
            <button type="submit" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
              + New Key
            </button>
          </form>
        </div>
        {keys.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No API keys yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Label</th>
                <th>Prefix</th>
                <th>Created</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.key_id}>
                  <td>{k.label}</td>
                  <td className="mono">{k.prefix}...</td>
                  <td>{new Date(k.created_at).toLocaleDateString()}</td>
                  <td>
                    {k.revoked_at ? (
                      <span className="badge badge-red">Revoked</span>
                    ) : (
                      <span className="badge badge-green">Active</span>
                    )}
                  </td>
                  <td>
                    {!k.revoked_at && (
                      <button
                        className="btn"
                        style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                        onClick={() => handleRevoke(k.key_id)}
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {error && (
        <div className="card" style={{ borderColor: "var(--red)" }}>
          <p style={{ color: "var(--red)" }}>{error}</p>
        </div>
      )}
    </div>
  );
}
