// ─── Lemon Squeezy Payment Integration ──────────────────────────
//
// Webhook handler (HMAC-SHA256 verified), checkout URL generator,
// and subscription status endpoint.

import { createHmac, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJSON, readBody, sendError } from "./router.js";
import { ErrorCode } from "./logger.js";
import { requireAuth } from "./billing.js";
import {
  upsertSubscription,
  getSubscription,
  getSubscriptionByAccount,
  getActiveSubscriptionByAccount,
  listSubscriptionsByAccount,
  variantToTier,
  updateAccountTier,
  logTierChange,
  trackEvent,
  getAccount,
  sendUpgradeConfirmation,
  type LemonSqueezyStatus,
} from "@axis/snapshots";

// ─── Webhook signature verification ────────────────────────────

function verifyWebhookSignature(rawBody: string, signature: string | undefined, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

// ─── Webhook event types we handle ─────────────────────────────

const HANDLED_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_resumed",
  "subscription_expired",
  "subscription_paused",
  "subscription_unpaused",
  "subscription_payment_success",
  "subscription_payment_failed",
]);

// ─── Extract subscription data from LS webhook payload ─────────

interface LsWebhookSubscriptionAttrs {
  status: LemonSqueezyStatus;
  variant_id: number;
  product_id: number;
  customer_id: number;
  current_period_start: string | null;
  current_period_end: string | null;
  card_brand: string | null;
  card_last_four: string | null;
  cancelled: boolean;
  ends_at: string | null;
}

interface LsWebhookPayload {
  meta: {
    event_name: string;
    custom_data?: {
      account_id?: string;
    };
  };
  data: {
    id: string;
    attributes: LsWebhookSubscriptionAttrs;
  };
}

function extractSubscriptionFromPayload(payload: LsWebhookPayload) {
  const { data, meta } = payload;
  const attrs = data.attributes;
  const now = new Date().toISOString();

  return {
    subscription_id: String(data.id),
    customer_id: String(attrs.customer_id),
    account_id: meta.custom_data?.account_id ?? "",
    variant_id: String(attrs.variant_id),
    product_id: String(attrs.product_id),
    status: attrs.status,
    current_period_start: attrs.current_period_start,
    current_period_end: attrs.current_period_end,
    card_brand: attrs.card_brand,
    card_last_four: attrs.card_last_four,
    cancel_at: attrs.ends_at,
    created_at: now,
    updated_at: now,
  };
}

// ─── Sync tier from subscription status ────────────────────────

function syncTierFromSubscription(accountId: string, variantId: string, status: LemonSqueezyStatus): void {
  const account = getAccount(accountId);
  if (!account) return;

  const previousTier = account.tier;
  let newTier = variantToTier(variantId);

  // Downgrade to free on cancellation/expiry/unpaid
  if (status === "cancelled" || status === "expired" || status === "unpaid") {
    newTier = "free";
  }

  // Pause keeps current tier but we could track it — for now keep tier
  if (status === "paused") return;

  if (!newTier || newTier === previousTier) return;

  updateAccountTier(accountId, newTier);
  logTierChange(accountId, previousTier, newTier, "lemonsqueezy_webhook", { status });
  trackEvent(accountId, newTier === "free" ? "downgrade_completed" : "upgrade_completed",
    newTier === "free" ? "signup" : "conversion",
    { from_tier: previousTier, to_tier: newTier, source: "lemonsqueezy" },
  );

  // Send upgrade confirmation email (fire-and-forget)
  if (newTier !== "free") {
    const tierNames: Record<string, string> = { paid: "Pro", suite: "Enterprise Suite" };
    const limits: Record<string, { snaps: string; projects: string; programs: string }> = {
      paid: { snaps: "200", projects: "20", programs: "17" },
      suite: { snaps: "Unlimited", projects: "Unlimited", programs: "17" },
    };
    const l = limits[newTier] ?? limits.paid;
    sendUpgradeConfirmation(account.email, account.name, tierNames[newTier] ?? newTier, l.snaps, l.projects, l.programs).catch(() => {});
  }
}

// ─── POST /v1/webhooks/lemonsqueezy ────────────────────────────

export async function handleLemonSqueezyWebhook(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    sendError(res, 503, ErrorCode.INTERNAL_ERROR, "Lemon Squeezy webhook secret not configured");
    return;
  }

  const rawBody = await readBody(req);
  const signature = req.headers["x-signature"] as string | undefined;

  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    sendError(res, 401, ErrorCode.AUTH_REQUIRED, "Invalid webhook signature");
    return;
  }

  let payload: LsWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    sendError(res, 400, ErrorCode.INVALID_JSON, "Invalid JSON body");
    return;
  }

  const eventName = payload.meta?.event_name;
  if (!eventName || !HANDLED_EVENTS.has(eventName)) {
    // Acknowledge unknown events without error (LS expects 200)
    sendJSON(res, 200, { received: true, event: eventName, handled: false });
    return;
  }

  const accountId = payload.meta.custom_data?.account_id;
  if (!accountId) {
    // Check if we can find account from existing subscription
    const existingSub = getSubscription(String(payload.data.id));
    if (!existingSub) {
      sendError(res, 400, ErrorCode.MISSING_FIELD, "No account_id in custom_data and no existing subscription found");
      return;
    }
    payload.meta.custom_data = { account_id: existingSub.account_id };
  }

  const subData = extractSubscriptionFromPayload(payload);

  // Preserve original created_at if subscription already exists
  const existing = getSubscription(subData.subscription_id);
  if (existing) {
    subData.created_at = existing.created_at;
  }

  upsertSubscription(subData);
  syncTierFromSubscription(subData.account_id, subData.variant_id, subData.status);

  sendJSON(res, 200, {
    received: true,
    event: eventName,
    subscription_id: subData.subscription_id,
    status: subData.status,
    handled: true,
  });
}

// ─── POST /v1/checkout ─────────────────────────────────────────

export async function handleCreateCheckout(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const ctx = requireAuth(req, res);
  if (!ctx) return;

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    sendError(res, 503, ErrorCode.INTERNAL_ERROR, "Stripe not configured");
    return;
  }

  const raw = await readBody(req);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    sendError(res, 400, ErrorCode.INVALID_JSON, "Invalid JSON body");
    return;
  }

  const tier = body.tier as string | undefined;
  if (!tier || !["paid", "suite"].includes(tier)) {
    sendError(res, 400, ErrorCode.INVALID_FORMAT, "tier must be paid or suite");
    return;
  }

  const priceId = tier === "paid"
    ? process.env.STRIPE_PRICE_ID_PAID
    : process.env.STRIPE_PRICE_ID_SUITE;

  if (!priceId) {
    sendError(res, 503, ErrorCode.INTERNAL_ERROR, `No Stripe price ID configured for ${tier} tier`);
    return;
  }

  // Check if account already has an active subscription
  const existingSub = getActiveSubscriptionByAccount(ctx.account!.account_id);
  if (existingSub) {
    sendError(res, 409, ErrorCode.CONFLICT, "Account already has an active subscription. Use the customer portal to manage it.");
    return;
  }

  // Determine redirect URLs
  const webUrl = process.env.CORS_ORIGIN || "http://localhost:5173";
  const successUrl = `${webUrl}/#account`;
  const cancelUrl = `${webUrl}/#plans`;

  // Build Stripe Checkout Session
  const params = new URLSearchParams();
  params.append("mode", "subscription");
  params.append("line_items[0][price]", priceId);
  params.append("line_items[0][quantity]", "1");
  params.append("success_url", successUrl);
  params.append("cancel_url", cancelUrl);
  params.append("client_reference_id", ctx.account!.account_id);
  if (ctx.account!.email) {
    params.append("customer_email", ctx.account!.email);
  }
  params.append("metadata[account_id]", ctx.account!.account_id);
  params.append("metadata[tier]", tier);

  try {
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errBody = await response.text();
      sendError(res, 502, ErrorCode.INTERNAL_ERROR, `Stripe API error: ${response.status}`);
      return;
    }

    const session = await response.json() as { id: string; url: string };

    trackEvent(ctx.account!.account_id, "checkout_started", "conversion", { tier, source: "stripe" });

    sendJSON(res, 201, {
      checkout_url: session.url,
      tier,
      session_id: session.id,
    });
  } catch (err) {
    sendError(res, 502, ErrorCode.INTERNAL_ERROR, `Failed to create checkout: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ─── GET /v1/account/subscription ──────────────────────────────

export async function handleGetSubscription(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const ctx = requireAuth(req, res);
  if (!ctx) return;

  const subscriptions = listSubscriptionsByAccount(ctx.account!.account_id);
  const active = getActiveSubscriptionByAccount(ctx.account!.account_id);

  sendJSON(res, 200, {
    account_id: ctx.account!.account_id,
    tier: ctx.account!.tier,
    has_active_subscription: active !== null,
    active_subscription: active
      ? {
          subscription_id: active.subscription_id,
          status: active.status,
          variant_id: active.variant_id,
          current_period_start: active.current_period_start,
          current_period_end: active.current_period_end,
          card_brand: active.card_brand,
          card_last_four: active.card_last_four,
          cancel_at: active.cancel_at,
        }
      : null,
    subscription_count: subscriptions.length,
  });
}

// ─── POST /v1/account/subscription/cancel ──────────────────────

export async function handleCancelSubscription(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const ctx = requireAuth(req, res);
  if (!ctx) return;

  const active = getActiveSubscriptionByAccount(ctx.account!.account_id);
  if (!active) {
    sendError(res, 404, ErrorCode.NOT_FOUND, "No active subscription to cancel");
    return;
  }

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) {
    sendError(res, 503, ErrorCode.INTERNAL_ERROR, "Lemon Squeezy not configured");
    return;
  }

  try {
    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${active.subscription_id}`,
      {
        method: "DELETE",
        headers: {
          "Accept": "application/vnd.api+json",
          "Authorization": `Bearer ${apiKey}`,
        },
      },
    );

    if (!response.ok) {
      sendError(res, 502, ErrorCode.INTERNAL_ERROR, `Lemon Squeezy API error: ${response.status}`);
      return;
    }

    // The actual tier change will happen via webhook when LS confirms cancellation
    trackEvent(ctx.account!.account_id, "cancellation_requested", "conversion", {
      subscription_id: active.subscription_id,
      source: "lemonsqueezy",
    });

    sendJSON(res, 200, {
      subscription_id: active.subscription_id,
      status: "cancellation_requested",
      message: "Subscription will be cancelled at the end of the current billing period.",
    });
  } catch (err) {
    sendError(res, 502, ErrorCode.INTERNAL_ERROR, `Failed to cancel subscription: ${err instanceof Error ? err.message : String(err)}`);
  }
}
