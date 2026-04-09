import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { openMemoryDb, closeDb } from "./db.js";
import { createAccount, updateAccountTier, getAccount } from "./billing-store.js";
import {
  upsertSubscription,
  getSubscription,
  getSubscriptionByAccount,
  getActiveSubscriptionByAccount,
  updateSubscriptionStatus,
  listSubscriptionsByAccount,
  deleteSubscription,
  getActiveSubscriptionTier,
  variantToTier,
} from "./lemonsqueezy-store.js";

beforeEach(() => {
  openMemoryDb();
  process.env.LEMONSQUEEZY_VARIANT_ID_PAID = "variant_paid_123";
  process.env.LEMONSQUEEZY_VARIANT_ID_SUITE = "variant_suite_456";
});

afterEach(() => {
  closeDb();
  delete process.env.LEMONSQUEEZY_VARIANT_ID_PAID;
  delete process.env.LEMONSQUEEZY_VARIANT_ID_SUITE;
});

function makeSub(accountId: string, overrides: Record<string, unknown> = {}) {
  return {
    subscription_id: "sub_001",
    customer_id: "cust_001",
    account_id: accountId,
    variant_id: "variant_paid_123",
    product_id: "prod_001",
    status: "active" as const,
    current_period_start: "2025-01-01T00:00:00Z",
    current_period_end: "2025-02-01T00:00:00Z",
    card_brand: "visa",
    card_last_four: "4242",
    cancel_at: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

// ─── variantToTier ──────────────────────────────────────────────

describe("variantToTier", () => {
  it("maps paid variant to paid tier", () => {
    expect(variantToTier("variant_paid_123")).toBe("paid");
  });

  it("maps suite variant to suite tier", () => {
    expect(variantToTier("variant_suite_456")).toBe("suite");
  });

  it("returns null for unknown variant", () => {
    expect(variantToTier("unknown_variant")).toBeNull();
  });
});

// ─── Subscription CRUD ─────────────────────────────────────────

describe("Subscription CRUD", () => {
  it("creates and retrieves a subscription", () => {
    const acct = createAccount("Alice", "alice@test.com", "free");
    const sub = makeSub(acct.account_id);
    upsertSubscription(sub);

    const found = getSubscription("sub_001");
    expect(found).toBeTruthy();
    expect(found!.subscription_id).toBe("sub_001");
    expect(found!.account_id).toBe(acct.account_id);
    expect(found!.status).toBe("active");
    expect(found!.card_brand).toBe("visa");
  });

  it("upserts (updates) an existing subscription", () => {
    const acct = createAccount("Bob", "bob@test.com", "free");
    upsertSubscription(makeSub(acct.account_id));

    upsertSubscription(makeSub(acct.account_id, {
      status: "past_due" as const,
      updated_at: "2025-01-15T00:00:00Z",
    }));

    const found = getSubscription("sub_001");
    expect(found!.status).toBe("past_due");
    expect(found!.updated_at).toBe("2025-01-15T00:00:00Z");
  });

  it("retrieves subscription by account", () => {
    const acct = createAccount("Charlie", "charlie@test.com", "free");
    upsertSubscription(makeSub(acct.account_id));

    const found = getSubscriptionByAccount(acct.account_id);
    expect(found).toBeTruthy();
    expect(found!.account_id).toBe(acct.account_id);
  });

  it("returns null for nonexistent subscription", () => {
    expect(getSubscription("nope")).toBeNull();
  });

  it("returns null for account with no subscription", () => {
    const acct = createAccount("Dan", "dan@test.com", "free");
    expect(getSubscriptionByAccount(acct.account_id)).toBeNull();
  });
});

// ─── Active subscription filtering ─────────────────────────────

describe("Active subscription filtering", () => {
  it("returns active subscription", () => {
    const acct = createAccount("Eve", "eve@test.com", "free");
    upsertSubscription(makeSub(acct.account_id));

    const active = getActiveSubscriptionByAccount(acct.account_id);
    expect(active).toBeTruthy();
    expect(active!.status).toBe("active");
  });

  it("returns on_trial as active", () => {
    const acct = createAccount("Frank", "frank@test.com", "free");
    upsertSubscription(makeSub(acct.account_id, { status: "on_trial" as const }));

    const active = getActiveSubscriptionByAccount(acct.account_id);
    expect(active).toBeTruthy();
    expect(active!.status).toBe("on_trial");
  });

  it("does not return cancelled subscription as active", () => {
    const acct = createAccount("Grace", "grace@test.com", "free");
    upsertSubscription(makeSub(acct.account_id, { status: "cancelled" as const }));

    const active = getActiveSubscriptionByAccount(acct.account_id);
    expect(active).toBeNull();
  });

  it("does not return expired subscription as active", () => {
    const acct = createAccount("Heidi", "heidi@test.com", "free");
    upsertSubscription(makeSub(acct.account_id, { status: "expired" as const }));

    expect(getActiveSubscriptionByAccount(acct.account_id)).toBeNull();
  });
});

// ─── Status update ──────────────────────────────────────────────

describe("updateSubscriptionStatus", () => {
  it("updates subscription status", () => {
    const acct = createAccount("Ivan", "ivan@test.com", "free");
    upsertSubscription(makeSub(acct.account_id));

    const updated = updateSubscriptionStatus("sub_001", "cancelled");
    expect(updated).toBe(true);

    const found = getSubscription("sub_001");
    expect(found!.status).toBe("cancelled");
  });

  it("returns false for nonexistent subscription", () => {
    expect(updateSubscriptionStatus("nope", "cancelled")).toBe(false);
  });
});

// ─── List & Delete ──────────────────────────────────────────────

describe("listSubscriptionsByAccount", () => {
  it("lists all subscriptions for an account", () => {
    const acct = createAccount("Judy", "judy@test.com", "free");
    upsertSubscription(makeSub(acct.account_id, { subscription_id: "sub_a" }));
    upsertSubscription(makeSub(acct.account_id, {
      subscription_id: "sub_b",
      status: "cancelled" as const,
      created_at: "2025-02-01T00:00:00Z",
    }));

    const list = listSubscriptionsByAccount(acct.account_id);
    expect(list.length).toBe(2);
  });
});

describe("deleteSubscription", () => {
  it("deletes a subscription", () => {
    const acct = createAccount("Ken", "ken@test.com", "free");
    upsertSubscription(makeSub(acct.account_id));

    expect(deleteSubscription("sub_001")).toBe(true);
    expect(getSubscription("sub_001")).toBeNull();
  });

  it("returns false for nonexistent subscription", () => {
    expect(deleteSubscription("nope")).toBe(false);
  });
});

// ─── getActiveSubscriptionTier ──────────────────────────────────

describe("getActiveSubscriptionTier", () => {
  it("returns paid for active paid subscription", () => {
    const acct = createAccount("Liam", "liam@test.com", "free");
    upsertSubscription(makeSub(acct.account_id, { variant_id: "variant_paid_123" }));

    expect(getActiveSubscriptionTier(acct.account_id)).toBe("paid");
  });

  it("returns suite for active suite subscription", () => {
    const acct = createAccount("Mia", "mia@test.com", "free");
    upsertSubscription(makeSub(acct.account_id, { variant_id: "variant_suite_456" }));

    expect(getActiveSubscriptionTier(acct.account_id)).toBe("suite");
  });

  it("returns null when no active subscription", () => {
    const acct = createAccount("Noah", "noah@test.com", "free");
    expect(getActiveSubscriptionTier(acct.account_id)).toBeNull();
  });

  it("returns null when subscription is cancelled", () => {
    const acct = createAccount("Olivia", "olivia@test.com", "free");
    upsertSubscription(makeSub(acct.account_id, { status: "cancelled" as const }));

    expect(getActiveSubscriptionTier(acct.account_id)).toBeNull();
  });
});
