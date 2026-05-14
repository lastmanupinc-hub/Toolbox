import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";
import { createHmac } from "node:crypto";
import type { Server } from "node:http";
import { openMemoryDb, closeDb, getAccountByEmail } from "@axis/snapshots";
import { Router, createApp } from "./router.js";
import { handleCreateAccount } from "./billing.js";
import { handlePaidSubscribe, handlePaidWebhook } from "./paid-handlers.js";
import { resetRateLimits } from "./rate-limiter.js";

const TEST_PORT = 44600;
const SIGNING_KEY = "whsec_paid_test";
let server: Server;

interface Res { status: number; data: Record<string, unknown> }

async function req(method: string, path: string, body?: unknown, headers?: Record<string, string>): Promise<Res> {
  return new Promise((resolve, reject) => {
    const payload = body ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined;
    const hdrs: Record<string, string> = { "Content-Type": "application/json", ...headers };
    const r = require("node:http").request(
      { hostname: "127.0.0.1", port: TEST_PORT, path, method, headers: hdrs },
      (res: import("node:http").IncomingMessage) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf-8");
          let data: unknown;
          try { data = JSON.parse(raw); } catch { data = raw; }
          resolve({ status: res.statusCode ?? 0, data: data as Record<string, unknown> });
        });
      },
    );
    r.on("error", reject);
    if (payload) r.write(payload);
    r.end();
  });
}

function signPaid(payload: string, ts: number = Math.floor(Date.now() / 1000)): string {
  const hex = createHmac("sha256", SIGNING_KEY).update(`${ts}.${payload}`).digest("hex");
  return `t=${ts},v1=${hex}`;
}

beforeAll(async () => {
  openMemoryDb();
  resetRateLimits();
  process.env.PAID_API_KEY = "sk_live_test";
  process.env.PAID_MERCHANT_ID = "acct_test";
  process.env.PAID_API_BASE_URL = "https://paid.test/v1";
  process.env.PAID_PLAN_PRO_MONTHLY = "plan_m";
  process.env.PAID_PLAN_PRO_ANNUAL = "plan_a";
  process.env.PAID_WEBHOOK_SIGNING_KEY = SIGNING_KEY;

  const router = new Router();
  router.post("/v1/accounts", handleCreateAccount);
  router.post("/portal/api/subscribe", handlePaidSubscribe);
  router.post("/portal/api/paid/webhook", handlePaidWebhook);
  server = createApp(router, TEST_PORT);
  await new Promise<void>((r) => setTimeout(r, 100));
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  closeDb();
  delete process.env.PAID_API_KEY;
  delete process.env.PAID_MERCHANT_ID;
  delete process.env.PAID_API_BASE_URL;
  delete process.env.PAID_PLAN_PRO_MONTHLY;
  delete process.env.PAID_PLAN_PRO_ANNUAL;
  delete process.env.PAID_WEBHOOK_SIGNING_KEY;
});

beforeEach(() => {
  resetRateLimits();
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function createAccount(email: string) {
  const name = email.split("@")[0];
  const r = await req("POST", "/v1/accounts", { name, email });
  return r.data.account as Record<string, unknown>;
}

// ─── POST /portal/api/subscribe ─────────────────────────────────

describe("POST /portal/api/subscribe", () => {
  it("rejects invalid plan", async () => {
    const r = await req("POST", "/portal/api/subscribe", { plan: "weekly", email: "a@b.com" });
    expect(r.status).toBe(400);
  });

  it("rejects missing email", async () => {
    const r = await req("POST", "/portal/api/subscribe", { plan: "monthly" });
    expect(r.status).toBe(400);
  });

  it("returns 404 when account does not exist", async () => {
    const r = await req("POST", "/portal/api/subscribe", { plan: "monthly", email: "missing@test.com" });
    expect(r.status).toBe(404);
  });

  it("creates subscription on happy path", async () => {
    await createAccount("subscribe-ok@test.com");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ subscription_id: "sub_ok", client_secret: "cs_ok", status: "incomplete" }), { status: 200 }),
    );
    const r = await req("POST", "/portal/api/subscribe", { plan: "monthly", email: "subscribe-ok@test.com" });
    expect(r.status).toBe(200);
    expect(r.data.subscription_id).toBe("sub_ok");
    expect(r.data.client_secret).toBe("cs_ok");
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it("returns 502 when PAID rejects", async () => {
    await createAccount("subscribe-fail@test.com");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("denied", { status: 402 }));
    const r = await req("POST", "/portal/api/subscribe", { plan: "annual", email: "subscribe-fail@test.com" });
    expect(r.status).toBe(502);
  });
});

// ─── POST /portal/api/paid/webhook ──────────────────────────────

describe("POST /portal/api/paid/webhook", () => {
  it("rejects requests without signature", async () => {
    const body = JSON.stringify({ type: "subscription.created", data: { object: {} } });
    const r = await req("POST", "/portal/api/paid/webhook", body);
    expect(r.status).toBe(401);
  });

  it("rejects bad signature", async () => {
    const body = JSON.stringify({ type: "subscription.created", data: { object: {} } });
    const r = await req("POST", "/portal/api/paid/webhook", body, { "paid-signature": "t=1,v1=badhex" });
    expect(r.status).toBe(401);
  });

  it("returns 200 + handled:false on unknown event", async () => {
    const body = JSON.stringify({ type: "something.weird", data: { object: {} } });
    const r = await req("POST", "/portal/api/paid/webhook", body, { "paid-signature": signPaid(body) });
    expect(r.status).toBe(200);
    expect(r.data.handled).toBe(false);
  });

  it("upgrades account to paid on subscription.created", async () => {
    await createAccount("upgrade@test.com");
    const body = JSON.stringify({
      type: "subscription.created",
      data: { object: { customer_email: "upgrade@test.com", id: "sub_up" } },
    });
    const r = await req("POST", "/portal/api/paid/webhook", body, { "paid-signature": signPaid(body) });
    expect(r.status).toBe(200);
    expect(r.data.tier_change).toBe(true);
    const acct = getAccountByEmail("upgrade@test.com");
    expect(acct?.tier).toBe("paid");
  });

  it("downgrades account to free on subscription.canceled", async () => {
    await createAccount("downgrade@test.com");
    // First upgrade
    const upBody = JSON.stringify({
      type: "subscription.created",
      data: { object: { customer_email: "downgrade@test.com", id: "sub_dn" } },
    });
    await req("POST", "/portal/api/paid/webhook", upBody, { "paid-signature": signPaid(upBody) });
    expect(getAccountByEmail("downgrade@test.com")?.tier).toBe("paid");

    const cancelBody = JSON.stringify({
      type: "subscription.canceled",
      data: { object: { customer_email: "downgrade@test.com", id: "sub_dn" } },
    });
    const r = await req("POST", "/portal/api/paid/webhook", cancelBody, { "paid-signature": signPaid(cancelBody) });
    expect(r.status).toBe(200);
    expect(r.data.tier_change).toBe(true);
    expect(getAccountByEmail("downgrade@test.com")?.tier).toBe("free");
  });

  it("no-op when event known but account already on target tier", async () => {
    await createAccount("noop@test.com");
    const body = JSON.stringify({
      type: "subscription.canceled",
      data: { object: { customer_email: "noop@test.com", id: "sub_noop" } },
    });
    const r = await req("POST", "/portal/api/paid/webhook", body, { "paid-signature": signPaid(body) });
    expect(r.status).toBe(200);
    expect(r.data.tier_change).toBe(false);
  });

  it("reports no_account when email unknown", async () => {
    const body = JSON.stringify({
      type: "subscription.created",
      data: { object: { customer_email: "ghost@test.com", id: "sub_g" } },
    });
    const r = await req("POST", "/portal/api/paid/webhook", body, { "paid-signature": signPaid(body) });
    expect(r.status).toBe(200);
    expect(r.data.handled).toBe(false);
    expect(r.data.reason).toBe("no_account");
  });
});
