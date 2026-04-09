import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createHmac } from "node:crypto";
import type { Server } from "node:http";
import { openMemoryDb, closeDb } from "@axis/snapshots";
import { Router, createApp } from "./router.js";
import { handleCreateAccount } from "./billing.js";
import { handleLemonSqueezyWebhook, handleGetSubscription } from "./lemonsqueezy.js";
import { resetRateLimits } from "./rate-limiter.js";

const TEST_PORT = 44500;
let server: Server;
const WEBHOOK_SECRET = "test_webhook_secret_123";

// ─── HTTP helper ────────────────────────────────────────────────

interface Res { status: number; headers: Record<string, string>; data: Record<string, unknown> }

async function req(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<Res> {
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
          const h: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.headers)) {
            if (typeof v === "string") h[k] = v;
          }
          resolve({ status: res.statusCode ?? 0, headers: h, data: data as Record<string, unknown> });
        });
      },
    );
    r.on("error", reject);
    if (payload) r.write(payload);
    r.end();
  });
}

function signPayload(payload: string): string {
  return createHmac("sha256", WEBHOOK_SECRET).update(payload).digest("hex");
}

// ─── Server setup ───────────────────────────────────────────────

beforeAll(async () => {
  openMemoryDb();
  resetRateLimits();
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.LEMONSQUEEZY_VARIANT_ID_PAID = "variant_paid_123";
  process.env.LEMONSQUEEZY_VARIANT_ID_SUITE = "variant_suite_456";

  const router = new Router();
  router.post("/v1/accounts", handleCreateAccount);
  router.post("/v1/webhooks/lemonsqueezy", handleLemonSqueezyWebhook);
  router.get("/v1/account/subscription", handleGetSubscription);
  server = createApp(router, TEST_PORT);
  await new Promise<void>((r) => setTimeout(r, 100));
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  closeDb();
  delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  delete process.env.LEMONSQUEEZY_VARIANT_ID_PAID;
  delete process.env.LEMONSQUEEZY_VARIANT_ID_SUITE;
});

beforeEach(() => {
  resetRateLimits();
});

// ─── Helpers ────────────────────────────────────────────────────

async function createTestAccount(name?: string, email?: string) {
  const n = name ?? `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const e = email ?? `${n}@test.com`;
  const r = await req("POST", "/v1/accounts", { name: n, email: e });
  return {
    account: r.data.account as Record<string, unknown>,
    rawKey: r.data.api_key as Record<string, unknown>,
    key: (r.data.api_key as Record<string, unknown>).raw_key as string,
  };
}

function buildWebhookPayload(eventName: string, accountId: string, overrides: Record<string, unknown> = {}) {
  const subId = overrides.sub_id ?? `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  delete overrides.sub_id;
  return {
    meta: {
      event_name: eventName,
      custom_data: { account_id: accountId },
    },
    data: {
      id: subId,
      attributes: {
        status: "active",
        variant_id: 123,
        product_id: 456,
        customer_id: 789,
        current_period_start: "2025-01-01T00:00:00Z",
        current_period_end: "2025-02-01T00:00:00Z",
        card_brand: "visa",
        card_last_four: "4242",
        cancelled: false,
        ends_at: null,
        ...overrides,
      },
    },
  };
}

// ─── Webhook tests ──────────────────────────────────────────────

describe("Lemon Squeezy webhook", () => {
  it("rejects requests without signature", async () => {
    const payload = JSON.stringify(buildWebhookPayload("subscription_created", "acct_test"));
    const r = await req("POST", "/v1/webhooks/lemonsqueezy", payload);
    expect(r.status).toBe(401);
  });

  it("rejects requests with invalid signature", async () => {
    const payload = JSON.stringify(buildWebhookPayload("subscription_created", "acct_test"));
    const r = await req("POST", "/v1/webhooks/lemonsqueezy", payload, {
      "x-signature": "bad_signature_hex",
    });
    expect(r.status).toBe(401);
  });

  it("accepts valid webhook and creates subscription", async () => {
    const { account } = await createTestAccount("webhook-test", "webhook@test.com");
    const accountId = account.account_id as string;
    const payload = JSON.stringify(buildWebhookPayload("subscription_created", accountId, {
      variant_id: "variant_paid_123",
    }));
    const sig = signPayload(payload);

    const r = await req("POST", "/v1/webhooks/lemonsqueezy", payload, {
      "x-signature": sig,
    });

    expect(r.status).toBe(200);
    expect(r.data.handled).toBe(true);
    expect(r.data.event).toBe("subscription_created");
    expect(r.data.subscription_id).toBeTruthy();
  });

  it("acknowledges unhandled events with 200", async () => {
    const payload = JSON.stringify({
      meta: { event_name: "order_created" },
      data: { id: "123", attributes: {} },
    });
    const sig = signPayload(payload);

    const r = await req("POST", "/v1/webhooks/lemonsqueezy", payload, {
      "x-signature": sig,
    });

    expect(r.status).toBe(200);
    expect(r.data.handled).toBe(false);
  });

  it("rejects webhook with no account_id and no existing subscription", async () => {
    const payload = JSON.stringify({
      meta: { event_name: "subscription_updated" },
      data: {
        id: "sub_nonexistent",
        attributes: {
          status: "active",
          variant_id: 123,
          product_id: 456,
          customer_id: 789,
          current_period_start: null,
          current_period_end: null,
          card_brand: null,
          card_last_four: null,
          cancelled: false,
          ends_at: null,
        },
      },
    });
    const sig = signPayload(payload);

    const r = await req("POST", "/v1/webhooks/lemonsqueezy", payload, {
      "x-signature": sig,
    });

    expect(r.status).toBe(400);
  });
});

// ─── Subscription status endpoint ───────────────────────────────

describe("GET /v1/account/subscription", () => {
  it("requires authentication", async () => {
    const r = await req("GET", "/v1/account/subscription");
    expect(r.status).toBe(401);
  });

  it("returns subscription info after webhook creates one", async () => {
    const { account, key } = await createTestAccount("sub-status-test", "substatus@test.com");
    const accountId = account.account_id as string;

    // Fire webhook to create subscription
    const payload = JSON.stringify(buildWebhookPayload("subscription_created", accountId, {
      variant_id: "variant_paid_123",
    }));
    const sig = signPayload(payload);
    await req("POST", "/v1/webhooks/lemonsqueezy", payload, { "x-signature": sig });

    // Check subscription status
    const r = await req("GET", "/v1/account/subscription", undefined, {
      "Authorization": `Bearer ${key}`,
    });

    expect(r.status).toBe(200);
    expect(r.data.has_active_subscription).toBe(true);
    expect((r.data.active_subscription as Record<string, unknown>).subscription_id).toBeTruthy();
  });

  it("returns null active_subscription when none exists", async () => {
    const { key } = await createTestAccount("no-sub-test", "nosub@test.com");

    const r = await req("GET", "/v1/account/subscription", undefined, {
      "Authorization": `Bearer ${key}`,
    });

    expect(r.status).toBe(200);
    expect(r.data.has_active_subscription).toBe(false);
    expect(r.data.active_subscription).toBeNull();
  });
});
