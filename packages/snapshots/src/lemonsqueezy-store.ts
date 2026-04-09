// ─── Lemon Squeezy Subscription Store ───────────────────────────
//
// CRUD for Lemon Squeezy subscriptions linked to AXIS accounts.
// Used by the webhook handler and checkout flow.

import { getDb } from "./db.js";
import type { BillingTier } from "./billing-types.js";

// ─── Types ──────────────────────────────────────────────────────

export type LemonSqueezyStatus =
  | "active"
  | "paused"
  | "past_due"
  | "unpaid"
  | "cancelled"
  | "expired"
  | "on_trial";

export interface LemonSqueezySubscription {
  subscription_id: string;
  customer_id: string;
  account_id: string;
  variant_id: string;
  product_id: string;
  status: LemonSqueezyStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  card_brand: string | null;
  card_last_four: string | null;
  cancel_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Variant → Tier mapping ────────────────────────────────────

/**
 * Resolve a Lemon Squeezy variant ID to an AXIS billing tier.
 * Reads from environment variables so values can change without code deploy.
 */
export function variantToTier(variantId: string): BillingTier | null {
  if (variantId === process.env.LEMONSQUEEZY_VARIANT_ID_PAID) return "paid";
  if (variantId === process.env.LEMONSQUEEZY_VARIANT_ID_SUITE) return "suite";
  return null;
}

// ─── CRUD ───────────────────────────────────────────────────────

export function upsertSubscription(sub: LemonSqueezySubscription): LemonSqueezySubscription {
  const db = getDb();
  db.prepare(`
    INSERT INTO lemon_squeezy_subscriptions
      (subscription_id, customer_id, account_id, variant_id, product_id, status,
       current_period_start, current_period_end, card_brand, card_last_four,
       cancel_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(subscription_id) DO UPDATE SET
      customer_id = excluded.customer_id,
      variant_id = excluded.variant_id,
      product_id = excluded.product_id,
      status = excluded.status,
      current_period_start = excluded.current_period_start,
      current_period_end = excluded.current_period_end,
      card_brand = excluded.card_brand,
      card_last_four = excluded.card_last_four,
      cancel_at = excluded.cancel_at,
      updated_at = excluded.updated_at
  `).run(
    sub.subscription_id,
    sub.customer_id,
    sub.account_id,
    sub.variant_id,
    sub.product_id,
    sub.status,
    sub.current_period_start,
    sub.current_period_end,
    sub.card_brand,
    sub.card_last_four,
    sub.cancel_at,
    sub.created_at,
    sub.updated_at,
  );
  return sub;
}

export function getSubscription(subscriptionId: string): LemonSqueezySubscription | null {
  const db = getDb();
  const row = db.prepare(
    "SELECT * FROM lemon_squeezy_subscriptions WHERE subscription_id = ?",
  ).get(subscriptionId) as LemonSqueezySubscription | undefined;
  return row ?? null;
}

export function getSubscriptionByAccount(accountId: string): LemonSqueezySubscription | null {
  const db = getDb();
  const row = db.prepare(
    "SELECT * FROM lemon_squeezy_subscriptions WHERE account_id = ? ORDER BY created_at DESC LIMIT 1",
  ).get(accountId) as LemonSqueezySubscription | undefined;
  return row ?? null;
}

export function getActiveSubscriptionByAccount(accountId: string): LemonSqueezySubscription | null {
  const db = getDb();
  const row = db.prepare(
    "SELECT * FROM lemon_squeezy_subscriptions WHERE account_id = ? AND status IN ('active', 'on_trial') ORDER BY created_at DESC LIMIT 1",
  ).get(accountId) as LemonSqueezySubscription | undefined;
  return row ?? null;
}

export function updateSubscriptionStatus(
  subscriptionId: string,
  status: LemonSqueezyStatus,
): boolean {
  const db = getDb();
  const result = db.prepare(
    "UPDATE lemon_squeezy_subscriptions SET status = ?, updated_at = ? WHERE subscription_id = ?",
  ).run(status, new Date().toISOString(), subscriptionId);
  return result.changes > 0;
}

export function listSubscriptionsByAccount(accountId: string): LemonSqueezySubscription[] {
  const db = getDb();
  return db.prepare(
    "SELECT * FROM lemon_squeezy_subscriptions WHERE account_id = ? ORDER BY created_at DESC",
  ).all(accountId) as LemonSqueezySubscription[];
}

export function deleteSubscription(subscriptionId: string): boolean {
  const db = getDb();
  const result = db.prepare(
    "DELETE FROM lemon_squeezy_subscriptions WHERE subscription_id = ?",
  ).run(subscriptionId);
  return result.changes > 0;
}

/**
 * Check if an account has an active paid subscription via Lemon Squeezy.
 * Returns the resolved tier or null if no active subscription.
 */
export function getActiveSubscriptionTier(accountId: string): BillingTier | null {
  const sub = getActiveSubscriptionByAccount(accountId);
  if (!sub) return null;
  return variantToTier(sub.variant_id);
}
