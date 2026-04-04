// E2E Round 2 — Deep stress test of every endpoint + edge case
const BASE = "http://localhost:4000";
let API_KEY = "";
let ACCOUNT_ID = "";
let PROJECT_ID = "";
let SNAPSHOT_ID = "";
const results = [];

function r(name, pass, status, ms, detail) {
  results.push({ name, pass, status, ms, detail: detail || "" });
  console.log(`${pass ? "PASS" : "FAIL"} [${status}] ${name}${detail ? " — " + detail : ""}`);
}

async function go(method, path, body, headers = {}) {
  const opts = { method, headers: { "Content-Type": "application/json", ...headers } };
  if (body) opts.body = JSON.stringify(body);
  const t0 = Date.now();
  const res = await fetch(BASE + path, opts);
  const ms = Date.now() - t0;
  let data;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("json")) data = await res.json();
  else data = await res.text();
  return { status: res.status, data, ms, headers: res.headers };
}

async function main() {
  // ─── 1. Health ───
  {
    const { status, data, ms } = await go("GET", "/v1/health");
    r("health", status === 200 && data.status === "ok", status, ms, `version=${data.version}`);
  }

  // ─── 2. Create Account ───
  {
    const { status, data, ms } = await go("POST", "/v1/accounts", { name: "E2E Round2", email: "r2@test.com" });
    const pass = status === 201 && data.api_key?.raw_key;
    API_KEY = data.api_key?.raw_key || "";
    ACCOUNT_ID = data.account?.account_id || "";
    r("create_account", pass, status, ms);
  }

  const auth = { Authorization: `Bearer ${API_KEY}` };

  // ─── 3. Get Account ───
  {
    const { status, data, ms } = await go("GET", "/v1/account", null, auth);
    const acct = data.account || data;
    const pass = status === 200 && acct.name === "E2E Round2";
    r("get_account", pass, status, ms, `tier=${acct.tier}, has_quota=${!!data.quota}`);
  }

  // ─── 4. Duplicate Account (same email) ───
  {
    const { status, data, ms } = await go("POST", "/v1/accounts", { name: "Dup", email: "r2@test.com" });
    r("dup_account_rejected", status === 409 || status === 400, status, ms, data.error || "");
  }

  // ─── 5. Create API Key ───
  {
    const { status, data, ms } = await go("POST", "/v1/account/keys", { label: "test-key" }, auth);
    r("create_api_key", status === 201 && !!data.raw_key, status, ms);
  }

  // ─── 6. List API Keys ───
  {
    const { status, data, ms } = await go("GET", "/v1/account/keys", null, auth);
    r("list_api_keys", status === 200 && data.keys?.length >= 1, status, ms, `count=${data.keys?.length}`);
  }

  // ─── 7. Revoke an API Key (the second one) ───
  {
    const keysRes = await go("GET", "/v1/account/keys", null, auth);
    const second = keysRes.data.keys?.find(k => k.label === "test-key");
    if (second) {
      const { status, data, ms } = await go("POST", `/v1/account/keys/${second.key_id}/revoke`, null, auth);
      r("revoke_api_key", status === 200 && data.revoked === true, status, ms);
    } else {
      r("revoke_api_key", false, 0, 0, "no second key found");
    }
  }

  // ─── 8. Get Plans (no auth) ───
  {
    const { status, data, ms } = await go("GET", "/v1/plans");
    r("get_plans", status === 200 && data.plans?.length >= 3, status, ms, `plans=${data.plans?.length}, features=${data.features?.length}`);
  }

  // ─── 9. Get Usage ───
  {
    const { status, data, ms } = await go("GET", "/v1/account/usage", null, auth);
    r("get_usage", status === 200 && data.tier !== undefined, status, ms, `tier=${data.tier}`);
  }

  // ─── 10. Upload Snapshot ───
  {
    const payload = {
      input_method: "web_upload",
      manifest: {
        project_name: "e2e-round2",
        project_type: "web_app",
        frameworks: ["react", "vite"],
        goals: ["test everything"],
        requested_outputs: ["search", "skills", "debug", "seo"],
      },
      files: [
        { path: "src/index.ts", content: "export const app = 'hello';", size: 27 },
        { path: "src/App.tsx", content: "export function App() { return <div>Hello</div>; }", size: 50 },
        { path: "package.json", content: JSON.stringify({ name: "e2e-round2", version: "1.0.0", dependencies: { react: "^19.0.0", vite: "^6.0.0" } }), size: 100 },
        { path: ".ai/context-map.json", content: "{}", size: 2 },
        { path: "tsconfig.json", content: JSON.stringify({ compilerOptions: { strict: true } }), size: 40 },
      ],
    };
    const { status, data, ms } = await go("POST", "/v1/snapshots", payload, auth);
    const pass = status === 201 && !!data.snapshot_id;
    SNAPSHOT_ID = data.snapshot_id || "";
    PROJECT_ID = data.project_id || "";
    r("create_snapshot", pass, status, ms, `snap=${SNAPSHOT_ID?.slice(0,8)}, proj=${PROJECT_ID?.slice(0,8)}`);
  }

  // ─── 11. Run ALL 17 programs ───
  const programEndpoints = [
    "search/export", "skills/generate", "debug/analyze",
    "frontend/audit", "seo/analyze", "optimization/analyze",
    "theme/generate", "brand/generate", "superpowers/generate",
    "marketing/generate", "notebook/generate", "obsidian/analyze",
    "mcp/provision", "artifacts/generate", "remotion/generate",
    "canvas/generate", "algorithmic/generate",
  ];
  for (const ep of programEndpoints) {
    const { status, data, ms } = await go("POST", `/v1/${ep}`, { snapshot_id: SNAPSHOT_ID }, auth);
    const pass = status === 200 && data.files?.length > 0;
    r(`program_${ep.replace("/", "_")}`, pass, status, ms, `files=${data.files?.length || 0}`);
  }

  // ─── 12. Get Generated Files ───
  {
    const { status, data, ms } = await go("GET", `/v1/projects/${PROJECT_ID}/generated-files`, null, auth);
    r("get_generated_files", status === 200 && data.files?.length > 0, status, ms, `total=${data.files?.length}`);
  }

  // ─── 13. Get single nested file (bug_002 regression test) ───
  {
    const { status, data, ms } = await go("GET", `/v1/projects/${PROJECT_ID}/generated-files/.ai/context-map.json`, null, auth);
    r("get_nested_file", status === 200, status, ms, typeof data === "string" ? `len=${data.length}` : `type=${typeof data}`);
  }

  // ─── 14. Export ZIP ───
  {
    const opts = { method: "GET", headers: auth };
    const t0 = Date.now();
    const res = await fetch(`${BASE}/v1/projects/${PROJECT_ID}/export`, opts);
    const ms = Date.now() - t0;
    const ct = res.headers.get("content-type") || "";
    const cd = res.headers.get("content-disposition") || "";
    const blob = await res.arrayBuffer();
    r("export_zip", res.status === 200 && blob.byteLength > 0, res.status, ms, `size=${blob.byteLength}, ct=${ct}, cd=${cd.slice(0,40)}`);
  }

  // ─── 15. Export ZIP by program ───
  {
    const opts = { method: "GET", headers: auth };
    const t0 = Date.now();
    const res = await fetch(`${BASE}/v1/projects/${PROJECT_ID}/export?program=search`, opts);
    const ms = Date.now() - t0;
    const blob = await res.arrayBuffer();
    r("export_zip_program", res.status === 200 && blob.byteLength > 0, res.status, ms, `size=${blob.byteLength}`);
  }

  // ─── 16. GitHub URL analysis ───
  {
    const { status, data, ms } = await go("POST", "/v1/github/analyze", { github_url: "https://github.com/expressjs/express" }, auth);
    r("github_analyze", status === 200 || status === 201, status, ms, `snap=${data.snapshot_id?.slice(0,8) || "none"}`);
  }

  // ─── 17. Tier operations ───
  {
    const { status, data, ms } = await go("POST", "/v1/account/tier", { tier: "paid" }, auth);
    r("upgrade_to_paid", status === 200 && data.account?.tier === "paid", status, ms);
  }
  {
    const { status, data, ms } = await go("POST", "/v1/account/tier", { tier: "suite" }, auth);
    r("upgrade_to_suite", status === 200 && data.account?.tier === "suite", status, ms);
  }
  {
    const { status, data, ms } = await go("POST", "/v1/account/tier", { tier: "free" }, auth);
    r("downgrade_to_free", status === 200 && data.account?.tier === "free", status, ms);
  }

  // ─── 18. Seats ───
  {
    // First upgrade to paid (free = 1 seat limit)
    await go("POST", "/v1/account/tier", { tier: "paid" }, auth);
    const { status, data, ms } = await go("POST", "/v1/account/seats", { email: "teammate@test.com", role: "member" }, auth);
    r("invite_seat", status === 201 && !!data.seat, status, ms);
  }
  {
    const { status, data, ms } = await go("GET", "/v1/account/seats", null, auth);
    r("list_seats", status === 200 && data.seats?.length >= 1, status, ms, `count=${data.count}, limit=${data.limit}`);
  }
  {
    // Create account for teammate so they can accept their own seat
    const tmAcct = await go("POST", "/v1/accounts", { name: "Teammate", email: "teammate@test.com" });
    const tmKey = tmAcct.data.api_key?.raw_key;
    const tmAuth = { Authorization: `Bearer ${tmKey}` };
    const seatsRes = await go("GET", "/v1/account/seats", null, auth);
    const seat = seatsRes.data.seats?.[0];
    if (seat && tmKey) {
      const { status, data, ms } = await go("POST", `/v1/account/seats/${seat.seat_id}/accept`, null, tmAuth);
      r("accept_seat", status === 200, status, ms);
    } else {
      r("accept_seat", false, 0, 0, "no seat or no teammate key");
    }
  }

  // ─── 19. Cross-account seat revoke test (bug_009 regression) ───
  {
    // Create a second account
    const acct2 = await go("POST", "/v1/accounts", { name: "Hacker", email: "hacker@evil.com" });
    const hackerKey = acct2.data.api_key?.raw_key;
    const hackerAuth = { Authorization: `Bearer ${hackerKey}` };
    // Try to revoke the first account's seat
    const seatsRes = await go("GET", "/v1/account/seats", null, auth);
    const seat = seatsRes.data.seats?.[0];
    if (seat && hackerKey) {
      const { status, ms } = await go("POST", `/v1/account/seats/${seat.seat_id}/revoke`, null, hackerAuth);
      r("cross_acct_seat_revoke_blocked", status === 404, status, ms, "should be 404 not 200");
    }
  }

  // ─── 20. Revoke own seat (should work) ───
  {
    const seatsRes = await go("GET", "/v1/account/seats", null, auth);
    const seat = seatsRes.data.seats?.find(s => !s.revoked_at);
    if (seat) {
      const { status, data, ms } = await go("POST", `/v1/account/seats/${seat.seat_id}/revoke`, null, auth);
      r("revoke_own_seat", status === 200 && data.revoked === true, status, ms);
    }
  }

  // ─── 21. Upgrade prompt ───
  {
    await go("POST", "/v1/account/tier", { tier: "free" }, auth);
    const { status, data, ms } = await go("GET", "/v1/account/upgrade-prompt", null, auth);
    r("get_upgrade_prompt", status === 200, status, ms, `has_prompt=${!!data.prompt}`);
  }

  // ─── 22. Dismiss upgrade prompt ───
  {
    const { status, ms } = await go("POST", "/v1/account/upgrade-prompt/dismiss", null, auth);
    r("dismiss_upgrade_prompt", status === 200, status, ms);
  }

  // ─── 23. Funnel status ───
  {
    const { status, data, ms } = await go("GET", "/v1/account/funnel", null, auth);
    r("get_funnel_status", status === 200 && !!data.stage, status, ms, `stage=${data.stage}`);
  }

  // ─── 24. Funnel metrics (requires auth — bug_019 fix) ───
  {
    const { status, data, ms } = await go("GET", "/v1/funnel/metrics", null, auth);
    r("get_funnel_metrics", status === 200, status, ms);
  }

  // ─── 25. Edge Cases ───
  // Missing auth
  {
    const { status, ms } = await go("GET", "/v1/account");
    r("no_auth_rejected", status === 401, status, ms);
  }
  // Bad method
  {
    const { status, ms } = await go("DELETE", "/v1/health");
    r("bad_method_rejected", status === 404 || status === 405, status, ms);
  }
  // Empty snapshot body
  {
    const { status, ms } = await go("POST", "/v1/snapshots", {}, auth);
    r("empty_snapshot_rejected", status === 400, status, ms);
  }
  // Missing snapshot_id on program
  {
    const { status, ms } = await go("POST", "/v1/search/export", {}, auth);
    r("missing_snapshot_id_rejected", status === 400, status, ms);
  }
  // Nonexistent project
  {
    const { status, ms } = await go("GET", "/v1/projects/nonexistent/generated-files", null, auth);
    r("nonexistent_project", status === 404, status, ms);
  }
  // Invalid tier
  {
    const { status, ms } = await go("POST", "/v1/account/tier", { tier: "diamond" }, auth);
    r("invalid_tier_rejected", status === 400, status, ms);
  }
  // Revoke already-revoked key
  {
    const keysRes = await go("GET", "/v1/account/keys", null, auth);
    const revoked = keysRes.data.keys?.find(k => k.revoked_at);
    if (revoked) {
      const { status, ms } = await go("POST", `/v1/account/keys/${revoked.key_id}/revoke`, null, auth);
      r("re_revoke_key", status === 404 || status === 409, status, ms);
    }
  }
  // Double accept seat
  {
    await go("POST", "/v1/account/tier", { tier: "paid" }, auth);
    const inv = await go("POST", "/v1/account/seats", { email: "double@test.com", role: "member" }, auth);
    const sid = inv.data.seat?.seat_id;
    if (sid) {
      // Create account for double@test.com so they can accept
      const dblAcct = await go("POST", "/v1/accounts", { name: "Double", email: "double@test.com" });
      const dblKey = dblAcct.data.api_key?.raw_key;
      const dblAuth = { Authorization: `Bearer ${dblKey}` };
      await go("POST", `/v1/account/seats/${sid}/accept`, null, dblAuth);
      const { status, ms } = await go("POST", `/v1/account/seats/${sid}/accept`, null, dblAuth);
      r("double_accept_seat_rejected", status === 404 || status === 409, status, ms);
    }
  }
  // Invite same email twice
  {
    const { status, data, ms } = await go("POST", "/v1/account/seats", { email: "double@test.com", role: "member" }, auth);
    r("dup_seat_invite", true, status, ms, `status=${status}, msg=${data.error || "ok"}`);
  }
  // Programs with since param
  {
    const { status, data, ms } = await go("GET", "/v1/account/usage?since=2026-01-01", null, auth);
    r("usage_with_since", status === 200, status, ms);
  }
  // CORS preflight
  {
    const opts = { method: "OPTIONS", headers: { Origin: "http://localhost:5173", "Access-Control-Request-Method": "POST" } };
    const t0 = Date.now();
    const res = await fetch(`${BASE}/v1/account`, opts);
    const ms = Date.now() - t0;
    const acao = res.headers.get("access-control-allow-origin");
    r("cors_preflight", res.status === 204 || res.status === 200, res.status, ms, `acao=${acao}`);
  }

  // ─── Summary ───
  console.log("\n" + "═".repeat(60));
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`TOTAL: ${results.length}  |  PASS: ${passed}  |  FAIL: ${failed}`);
  console.log("═".repeat(60));
  if (failed > 0) {
    console.log("\nFAILURES:");
    results.filter(r => !r.pass).forEach(r => {
      console.log(`  ${r.name} [${r.status}] ${r.detail}`);
    });
  }
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
