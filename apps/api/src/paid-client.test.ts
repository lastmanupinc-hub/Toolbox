import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHmac } from "node:crypto";
import {
  loadPaidConfig,
  createPaymentIntent,
  createSubscription,
  verifyPaidWebhookSignature,
  PaidError,
} from "./paid-client.js";

// ─── loadPaidConfig ─────────────────────────────────────────────

describe("loadPaidConfig", () => {
  it("loads required fields and falls back from PAID_ACCOUNT_ID", () => {
    const cfg = loadPaidConfig({
      PAID_API_KEY: "sk_live_test",
      PAID_ACCOUNT_ID: "acct_abc",
      PAID_API_BASE_URL: "https://example.com/v1/",
      PAID_PLAN_PRO_MONTHLY: "plan_m",
      PAID_PLAN_PRO_ANNUAL: "plan_a",
      PAID_WEBHOOK_SIGNING_KEY: "whsec_x",
    } as NodeJS.ProcessEnv);
    expect(cfg.apiKey).toBe("sk_live_test");
    expect(cfg.merchantId).toBe("acct_abc");
    expect(cfg.apiBaseUrl).toBe("https://example.com/v1"); // trailing slash trimmed
    expect(cfg.planMonthly).toBe("plan_m");
    expect(cfg.planAnnual).toBe("plan_a");
    expect(cfg.webhookSigningKey).toBe("whsec_x");
  });

  it("prefers PAID_MERCHANT_ID over PAID_ACCOUNT_ID", () => {
    const cfg = loadPaidConfig({
      PAID_API_KEY: "k",
      PAID_MERCHANT_ID: "merchant",
      PAID_ACCOUNT_ID: "account",
    } as NodeJS.ProcessEnv);
    expect(cfg.merchantId).toBe("merchant");
  });

  it("throws when PAID_API_KEY missing", () => {
    expect(() => loadPaidConfig({ PAID_MERCHANT_ID: "m" } as NodeJS.ProcessEnv)).toThrow(/PAID_API_KEY/);
  });

  it("throws when merchant id missing", () => {
    expect(() => loadPaidConfig({ PAID_API_KEY: "k" } as NodeJS.ProcessEnv)).toThrow(/PAID_MERCHANT_ID/);
  });
});

// ─── createPaymentIntent / createSubscription ───────────────────

const CONFIG = {
  apiBaseUrl: "https://paid.test/v1",
  apiKey: "sk_live_test",
  merchantId: "acct_x",
  planMonthly: "plan_m",
  planAnnual: "plan_a",
  webhookSigningKey: "whsec_x",
};

let fetchSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fetchSpy = vi.spyOn(globalThis, "fetch");
});

afterEach(() => {
  fetchSpy.mockRestore();
});

function okResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
}

describe("createPaymentIntent", () => {
  it("rejects non-positive amounts", async () => {
    await expect(createPaymentIntent({ amountCents: 0 }, CONFIG)).rejects.toThrow(/positive integer/);
    await expect(createPaymentIntent({ amountCents: -1 }, CONFIG)).rejects.toThrow(/positive integer/);
    await expect(createPaymentIntent({ amountCents: 1.5 }, CONFIG)).rejects.toThrow(/positive integer/);
  });

  it("POSTs to /payment_intents with amount + merchant_id", async () => {
    fetchSpy.mockResolvedValueOnce(okResponse({ id: "pi_1", client_secret: "cs_1", amount: 500, currency: "USD", state: "requires_action" }));
    const intent = await createPaymentIntent({ amountCents: 500, idempotencyKey: "idem-1" }, CONFIG);
    expect(intent.client_secret).toBe("cs_1");
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://paid.test/v1/payment_intents");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.amount).toBe(500);
    expect(body.currency).toBe("USD");
    expect(body.merchant_id).toBe("acct_x");
    expect(body.idempotency_key).toBe("idem-1");
    expect((init as RequestInit).headers).toMatchObject({ Authorization: "Bearer sk_live_test" });
  });

  it("throws PaidError on non-2xx", async () => {
    fetchSpy.mockResolvedValueOnce(new Response("nope", { status: 402 }));
    await expect(createPaymentIntent({ amountCents: 100 }, CONFIG)).rejects.toBeInstanceOf(PaidError);
  });
});

describe("createSubscription", () => {
  it("maps plan → plan_id (monthly)", async () => {
    fetchSpy.mockResolvedValueOnce(okResponse({ subscription_id: "sub_1", client_secret: "cs_x", status: "incomplete" }));
    const sub = await createSubscription({ plan: "monthly", customerEmail: "a@b.com" }, CONFIG);
    expect(sub.subscription_id).toBe("sub_1");
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.plan_id).toBe("plan_m");
    expect(body.customer_email).toBe("a@b.com");
  });

  it("maps plan → plan_id (annual)", async () => {
    fetchSpy.mockResolvedValueOnce(okResponse({ subscription_id: "sub_2", client_secret: "cs_y", status: "incomplete" }));
    await createSubscription({ plan: "annual", customerEmail: "a@b.com" }, CONFIG);
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.plan_id).toBe("plan_a");
  });

  it("throws when plan id missing in config", async () => {
    await expect(
      createSubscription({ plan: "monthly", customerEmail: "a@b.com" }, { ...CONFIG, planMonthly: undefined }),
    ).rejects.toThrow(/PAID_PLAN_PRO_MONTHLY/);
  });

  it("throws when customerEmail missing", async () => {
    await expect(createSubscription({ plan: "monthly", customerEmail: "" }, CONFIG)).rejects.toThrow(/customerEmail/);
  });
});

// ─── verifyPaidWebhookSignature ─────────────────────────────────

function signPaid(payload: string, key: string, ts: number = Math.floor(Date.now() / 1000)): string {
  const hex = createHmac("sha256", key).update(`${ts}.${payload}`).digest("hex");
  return `t=${ts},v1=${hex}`;
}

describe("verifyPaidWebhookSignature", () => {
  const key = "whsec_test";
  const body = '{"type":"x"}';

  it("accepts a valid signature", () => {
    const sig = signPaid(body, key);
    expect(verifyPaidWebhookSignature({ rawBody: body, signatureHeader: sig, signingKey: key })).toBe(true);
  });

  it("rejects a bad hex signature", () => {
    expect(verifyPaidWebhookSignature({ rawBody: body, signatureHeader: "t=1,v1=deadbeef", signingKey: key })).toBe(false);
  });

  it("rejects a stale timestamp", () => {
    const stale = Math.floor(Date.now() / 1000) - 10_000;
    const sig = signPaid(body, key, stale);
    expect(verifyPaidWebhookSignature({ rawBody: body, signatureHeader: sig, signingKey: key })).toBe(false);
  });

  it("rejects missing signature header", () => {
    expect(verifyPaidWebhookSignature({ rawBody: body, signatureHeader: undefined, signingKey: key })).toBe(false);
  });

  it("rejects header missing t or v1", () => {
    expect(verifyPaidWebhookSignature({ rawBody: body, signatureHeader: "v1=abc", signingKey: key })).toBe(false);
    expect(verifyPaidWebhookSignature({ rawBody: body, signatureHeader: "t=123", signingKey: key })).toBe(false);
  });
});
