import { describe, it, expect, afterEach } from "vitest";
import { getDb, openMemoryDb, closeDb } from "./db.js";

afterEach(() => {
  closeDb();
});

// ─── openMemoryDb ───────────────────────────────────────────────

describe("openMemoryDb", () => {
  it("returns a Database instance", () => {
    const db = openMemoryDb();
    expect(db).toBeDefined();
    expect(typeof db.pragma).toBe("function");
  });

  it("enables foreign keys", () => {
    const db = openMemoryDb();
    const fk = db.pragma("foreign_keys", { simple: true });
    expect(fk).toBe(1);
  });

  it("creates all 10 tables", () => {
    const db = openMemoryDb();
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];
    const names = tables.map((t) => t.name).sort();
    expect(names).toEqual([
      "accounts",
      "api_keys",
      "context_maps",
      "funnel_events",
      "generator_results",
      "program_entitlements",
      "projects",
      "repo_profiles",
      "seats",
      "snapshots",
      "usage_records",
    ]);
  });

  it("creates expected indexes", () => {
    const db = openMemoryDb();
    const indexes = db
      .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name")
      .all() as { name: string }[];
    const names = indexes.map((i) => i.name);
    expect(names).toContain("idx_snapshots_project");
    expect(names).toContain("idx_api_keys_account");
    expect(names).toContain("idx_api_keys_hash");
    expect(names).toContain("idx_usage_account");
    expect(names).toContain("idx_usage_account_program");
    expect(names).toContain("idx_usage_created");
    expect(names).toContain("idx_seats_account");
    expect(names).toContain("idx_seats_email");
    expect(names).toContain("idx_seats_account_email");
    expect(names).toContain("idx_funnel_account");
    expect(names).toContain("idx_funnel_stage");
    expect(names).toContain("idx_funnel_type");
    expect(names).toContain("idx_funnel_created");
  });

  it("is idempotent — calling twice resets the handle", () => {
    const db1 = openMemoryDb();
    // Insert a row so we can confirm it's gone after re-init
    db1.prepare("INSERT INTO projects (project_id, project_name) VALUES ('p1', 'Project 1')").run();
    expect(db1.prepare("SELECT COUNT(*) as c FROM projects").get()).toEqual({ c: 1 });

    const db2 = openMemoryDb();
    // New in-memory DB — previous data is gone
    expect(db2.prepare("SELECT COUNT(*) as c FROM projects").get()).toEqual({ c: 0 });
  });
});

// ─── getDb ──────────────────────────────────────────────────────

describe("getDb", () => {
  it("returns the existing handle when already initialised", () => {
    const db1 = openMemoryDb();
    const db2 = getDb();
    // Should be the exact same object (module-level singleton)
    expect(db2).toBe(db1);
  });
});

// ─── closeDb ────────────────────────────────────────────────────

describe("closeDb", () => {
  it("resets handle — next openMemoryDb creates a fresh DB", () => {
    const db1 = openMemoryDb();
    db1.prepare("INSERT INTO projects (project_id, project_name) VALUES ('p1', 'Close Test')").run();
    closeDb();

    const db2 = openMemoryDb();
    expect(db2).not.toBe(db1);
    expect(db2.prepare("SELECT COUNT(*) as c FROM projects").get()).toEqual({ c: 0 });
  });

  it("is safe to call multiple times", () => {
    openMemoryDb();
    closeDb();
    closeDb(); // no throw
    closeDb(); // still fine
  });
});

// ─── Foreign key enforcement ────────────────────────────────────

describe("foreign key enforcement", () => {
  it("rejects snapshot with non-existent project_id", () => {
    openMemoryDb();
    expect(() =>
      getDb()
        .prepare(
          "INSERT INTO snapshots (snapshot_id, project_id, created_at, input_method, manifest, file_count, total_size_bytes, files, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .run("snap1", "missing-proj", "2024-01-01", "api_submission", "{}", 1, 100, "[]", "processing"),
    ).toThrow(/FOREIGN KEY/);
  });

  it("allows snapshot when project exists", () => {
    const db = openMemoryDb();
    db.prepare("INSERT INTO projects (project_id, project_name) VALUES ('p1', 'FK Test')").run();
    expect(() =>
      db
        .prepare(
          "INSERT INTO snapshots (snapshot_id, project_id, created_at, input_method, manifest, file_count, total_size_bytes, files, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .run("snap1", "p1", "2024-01-01", "api_submission", "{}", 1, 100, "[]", "processing"),
    ).not.toThrow();
  });

  it("rejects api_key with non-existent account_id", () => {
    openMemoryDb();
    expect(() =>
      getDb()
        .prepare("INSERT INTO api_keys (key_id, key_hash, account_id, label, created_at) VALUES (?, ?, ?, ?, ?)")
        .run("k1", "hash1", "missing-acct", "test", "2024-01-01"),
    ).toThrow(/FOREIGN KEY/);
  });

  it("rejects usage_record with non-existent account_id", () => {
    openMemoryDb();
    expect(() =>
      getDb()
        .prepare(
          "INSERT INTO usage_records (usage_id, account_id, program, snapshot_id, generators_run, input_files, input_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .run("u1", "missing", "debug", "snap1", 1, 1, 100, "2024-01-01"),
    ).toThrow(/FOREIGN KEY/);
  });

  it("rejects seat with non-existent account_id", () => {
    openMemoryDb();
    expect(() =>
      getDb()
        .prepare(
          "INSERT INTO seats (seat_id, account_id, email, role, invited_by, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .run("s1", "missing", "a@b.com", "member", "admin", "2024-01-01"),
    ).toThrow(/FOREIGN KEY/);
  });

  it("rejects funnel_event with non-existent account_id", () => {
    openMemoryDb();
    expect(() =>
      getDb()
        .prepare(
          "INSERT INTO funnel_events (event_id, account_id, event_type, stage, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .run("e1", "missing", "click", "awareness", "{}", "2024-01-01"),
    ).toThrow(/FOREIGN KEY/);
  });

  it("rejects context_map with non-existent snapshot_id", () => {
    openMemoryDb();
    expect(() =>
      getDb()
        .prepare("INSERT INTO context_maps (snapshot_id, data) VALUES (?, ?)")
        .run("missing-snap", "{}"),
    ).toThrow(/FOREIGN KEY/);
  });
});

// ─── Schema constraints ─────────────────────────────────────────

describe("schema constraints", () => {
  it("enforces projects.project_name UNIQUE", () => {
    const db = openMemoryDb();
    db.prepare("INSERT INTO projects (project_id, project_name) VALUES ('p1', 'Unique')").run();
    expect(() =>
      db.prepare("INSERT INTO projects (project_id, project_name) VALUES ('p2', 'Unique')").run(),
    ).toThrow(/UNIQUE/);
  });

  it("enforces accounts.email UNIQUE", () => {
    const db = openMemoryDb();
    db.prepare("INSERT INTO accounts (account_id, name, email, tier, created_at) VALUES ('a1', 'A', 'x@y.com', 'free', '2024-01-01')").run();
    expect(() =>
      db.prepare("INSERT INTO accounts (account_id, name, email, tier, created_at) VALUES ('a2', 'B', 'x@y.com', 'free', '2024-01-01')").run(),
    ).toThrow(/UNIQUE/);
  });

  it("enforces api_keys.key_hash UNIQUE", () => {
    const db = openMemoryDb();
    db.prepare("INSERT INTO accounts (account_id, name, email, tier, created_at) VALUES ('a1', 'A', 'x@y.com', 'free', '2024-01-01')").run();
    db.prepare("INSERT INTO api_keys (key_id, key_hash, account_id, label, created_at) VALUES ('k1', 'dup', 'a1', '', '2024-01-01')").run();
    expect(() =>
      db.prepare("INSERT INTO api_keys (key_id, key_hash, account_id, label, created_at) VALUES ('k2', 'dup', 'a1', '', '2024-01-01')").run(),
    ).toThrow(/UNIQUE/);
  });

  it("enforces seats partial unique index (active seats per account+email)", () => {
    const db = openMemoryDb();
    db.prepare("INSERT INTO accounts (account_id, name, email, tier, created_at) VALUES ('a1', 'A', 'x@y.com', 'free', '2024-01-01')").run();
    // Active seat
    db.prepare("INSERT INTO seats (seat_id, account_id, email, role, invited_by, created_at) VALUES ('s1', 'a1', 'member@test.com', 'member', 'admin', '2024-01-01')").run();
    // Duplicate active seat → blocked by partial unique index
    expect(() =>
      db.prepare("INSERT INTO seats (seat_id, account_id, email, role, invited_by, created_at) VALUES ('s2', 'a1', 'member@test.com', 'member', 'admin', '2024-01-01')").run(),
    ).toThrow(/UNIQUE/);
  });

  it("allows revoked + new active seat for same account+email", () => {
    const db = openMemoryDb();
    db.prepare("INSERT INTO accounts (account_id, name, email, tier, created_at) VALUES ('a1', 'A', 'x@y.com', 'free', '2024-01-01')").run();
    // Revoked seat
    db.prepare("INSERT INTO seats (seat_id, account_id, email, role, invited_by, revoked_at, created_at) VALUES ('s1', 'a1', 'member@test.com', 'member', 'admin', '2024-06-01', '2024-01-01')").run();
    // New active seat → allowed because first is revoked
    expect(() =>
      db.prepare("INSERT INTO seats (seat_id, account_id, email, role, invited_by, created_at) VALUES ('s2', 'a1', 'member@test.com', 'member', 'admin', '2024-07-01')").run(),
    ).not.toThrow();
  });

  it("defaults snapshot status to 'processing'", () => {
    const db = openMemoryDb();
    db.prepare("INSERT INTO projects (project_id, project_name) VALUES ('p1', 'Default Test')").run();
    db.prepare(
      "INSERT INTO snapshots (snapshot_id, project_id, created_at, input_method, manifest, file_count, total_size_bytes, files) VALUES ('s1', 'p1', '2024-01-01', 'api_submission', '{}', 1, 100, '[]')",
    ).run();
    const row = db.prepare("SELECT status FROM snapshots WHERE snapshot_id = 's1'").get() as { status: string };
    expect(row.status).toBe("processing");
  });

  it("defaults account tier to 'free'", () => {
    const db = openMemoryDb();
    db.prepare(
      "INSERT INTO accounts (account_id, name, email, created_at) VALUES ('a1', 'Default Tier', 'tier@test.com', '2024-01-01')",
    ).run();
    const row = db.prepare("SELECT tier FROM accounts WHERE account_id = 'a1'").get() as { tier: string };
    expect(row.tier).toBe("free");
  });

  it("defaults seat role to 'member'", () => {
    const db = openMemoryDb();
    db.prepare("INSERT INTO accounts (account_id, name, email, tier, created_at) VALUES ('a1', 'A', 'q@w.com', 'free', '2024-01-01')").run();
    db.prepare(
      "INSERT INTO seats (seat_id, account_id, email, invited_by, created_at) VALUES ('s1', 'a1', 'r@w.com', 'admin', '2024-01-01')",
    ).run();
    const row = db.prepare("SELECT role FROM seats WHERE seat_id = 's1'").get() as { role: string };
    expect(row.role).toBe("member");
  });

  it("defaults program_entitlements enabled to 1", () => {
    const db = openMemoryDb();
    db.prepare("INSERT INTO accounts (account_id, name, email, tier, created_at) VALUES ('a1', 'A', 'en@t.com', 'free', '2024-01-01')").run();
    db.prepare("INSERT INTO program_entitlements (account_id, program) VALUES ('a1', 'debug')").run();
    const row = db.prepare("SELECT enabled FROM program_entitlements WHERE account_id = 'a1' AND program = 'debug'").get() as { enabled: number };
    expect(row.enabled).toBe(1);
  });
});
