/**
 * eq_171: Lemon Squeezy handler branch coverage — targets uncovered lines
 * in lemonsqueezy.ts (handleCreateCheckout, handleCancelSubscription,
 * syncTierFromSubscription, verifyWebhookSignature edge cases).
 * Uses vi.stubGlobal('fetch') to mock LS API responses.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import type { Server } from "node:http";
import {
  openMemoryDb,
  closeDb,
  createAccount,
  createApiKey,
  upsertSubscription,
  getAccount,
  getSubscription,
  setEmailProvider,
  type EmailMessage,
} from "@axis/snapshots";
import { Router, createApp } from "./router.js";
import { handleCreateAccount } from "./billing.js";
import {
  handleLemonSqueezyWebhook,
  handleCreateCheckout,
  handleGetSubscription,
  handleCancelSubscription,
} from "./lemonsqueezy.js";
import { resetRateLimits } from "./rate-limiter.js";

const TEST_PORT = 44503;
let server: Server;
const WEBHOOK_SECRET = "test_webhook_secret_eq171";

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
  process.env.LEMONSQUEEZY_VARIANT_ID_PAID = "variant_paid_171";
  process.env.LEMONSQUEEZY_VARIANT_ID_SUITE = "variant_suite_171";
  process.env.LEMONSQUEEZY_API_KEY = "test_ls_api_key_171";
  process.env.LEMONSQUEEZY_STORE_ID = "store_171";

  const router = new Router();
  router.post("/v1/accounts", handleCreateAccount);
  router.post("/v1/webhooks/lemonsqueezy", handleLemonSqueezyWebhook);
  router.post("/v1/checkout", handleCreateCheckout);
  router.get("/v1/account/subscription", handleGetSubscription);
  router.post("/v1/account/subscription/cancel", handleCancelSubscription);
  server = createApp(router, TEST_PORT);
  await new Promise<void>((r) => setTimeout(r, 100));
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  closeDb();
  delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  delete process.env.LEMONSQUEEZY_VARIANT_ID_PAID;
  delete process.env.LEMONSQUEEZY_VARIANT_ID_SUITE;
  delete process.env.LEMONSQUEEZY_API_KEY;
  delete process.env.LEMONSQUEEZY_STORE_ID;
});

beforeEach(() => {
  resetRateLimits();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Helpers ────────────────────────────────────────────────────

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
        variant_id: "variant_paid_171",
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

// ─── 1. handleCreateCheckout — all branches ─────────────────────

describe("handleCreateCheckout branches", () => {
  it("returns 201 with checkout_url on successful LS API call", async () => {
    const account = createAccount("Checkout OK", "checkout-ok-171@test.com", "free");
    const { rawKey } = createApiKey(account.account_id, "test");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { attributes: { url: "https://checkout.lemonsqueezy.com/test-url" } },
      }),
    }));

    const r = await req("POST", "/v1/checkout",
      { tier: "paid" },
      { Authorization: `Bearer ${rawKey}` },
    );

    expect(r.status).toBe(201);
    expect(r.data.checkout_url).toBe("https://checkout.lemonsqueezy.com/test-url");
    expect(r.data.tier).toBe("paid");
    expect(r.data.variant_id).toBe("variant_paid_171");
  });

  it("returns 201 for suite tier checkout", async () => {
    const account = createAccount("Suite Checkout", "suite-checkout-171@test.com", "free");
    const { rawKey } = createApiKey(account.account_id, "test");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { attributes: { url: "https://checkout.lemonsqueezy.com/suite-url" } },
      }),
    }));

    const r = await req("POST", "/v1/checkout",
      { tier: "suite" },
      { Authorization: `Bearer ${rawKey}` },
    );

    expect(r.status).toBe(201);
    expect(r.data.checkout_url).toBe("https://checkout.lemonsqueezy.com/suite-url");
    expect(r.data.variant_id).toBe("variant_suite_171");
  });

  it("returns 502 when LS API returns non-ok response", async () => {
    const account = createAccount("Checkout Fail", "checkout-fail-171@test.com", "free");
    const { rawKey } = createApiKey(account.account_id, "test");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 422,
      text: async () => "Unprocessable Entity",
    }));

    const r = await req("POST", "/v1/checkout",
      { tier: "paid" },
      { Authorization: `Bearer ${rawKey}` },
    );

    expect(r.status).toBe(502);
    expect(r.data.error).toContain("Lemon Squeezy API error");
  });

  it("returns 502 when fetch throws network error", async () => {
    const account = createAccount("Checkout Net Err", "checkout-neterr-171@test.com", "free");
    const { rawKey } = createApiKey(account.account_id, "test");

    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")));

    const r = await req("POST", "/v1/checkout",
      { tier: "paid" },
      { Authorization: `Bearer ${rawKey}` },
    );

    expect(r.status).toBe(502);
    expect(r.data.error).toContain("Failed to create checkout");
    expect(r.data.error).toContain("ECONNREFUSED");
  });

  it("returns 409 when account already has active subscription", async () => {
    const account = createAccount("Conflict Sub", "conflict-sub-171@test.com", "paid");
    const { rawKey } = createApiKey(account.account_id, "test");

    // Seed an active subscription
    upsertSubscription({
      subscription_id: "sub_conflict_171",
      customer_id: "cust_1",
      account_id: account.account_id,
      variant_id: "variant_paid_171",
      product_id: "prod_1",
      status: "active",
      current_period_start: "2025-01-01T00:00:00Z",
      current_period_end: "2025-02-01T00:00:00Z",
      card_brand: "visa",
      card_last_four: "4242",
      cancel_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const r = await req("POST", "/v1/checkout",
      { tier: "paid" },
      { Authorization: `Bearer ${rawKey}` },
    );

    expect(r.status).toBe(409);
    expect(r.data.error).toContain("already has an active subscription");
  });

  it("returns 503 when variant ID not configured for tier", async () => {
    const account = createAccount("No Variant", "no-variant-171@test.com", "free");
    const { rawKey } = createApiKey(account.account_id, "test");

    const savedPaid = process.env.LEMONSQUEEZY_VARIANT_ID_PAID;
    delete process.env.LEMONSQUEEZY_VARIANT_ID_PAID;

    const r = await req("POST", "/v1/checkout",
      { tier: "paid" },
      { Authorization: `Bearer ${rawKey}` },
    );

    expect(r.status).toBe(503);
    expect(r.data.error).toContain("No variant ID configured");

    process.env.LEMONSQUEEZY_VARIANT_ID_PAID = savedPaid;
  });

  it("returns 400 on invalid JSON body", async () => {
    const account = createAccount("Bad JSON Checkout", "badjson-checkout-171@test.com", "free");
    const { rawKey } = createApiKey(account.account_id, "test");

    const r = await req("POST", "/v1/checkout",
      "not-json{{{",
      { Authorization: `Bearer ${rawKey}` },
    );

    expect(r.status).toBe(400);
  });
});

// ─── 2. handleCancelSubscription — all branches ────────────────

describe("handleCancelSubscription branches", () => {
  it("successfully cancels subscription via LS API", async () => {
    const account = createAccount("Cancel OK", "cancel-ok-171@test.com", "paid");
    const { rawKey } = createApiKey(account.account_id, "test");

    upsertSubscription({
      subscription_id: "sub_cancel_ok_171",
      customer_id: "cust_1",
      account_id: account.account_id,
      variant_id: "variant_paid_171",
      product_id: "prod_1",
      status: "active",
      current_period_start: "2025-01-01T00:00:00Z",
      current_period_end: "2025-02-01T00:00:00Z",
      card_brand: "visa",
      card_last_four: "4242",
      cancel_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: true }));

    const r = await req("POST", "/v1/account/subscription/cancel", undefined, {
      Authorization: `Bearer ${rawKey}`,
    });

    expect(r.status).toBe(200);
    expect(r.data.subscription_id).toBe("sub_cancel_ok_171");
    expect(r.data.status).toBe("cancellation_requested");
    expect(r.data.message).toContain("end of the current billing period");
  });

  it("returns 502 when LS API returns non-ok for cancel", async () => {
    const account = createAccount("Cancel Fail", "cancel-fail-171@test.com", "paid");
    const { rawKey } = createApiKey(account.account_id, "test");

    upsertSubscription({
      subscription_id: "sub_cancel_fail_171",
      customer_id: "cust_1",
      account_id: account.account_id,
      variant_id: "variant_paid_171",
      product_id: "prod_1",
      status: "active",
      current_period_start: "2025-01-01T00:00:00Z",
      current_period_end: "2025-02-01T00:00:00Z",
      card_brand: null,
      card_last_four: null,
      cancel_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
    }));

    const r = await req("POST", "/v1/account/subscription/cancel", undefined, {
      Authorization: `Bearer ${rawKey}`,
    });

    expect(r.status).toBe(502);
    expect(r.data.error).toContain("Lemon Squeezy API error");
  });

  it("returns 502 when cancel fetch throws network error", async () => {
    const account = createAccount("Cancel Net", "cancel-net-171@test.com", "paid");
    const { rawKey } = createApiKey(account.account_id, "test");

    upsertSubscription({
      subscription_id: "sub_cancel_net_171",
      customer_id: "cust_1",
      account_id: account.account_id,
      variant_id: "variant_paid_171",
      product_id: "prod_1",
      status: "active",
      current_period_start: "2025-01-01T00:00:00Z",
      current_period_end: "2025-02-01T00:00:00Z",
      card_brand: null,
      card_last_four: null,
      cancel_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("Connection timeout")));

    const r = await req("POST", "/v1/account/subscription/cancel", undefined, {
      Authorization: `Bearer ${rawKey}`,
    });

    expect(r.status).toBe(502);
    expect(r.data.error).toContain("Failed to cancel subscription");
    expect(r.data.error).toContain("Connection timeout");
  });

  it("returns 503 when LS API key not configured for cancel", async () => {
    const account = createAccount("Cancel No Key", "cancel-nokey-171@test.com", "paid");
    const { rawKey } = createApiKey(account.account_id, "test");

    upsertSubscription({
      subscription_id: "sub_cancel_nokey_171",
      customer_id: "cust_1",
      account_id: account.account_id,
      variant_id: "variant_paid_171",
      product_id: "prod_1",
      status: "active",
      current_period_start: "2025-01-01T00:00:00Z",
      current_period_end: "2025-02-01T00:00:00Z",
      card_brand: null,
      card_last_four: null,
      cancel_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const savedKey = process.env.LEMONSQUEEZY_API_KEY;
    delete process.env.LEMONSQUEEZY_API_KEY;

    const r = await req("POST", "/v1/account/subscription/cancel", undefined, {
      Authorization: `Bearer ${rawKey}`,
    });

    expect(r.status).toBe(503);
    expect(r.data.error).toContain("not configured");

    process.env.LEMONSQUEEZY_API_KEY = savedKey;
  });
});

// ─── 3. syncTierFromSubscription branches ───────────────────────

describe("syncTierFromSubscription via webhook", () => {
  it("downgrades to free on subscription cancellation", async () => {
    const account = createAccount("Downgrade Cancel", "downgrade-cancel-171@test.com", "paid");

    // First create the subscription
    const createPayload = JSON.stringify(buildWebhookPayload("subscription_created", account.account_id, {
      sub_id: "sub_downgrade_cancel_171",
    }));
    await req("POST", "/v1/webhooks/lemonsqueezy", createPayload, {
      "x-signature": signPayload(createPayload),
    });

    // Now cancel it
    const cancelPayload = JSON.stringify(buildWebhookPayload("subscription_cancelled", account.account_id, {
      sub_id: "sub_downgrade_cancel_171",
      status: "cancelled",
    }));
    const r = await req("POST", "/v1/webhooks/lemonsqueezy", cancelPayload, {
      "x-signature": signPayload(cancelPayload),
    });

    expect(r.status).toBe(200);
    expect(r.data.handled).toBe(true);

    const updated = getAccount(account.account_id);
    expect(updated!.tier).toBe("free");
  });

  it("downgrades to free on subscription expiry", async () => {
    const account = createAccount("Downgrade Expire", "downgrade-expire-171@test.com", "paid");

    const payload = JSON.stringify(buildWebhookPayload("subscription_expired", account.account_id, {
      sub_id: "sub_downgrade_expire_171",
      status: "expired",
    }));
    const r = await req("POST", "/v1/webhooks/lemonsqueezy", payload, {
      "x-signature": signPayload(payload),
    });

    expect(r.status).toBe(200);
    const updated = getAccount(account.account_id);
    expect(updated!.tier).toBe("free");
  });

  it("downgrades to free on unpaid status", async () => {
    const account = createAccount("Downgrade Unpaid", "downgrade-unpaid-171@test.com", "paid");

    const payload = JSON.stringify(buildWebhookPayload("subscription_payment_failed", account.account_id, {
      sub_id: "sub_downgrade_unpaid_171",
      status: "unpaid",
    }));
    const r = await req("POST", "/v1/webhooks/lemonsqueezy", payload, {
      "x-signature": signPayload(payload),
    });

    expect(r.status).toBe(200);
    const updated = getAccount(account.account_id);
    expect(updated!.tier).toBe("free");
  });

  it("keeps current tier on paused status", async () => {
    const account = createAccount("Pause Keep", "pause-keep-171@test.com", "paid");

    const payload = JSON.stringify(buildWebhookPayload("subscription_paused", account.account_id, {
      sub_id: "sub_pause_keep_171",
      status: "paused",
    }));
    const r = await req("POST", "/v1/webhooks/lemonsqueezy", payload, {
      "x-signature": signPayload(payload),
    });

    expect(r.status).toBe(200);
    const updated = getAccount(account.account_id);
    expect(updated!.tier).toBe("paid");
  });

  it("ignores unknown variant_id (no tier change)", async () => {
    const account = createAccount("Unknown Variant", "unknown-variant-171@test.com", "free");

    const payload = JSON.stringify(buildWebhookPayload("subscription_created", account.account_id, {
      sub_id: "sub_unknown_variant_171",
      variant_id: "variant_does_not_exist",
    }));
    const r = await req("POST", "/v1/webhooks/lemonsqueezy", payload, {
      "x-signature": signPayload(payload),
    });

    expect(r.status).toBe(200);
    const updated = getAccount(account.account_id);
    expect(updated!.tier).toBe("free"); // No change
  });

  it("does not change tier when already at target", async () => {
    const account = createAccount("Same Tier", "same-tier-171@test.com", "paid");

    const payload = JSON.stringify(buildWebhookPayload("subscription_updated", account.account_id, {
      sub_id: "sub_same_tier_171",
      variant_id: "variant_paid_171",
    }));
    const r = await req("POST", "/v1/webhooks/lemonsqueezy", payload, {
      "x-signature": signPayload(payload),
    });

    expect(r.status).toBe(200);
    const updated = getAccount(account.account_id);
    expect(updated!.tier).toBe("paid"); // No change
  });

  it("upgrades to suite tier on matching variant", async () => {
    const account = createAccount("Suite Upgrade", "suite-upgrade-171@test.com", "paid");

    const emails: EmailMessage[] = [];
    setEmailProvider(async (msg) => {
      emails.push(msg);
      return { provider_id: `test-${Date.now()}` };
    });

    const payload = JSON.stringify(buildWebhookPayload("subscription_updated", account.account_id, {
      sub_id: "sub_suite_upgrade_171",
      variant_id: "variant_suite_171",
    }));
    const r = await req("POST", "/v1/webhooks/lemonsqueezy", payload, {
      "x-signature": signPayload(payload),
    });

    expect(r.status).toBe(200);
    const updated = getAccount(account.account_id);
    expect(updated!.tier).toBe("suite");

    await new Promise((r) => setTimeout(r, 50));
    const upgradeEmail = emails.find((e) => e.template === "upgrade_confirmation");
    expect(upgradeEmail).toBeDefined();
    expect(upgradeEmail!.variables.tier_name).toBe("Enterprise Suite");

    setEmailProvider(null as unknown as import("@axis/snapshots").EmailProvider);
  });

  it("handles webhook for nonexistent account (returns 500)", async () => {
    const payload = JSON.stringify(buildWebhookPayload("subscription_created", "acct_does_not_exist", {
      sub_id: "sub_no_account_171",
    }));
    const r = await req("POST", "/v1/webhooks/lemonsqueezy", payload, {
      "x-signature": signPayload(payload),
    });

    // FK constraint on account_id causes failure — expected behavior
    expect(r.status).toBe(500);
  });
});

// ─── 4. Webhook edge cases ──────────────────────────────────────

describe("webhook edge cases", () => {
  it("returns 503 when webhook secret env not configured", async () => {
    const saved = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    const r = await req("POST", "/v1/webhooks/lemonsqueezy", JSON.stringify({ test: true }));
    expect(r.status).toBe(503);
    expect(r.data.error).toContain("webhook secret not configured");

    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = saved;
  });

  it("returns 400 on invalid JSON with valid signature", async () => {
    const invalidJson = "not json {{{";
    const sig = signPayload(invalidJson);

    const r = await req("POST", "/v1/webhooks/lemonsqueezy", invalidJson, {
      "x-signature": sig,
    });

    expect(r.status).toBe(400);
    expect(r.data.error).toContain("Invalid JSON");
  });

  it("handles timingSafeEqual with different length signature", async () => {
    const payload = JSON.stringify(buildWebhookPayload("subscription_created", "test"));
    // Provide a signature that's wrong length (not 64 hex chars) — triggers catch in verifyWebhookSignature
    const r = await req("POST", "/v1/webhooks/lemonsqueezy", payload, {
      "x-signature": "short",
    });

    expect(r.status).toBe(401);
  });

  it("lookup existing subscription when no account_id in custom_data", async () => {
    const account = createAccount("Existing Sub Lookup", "existing-lookup-171@test.com", "paid");

    // First create a subscription with account_id
    upsertSubscription({
      subscription_id: "sub_lookup_171",
      customer_id: "cust_1",
      account_id: account.account_id,
      variant_id: "variant_paid_171",
      product_id: "prod_1",
      status: "active",
      current_period_start: "2025-01-01T00:00:00Z",
      current_period_end: "2025-02-01T00:00:00Z",
      card_brand: null,
      card_last_four: null,
      cancel_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Now send webhook update WITHOUT account_id in custom_data — should look up from existing sub
    const payload = JSON.stringify({
      meta: {
        event_name: "subscription_updated",
        // No custom_data
      },
      data: {
        id: "sub_lookup_171",
        attributes: {
          status: "active",
          variant_id: "variant_paid_171",
          product_id: 456,
          customer_id: 789,
          current_period_start: "2025-02-01T00:00:00Z",
          current_period_end: "2025-03-01T00:00:00Z",
          card_brand: "mastercard",
          card_last_four: "5555",
          cancelled: false,
          ends_at: null,
        },
      },
    });

    const r = await req("POST", "/v1/webhooks/lemonsqueezy", payload, {
      "x-signature": signPayload(payload),
    });

    expect(r.status).toBe(200);
    expect(r.data.handled).toBe(true);

    // Verify subscription was updated (not re-created)
    const sub = getSubscription("sub_lookup_171");
    expect(sub).toBeDefined();
    expect(sub!.card_last_four).toBe("5555");
  });

  it("preserves original created_at on subscription update", async () => {
    const account = createAccount("Preserve Created", "preserve-171@test.com", "free");
    const originalCreatedAt = "2024-06-15T12:00:00.000Z";

    upsertSubscription({
      subscription_id: "sub_preserve_171",
      customer_id: "cust_1",
      account_id: account.account_id,
      variant_id: "variant_paid_171",
      product_id: "prod_1",
      status: "active",
      current_period_start: "2025-01-01T00:00:00Z",
      current_period_end: "2025-02-01T00:00:00Z",
      card_brand: null,
      card_last_four: null,
      cancel_at: null,
      created_at: originalCreatedAt,
      updated_at: originalCreatedAt,
    });

    // Send update webhook — should preserve original created_at
    const payload = JSON.stringify(buildWebhookPayload("subscription_updated", account.account_id, {
      sub_id: "sub_preserve_171",
      status: "active",
    }));

    const r = await req("POST", "/v1/webhooks/lemonsqueezy", payload, {
      "x-signature": signPayload(payload),
    });

    expect(r.status).toBe(200);
    const sub = getSubscription("sub_preserve_171");
    expect(sub!.created_at).toBe(originalCreatedAt);
  });

  it("handles subscription_resumed event", async () => {
    const account = createAccount("Resume Sub", "resume-171@test.com", "free");

    const payload = JSON.stringify(buildWebhookPayload("subscription_resumed", account.account_id, {
      sub_id: "sub_resume_171",
      status: "active",
    }));
    const r = await req("POST", "/v1/webhooks/lemonsqueezy", payload, {
      "x-signature": signPayload(payload),
    });

    expect(r.status).toBe(200);
    expect(r.data.handled).toBe(true);
    expect(r.data.event).toBe("subscription_resumed");
  });

  it("handles subscription_unpaused event", async () => {
    const account = createAccount("Unpause Sub", "unpause-171@test.com", "free");

    const payload = JSON.stringify(buildWebhookPayload("subscription_unpaused", account.account_id, {
      sub_id: "sub_unpause_171",
      status: "active",
    }));
    const r = await req("POST", "/v1/webhooks/lemonsqueezy", payload, {
      "x-signature": signPayload(payload),
    });

    expect(r.status).toBe(200);
    expect(r.data.handled).toBe(true);
  });

  it("handles subscription_payment_success event", async () => {
    const account = createAccount("Pay Success", "pay-success-171@test.com", "paid");

    const payload = JSON.stringify(buildWebhookPayload("subscription_payment_success", account.account_id, {
      sub_id: "sub_pay_success_171",
      status: "active",
    }));
    const r = await req("POST", "/v1/webhooks/lemonsqueezy", payload, {
      "x-signature": signPayload(payload),
    });

    expect(r.status).toBe(200);
    expect(r.data.handled).toBe(true);
  });
});
