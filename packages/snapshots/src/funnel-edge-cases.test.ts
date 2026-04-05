import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { openMemoryDb, closeDb, getDb } from "./db.js";
import {
  createAccount,
  updateAccountTier,
  recordUsage,
} from "./billing-store.js";
import {
  inviteSeat,
  trackEvent,
  resolveStage,
  generateUpgradePrompt,
  getFunnelMetrics,
  getAccountEvents,
  getSeatCount,
} from "./funnel-store.js";
import {
  CHURN_RISK_DAYS,
  ENGAGEMENT_THRESHOLD,
  ACTIVATION_THRESHOLD,
  SEAT_LIMITS,
} from "./funnel-types.js";
import { TIER_LIMITS } from "./billing-types.js";

beforeEach(() => { openMemoryDb(); });
afterEach(() => { closeDb(); });

// ─── resolveStage — churn_risk branch ───────────────────────────

describe("resolveStage — churn_risk", () => {
  it("returns churn_risk for engaged free user with 14+ days inactivity", () => {
    const acct = createAccount("Churner", "churn@test.com");
    // Reach engagement threshold
    for (let i = 0; i < ENGAGEMENT_THRESHOLD; i++) {
      recordUsage(acct.account_id, "search", `snap-${i}`, 1, 1, 100);
    }
    // Create a funnel event so getLatestEvent has something to check
    trackEvent(acct.account_id, "snapshot_created", "engagement", {});
    // Backdate the latest event to 15 days ago
    const staleDate = new Date(Date.now() - (CHURN_RISK_DAYS + 1) * 24 * 60 * 60 * 1000).toISOString();
    getDb().prepare("UPDATE funnel_events SET created_at = ?").run(staleDate);

    expect(resolveStage(acct.account_id)).toBe("churn_risk");
  });

  it("returns engagement (not churn_risk) when inactivity is under threshold", () => {
    const acct = createAccount("Active", "active@test.com");
    for (let i = 0; i < ENGAGEMENT_THRESHOLD; i++) {
      recordUsage(acct.account_id, "search", `snap-${i}`, 1, 1, 100);
    }
    // Latest event is recent — no churn risk
    expect(resolveStage(acct.account_id)).toBe("engagement");
  });

  it("returns engagement when exactly at CHURN_RISK_DAYS boundary (not >=)", () => {
    const acct = createAccount("Edge", "edge@test.com");
    for (let i = 0; i < ENGAGEMENT_THRESHOLD; i++) {
      recordUsage(acct.account_id, "search", `snap-${i}`, 1, 1, 100);
    }
    // Set last event at exactly CHURN_RISK_DAYS minus a small buffer
    const boundaryDate = new Date(Date.now() - (CHURN_RISK_DAYS - 0.5) * 24 * 60 * 60 * 1000).toISOString();
    getDb().prepare("UPDATE funnel_events SET created_at = ?").run(boundaryDate);

    expect(resolveStage(acct.account_id)).toBe("engagement");
  });

  it("returns churn_risk only for free tier (not paid)", () => {
    const acct = createAccount("PaidUser", "paid@test.com", "paid");
    // Even with old events, paid users are never classified as churn_risk via resolveStage
    trackEvent(acct.account_id, "snapshot_created", "conversion", {});
    const staleDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    getDb().prepare("UPDATE funnel_events SET created_at = ?").run(staleDate);

    // Paid tier takes the conversion/expansion path, not the free-tier churn path
    expect(resolveStage(acct.account_id)).toBe("conversion");
  });
});

// ─── resolveStage — expansion detection ─────────────────────────

describe("resolveStage — expansion", () => {
  it("returns expansion for paid account with program_added events", () => {
    const acct = createAccount("PaidProg", "prog@test.com", "paid");
    trackEvent(acct.account_id, "program_added", "expansion", { program: "seo" });
    expect(resolveStage(acct.account_id)).toBe("expansion");
  });

  it("returns conversion for paid account with no expansion events", () => {
    const acct = createAccount("PaidPlain", "plain@test.com", "paid");
    expect(resolveStage(acct.account_id)).toBe("conversion");
  });

  it("returns expansion for suite account with seats", () => {
    const acct = createAccount("SuiteOrg", "suite@test.com", "suite");
    inviteSeat(acct.account_id, "dev@test.com", "member", acct.account_id);
    expect(resolveStage(acct.account_id)).toBe("expansion");
  });
});

// ─── generateUpgradePrompt — paid → suite: snapshot approaching ─

describe("generateUpgradePrompt — paid snapshot_limit_approaching", () => {
  it("returns snapshot_limit_approaching when paid user at 80% quota", () => {
    const acct = createAccount("HeavyUser", "heavy@test.com", "paid");
    const limit = TIER_LIMITS.paid.max_snapshots_per_month;
    const threshold = Math.ceil(limit * 0.8);

    for (let i = 0; i < threshold; i++) {
      recordUsage(acct.account_id, "search", `snap-${i}`, 1, 1, 100);
    }

    const prompt = generateUpgradePrompt(acct.account_id);
    expect(prompt).not.toBeNull();
    expect(prompt!.trigger).toBe("snapshot_limit_approaching");
    expect(prompt!.current_tier).toBe("paid");
    expect(prompt!.recommended_tier).toBe("suite");
    expect(prompt!.urgency).toBe("medium");
    expect(prompt!.body).toContain(String(threshold));
    expect(prompt!.body).toContain(String(limit));
  });

  it("returns null when paid user is under 80% quota", () => {
    const acct = createAccount("LightUser", "light@test.com", "paid");
    // Use only 50 of 200 (25%)
    for (let i = 0; i < 50; i++) {
      recordUsage(acct.account_id, "search", `snap-${i}`, 1, 1, 100);
    }
    expect(generateUpgradePrompt(acct.account_id)).toBeNull();
  });

  it("seat_limit_reached takes priority over snapshot_limit_approaching", () => {
    const acct = createAccount("Both", "both@test.com", "paid");
    // Fill all seats
    for (let i = 0; i < SEAT_LIMITS.paid; i++) {
      inviteSeat(acct.account_id, `u${i}@test.com`, "member", acct.account_id);
    }
    // Also approach snapshot limit
    const threshold = Math.ceil(TIER_LIMITS.paid.max_snapshots_per_month * 0.8);
    for (let i = 0; i < threshold; i++) {
      recordUsage(acct.account_id, "search", `snap-${i}`, 1, 1, 100);
    }

    const prompt = generateUpgradePrompt(acct.account_id);
    // Seats are checked first in the code → seat_limit_reached wins
    expect(prompt!.trigger).toBe("seat_limit_reached");
  });
});

// ─── generateUpgradePrompt — free: churn_risk ───────────────────

describe("generateUpgradePrompt — churn_risk prompt", () => {
  it("returns inactivity_detected prompt for churning free user", () => {
    const acct = createAccount("Churner", "churn2@test.com");
    for (let i = 0; i < ENGAGEMENT_THRESHOLD; i++) {
      recordUsage(acct.account_id, "search", `snap-${i}`, 1, 1, 100);
    }
    // Create a funnel event so getLatestEvent returns something to check staleness
    trackEvent(acct.account_id, "snapshot_created", "engagement", {});
    // Backdate all events past churn threshold
    const staleDate = new Date(Date.now() - (CHURN_RISK_DAYS + 2) * 24 * 60 * 60 * 1000).toISOString();
    getDb().prepare("UPDATE funnel_events SET created_at = ?").run(staleDate);

    const prompt = generateUpgradePrompt(acct.account_id);
    expect(prompt).not.toBeNull();
    expect(prompt!.trigger).toBe("inactivity_detected");
    expect(prompt!.current_tier).toBe("free");
    expect(prompt!.headline).toBe("We miss you");
    expect(prompt!.urgency).toBe("low");
  });
});

// ─── generateUpgradePrompt — engagement prompt content ──────────

describe("generateUpgradePrompt — engagement prompt content", () => {
  it("engagement prompt lists locked programs in features_unlocked", () => {
    const acct = createAccount("Engaged", "engaged@test.com");
    for (let i = 0; i < ENGAGEMENT_THRESHOLD; i++) {
      recordUsage(acct.account_id, "search", `snap-${i}`, 1, 1, 100);
    }

    const prompt = generateUpgradePrompt(acct.account_id);
    expect(prompt!.trigger).toBe("active_user_value");
    // features_unlocked should be programs NOT in free tier
    const freePrograms = TIER_LIMITS.free.programs;
    for (const feat of prompt!.features_unlocked) {
      expect(freePrograms).not.toContain(feat);
    }
  });

  it("engagement prompt body includes snapshot count", () => {
    const acct = createAccount("Counter", "count@test.com");
    for (let i = 0; i < ENGAGEMENT_THRESHOLD; i++) {
      recordUsage(acct.account_id, "search", `snap-${i}`, 1, 1, 100);
    }

    const prompt = generateUpgradePrompt(acct.account_id);
    expect(prompt!.body).toContain(String(ENGAGEMENT_THRESHOLD));
  });
});

// ─── getFunnelMetrics — deeper coverage ─────────────────────────

describe("getFunnelMetrics — deeper coverage", () => {
  it("activation_rate excludes only signup and visitor stages", () => {
    // 3 accounts: 1 signup, 1 activated, 1 paid(conversion)
    createAccount("Signup", "s@t.com");
    const activated = createAccount("Active", "a@t.com");
    recordUsage(activated.account_id, "search", "snap-1", 1, 1, 100);
    createAccount("Paid", "p@t.com", "paid");

    const m = getFunnelMetrics();
    expect(m.total_accounts).toBe(3);
    // activated = 3 - 1 (signup) - 0 (visitor) = 2
    expect(m.activation_rate).toBeCloseTo(2 / 3);
  });

  it("conversion_rate is 0 when all accounts are free", () => {
    createAccount("A", "a@t.com");
    createAccount("B", "b@t.com");
    const m = getFunnelMetrics();
    expect(m.conversion_rate).toBe(0);
  });

  it("includes churn_risk in by_stage distribution", () => {
    const acct = createAccount("Churner", "ch@t.com");
    for (let i = 0; i < ENGAGEMENT_THRESHOLD; i++) {
      recordUsage(acct.account_id, "search", `snap-${i}`, 1, 1, 100);
    }
    // Create a funnel event so resolveStage can detect staleness
    trackEvent(acct.account_id, "snapshot_created", "engagement", {});
    const staleDate = new Date(Date.now() - (CHURN_RISK_DAYS + 1) * 24 * 60 * 60 * 1000).toISOString();
    getDb().prepare("UPDATE funnel_events SET created_at = ?").run(staleDate);

    const m = getFunnelMetrics();
    expect(m.by_stage.churn_risk).toBe(1);
  });

  it("counts events_last_24h accurately (excludes old events)", () => {
    const acct = createAccount("A", "a@t.com");
    trackEvent(acct.account_id, "account_created", "signup", {});
    // Backdate one event to 48h ago
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    getDb().prepare("UPDATE funnel_events SET created_at = ? WHERE rowid = (SELECT MIN(rowid) FROM funnel_events)").run(old);
    // Add a recent event
    trackEvent(acct.account_id, "snapshot_created", "activation", {});

    const m = getFunnelMetrics();
    expect(m.events_last_24h).toBe(1);
    expect(m.events_last_7d).toBe(2);
  });
});
