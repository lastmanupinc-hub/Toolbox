// ─── PAI'D Payment Processor Client ──────────────────────────────
//
// Thin client over https://axis-pai-paid-api-main.onrender.com.
// Reads PAID_API_KEY, PAID_MERCHANT_ID, PAID_API_BASE_URL, plan IDs,
// and PAID_WEBHOOK_SIGNING_KEY from process.env. Credentials live in
// .env.local (gitignored) and in Render env vars in production.
//
// Contract (per PAI'D docs):
//   - POST {PAID_API_BASE_URL}/payment_intents — one-off charges
//   - POST {PAID_API_BASE_URL}/subscriptions   — recurring plans
//   - Webhook events delivered to /portal/api/paid/webhook
//     and signed with HMAC-SHA256 using PAID_WEBHOOK_SIGNING_KEY.

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const DEFAULT_BASE_URL = "https://axis-pai-paid-api-main.onrender.com/v1";

export type PaidPlan = "monthly" | "annual";

export interface PaidConfig {
  apiBaseUrl: string;
  apiKey: string;
  merchantId: string;
  planMonthly?: string;
  planAnnual?: string;
  webhookSigningKey?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  state: string;
  client_secret: string;
  [key: string]: unknown;
}

export interface Subscription {
  subscription_id: string;
  client_secret: string;
  status: string;
  [key: string]: unknown;
}

export interface CreateIntentInput {
  amountCents: number;
  currency?: string;
  idempotencyKey?: string;
}

export interface CreateSubscriptionInput {
  plan: PaidPlan;
  customerEmail: string;
  idempotencyKey?: string;
}

export class PaidError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: string,
  ) {
    super(message);
    this.name = "PaidError";
  }
}

export function loadPaidConfig(env: NodeJS.ProcessEnv = process.env): PaidConfig {
  const apiKey = env.PAID_API_KEY;
  const merchantId = env.PAID_MERCHANT_ID ?? env.PAID_ACCOUNT_ID;
  if (!apiKey) throw new Error("PAID_API_KEY is not set (see .env.local)");
  if (!merchantId) throw new Error("PAID_MERCHANT_ID is not set (see .env.local)");
  return {
    apiBaseUrl: (env.PAID_API_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, ""),
    apiKey,
    merchantId,
    planMonthly: env.PAID_PLAN_PRO_MONTHLY,
    planAnnual: env.PAID_PLAN_PRO_ANNUAL,
    webhookSigningKey: env.PAID_WEBHOOK_SIGNING_KEY,
  };
}

async function paidPost<T>(path: string, body: unknown, config: PaidConfig): Promise<T> {
  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new PaidError(`PAI'D ${path} failed (${res.status})`, res.status, text);
  }
  return JSON.parse(text) as T;
}

export async function createPaymentIntent(
  input: CreateIntentInput,
  config: PaidConfig = loadPaidConfig(),
): Promise<PaymentIntent> {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error("amountCents must be a positive integer (cents)");
  }
  return paidPost<PaymentIntent>(
    "/payment_intents",
    {
      amount: input.amountCents,
      currency: (input.currency ?? "USD").toUpperCase(),
      merchant_id: config.merchantId,
      idempotency_key: input.idempotencyKey ?? randomUUID(),
    },
    config,
  );
}

export async function createSubscription(
  input: CreateSubscriptionInput,
  config: PaidConfig = loadPaidConfig(),
): Promise<Subscription> {
  const planId = input.plan === "annual" ? config.planAnnual : config.planMonthly;
  if (!planId) {
    throw new Error(
      `PAID_PLAN_PRO_${input.plan.toUpperCase()} is not set — cannot create ${input.plan} subscription`,
    );
  }
  if (!input.customerEmail) throw new Error("customerEmail is required");
  return paidPost<Subscription>(
    "/subscriptions",
    {
      merchant_id: config.merchantId,
      plan_id: planId,
      customer_email: input.customerEmail,
      idempotency_key: input.idempotencyKey ?? randomUUID(),
    },
    config,
  );
}

// ─── Webhook signature verification ──────────────────────────────
//
// PAI'D signs webhook payloads with HMAC-SHA256 using the merchant's
// PAID_WEBHOOK_SIGNING_KEY (whsec_…). The signature is delivered in
// the `PAID-Signature` header as `t=<unix>,v1=<hex>`, mirroring Stripe.

export interface VerifyWebhookOptions {
  rawBody: string;
  signatureHeader: string | undefined;
  signingKey: string;
  toleranceSeconds?: number;
}

export function verifyPaidWebhookSignature(opts: VerifyWebhookOptions): boolean {
  if (!opts.signatureHeader || !opts.signingKey) return false;
  const parts: Record<string, string> = {};
  for (const piece of opts.signatureHeader.split(",")) {
    const idx = piece.indexOf("=");
    if (idx > 0) parts[piece.slice(0, idx).trim()] = piece.slice(idx + 1).trim();
  }
  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) return false;

  const tolerance = opts.toleranceSeconds ?? 300;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > tolerance) return false;

  const payload = `${timestamp}.${opts.rawBody}`;
  const expected = createHmac("sha256", opts.signingKey).update(payload).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(v1, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
