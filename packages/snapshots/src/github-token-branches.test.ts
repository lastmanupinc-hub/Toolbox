/**
 * eq_129: GitHub token store branch coverage
 * Targets uncovered branches: lines 31 (valid decrypt format), 103-106 (token_id query path)
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { openMemoryDb, closeDb } from "./db.js";
import { createAccount } from "./billing-store.js";
import {
  saveGitHubToken,
  getGitHubTokens,
  getGitHubTokenDecrypted,
} from "./github-token-store.js";

beforeEach(() => { openMemoryDb(); });
afterEach(() => { closeDb(); });

describe("github-token-store branches", () => {
  it("decrypts a saved token via getGitHubTokenDecrypted (no token_id)", () => {
    const acct = createAccount("TokenTest", "token@test.com");
    const raw = "ghp_1234567890abcdef1234567890abcdef12";
    saveGitHubToken(acct.account_id, raw, "default", ["repo"]);

    const decrypted = getGitHubTokenDecrypted(acct.account_id);
    expect(decrypted).toBe(raw);
  });

  it("decrypts a saved token via specific token_id", () => {
    const acct = createAccount("TokenTest2", "token2@test.com");
    const raw = "ghp_abcdef1234567890abcdef1234567890ab";
    const saved = saveGitHubToken(acct.account_id, raw, "ci", ["repo", "read:org"]);

    const decrypted = getGitHubTokenDecrypted(acct.account_id, saved.token_id);
    expect(decrypted).toBe(raw);
  });

  it("returns undefined when token_id does not match", () => {
    const acct = createAccount("TokenTest3", "token3@test.com");
    saveGitHubToken(acct.account_id, "ghp_something1234567890123456789012", "x");

    const decrypted = getGitHubTokenDecrypted(acct.account_id, "nonexistent-id");
    expect(decrypted).toBeUndefined();
  });

  it("lists multiple tokens for an account", () => {
    const acct = createAccount("TokenTest4", "token4@test.com");
    saveGitHubToken(acct.account_id, "ghp_first12345678901234567890123456", "first");
    saveGitHubToken(acct.account_id, "ghp_second1234567890123456789012345", "second");

    const tokens = getGitHubTokens(acct.account_id);
    expect(tokens).toHaveLength(2);
    expect(tokens.map(t => t.label)).toContain("first");
    expect(tokens.map(t => t.label)).toContain("second");
  });

  it("stores token_prefix as first 8 chars", () => {
    const acct = createAccount("TokenTest5", "token5@test.com");
    const raw = "ghp_abcdefgh_rest_of_token_here12345";
    const saved = saveGitHubToken(acct.account_id, raw, "prefix-check");
    expect(saved.token_prefix).toBe("ghp_abcd");
  });
});
