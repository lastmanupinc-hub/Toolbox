import { describe, it, expect } from "vitest";
import { buildOpenApiSpec } from "./openapi.js";

describe("buildOpenApiSpec", () => {
  const spec = buildOpenApiSpec();

  it("returns valid OpenAPI 3.1 spec", () => {
    expect(spec.openapi).toBe("3.1.0");
    expect(spec.info.title).toBe("AXIS Toolbox API");
    expect(spec.info.version).toBe("0.4.0");
  });

  it("includes all major route groups", () => {
    const paths = Object.keys(spec.paths);
    expect(paths).toContain("/v1/health");
    expect(paths).toContain("/v1/snapshots");
    expect(paths).toContain("/v1/snapshots/{snapshot_id}");
    expect(paths).toContain("/v1/github/analyze");
    expect(paths).toContain("/v1/programs");
    expect(paths).toContain("/v1/accounts");
    expect(paths).toContain("/v1/plans");
  });

  it("includes search endpoints", () => {
    const paths = Object.keys(spec.paths);
    expect(paths).toContain("/v1/search/index");
    expect(paths).toContain("/v1/search/query");
    expect(paths).toContain("/v1/search/{snapshot_id}/stats");
  });

  it("includes all 17 program endpoints", () => {
    const paths = Object.keys(spec.paths);
    const programPaths = paths.filter(
      (p) =>
        p.includes("/debug/") ||
        p.includes("/frontend/") ||
        p.includes("/seo/") ||
        p.includes("/optimization/") ||
        p.includes("/theme/") ||
        p.includes("/brand/") ||
        p.includes("/superpowers/") ||
        p.includes("/marketing/") ||
        p.includes("/notebook/") ||
        p.includes("/obsidian/") ||
        p.includes("/mcp/") ||
        p.includes("/artifacts/") ||
        p.includes("/remotion/") ||
        p.includes("/canvas/") ||
        p.includes("/algorithmic/") ||
        p.includes("/skills/") ||
        (p.includes("/search/export"))
    );
    expect(programPaths.length).toBe(17);
  });

  it("includes billing endpoints", () => {
    const paths = Object.keys(spec.paths);
    expect(paths).toContain("/v1/account");
    expect(paths).toContain("/v1/account/keys");
    expect(paths).toContain("/v1/account/usage");
    expect(paths).toContain("/v1/account/tier");
    expect(paths).toContain("/v1/account/programs");
  });

  it("includes funnel endpoints", () => {
    const paths = Object.keys(spec.paths);
    expect(paths).toContain("/v1/account/seats");
    expect(paths).toContain("/v1/account/upgrade-prompt");
    expect(paths).toContain("/v1/account/funnel");
    expect(paths).toContain("/v1/funnel/metrics");
  });

  it("defines apiKey security scheme", () => {
    expect(spec.components.securitySchemes.apiKey).toBeDefined();
    const scheme = spec.components.securitySchemes.apiKey as Record<string, unknown>;
    expect(scheme.type).toBe("apiKey");
    expect(scheme.in).toBe("header");
  });

  it("defines core schemas", () => {
    const schemas = Object.keys(spec.components.schemas);
    expect(schemas).toContain("ErrorResponse");
    expect(schemas).toContain("HealthResponse");
    expect(schemas).toContain("CreateSnapshotRequest");
    expect(schemas).toContain("SnapshotManifest");
    expect(schemas).toContain("FileEntry");
    expect(schemas).toContain("SnapshotResponse");
    expect(schemas).toContain("SearchQueryRequest");
    expect(schemas).toContain("SearchQueryResponse");
    expect(schemas).toContain("ProgramRequest");
  });

  it("has valid JSON structure (serializable)", () => {
    const json = JSON.stringify(spec);
    expect(json.length).toBeGreaterThan(1000);
    const parsed = JSON.parse(json);
    expect(parsed.openapi).toBe("3.1.0");
  });

  it("includes project and export endpoints", () => {
    const paths = Object.keys(spec.paths);
    expect(paths).toContain("/v1/projects/{project_id}/context");
    expect(paths).toContain("/v1/projects/{project_id}/generated-files");
    expect(paths).toContain("/v1/projects/{project_id}/export");
    expect(paths).toContain("/v1/projects/{project_id}");
    const proj = spec.paths["/v1/projects/{project_id}"] as Record<string, unknown>;
    expect(proj.delete).toBeDefined();
  });

  it("includes health probes and metrics", () => {
    const paths = Object.keys(spec.paths);
    expect(paths).toContain("/v1/health/live");
    expect(paths).toContain("/v1/health/ready");
    expect(paths).toContain("/v1/metrics");
  });

  it("includes version endpoints", () => {
    const paths = Object.keys(spec.paths);
    expect(paths).toContain("/v1/snapshots/{snapshot_id}/versions");
    expect(paths).toContain("/v1/snapshots/{snapshot_id}/versions/{version_number}");
    expect(paths).toContain("/v1/snapshots/{snapshot_id}/diff");
  });

  it("includes snapshot delete operation", () => {
    const snap = spec.paths["/v1/snapshots/{snapshot_id}"] as Record<string, unknown>;
    expect(snap.get).toBeDefined();
    expect(snap.delete).toBeDefined();
  });

  it("includes quota endpoint", () => {
    const paths = Object.keys(spec.paths);
    expect(paths).toContain("/v1/account/quota");
  });

  it("includes admin endpoints", () => {
    const paths = Object.keys(spec.paths);
    expect(paths).toContain("/v1/admin/stats");
    expect(paths).toContain("/v1/admin/accounts");
    expect(paths).toContain("/v1/admin/activity");
  });

  it("includes webhook endpoints", () => {
    const paths = Object.keys(spec.paths);
    expect(paths).toContain("/v1/account/webhooks");
    expect(paths).toContain("/v1/account/webhooks/{webhook_id}");
    expect(paths).toContain("/v1/account/webhooks/{webhook_id}/toggle");
    expect(paths).toContain("/v1/account/webhooks/{webhook_id}/deliveries");
    const wh = spec.paths["/v1/account/webhooks"] as Record<string, unknown>;
    expect(wh.post).toBeDefined();
    expect(wh.get).toBeDefined();
  });

  it("includes database endpoints", () => {
    const paths = Object.keys(spec.paths);
    expect(paths).toContain("/v1/db/stats");
    expect(paths).toContain("/v1/db/maintenance");
  });

  it("defines new schemas for added endpoints", () => {
    const schemas = Object.keys(spec.components.schemas);
    expect(schemas).toContain("ReadinessResponse");
    expect(schemas).toContain("VersionListResponse");
    expect(schemas).toContain("VersionDetailResponse");
    expect(schemas).toContain("VersionDiffResponse");
    expect(schemas).toContain("QuotaResponse");
    expect(schemas).toContain("AdminStatsResponse");
    expect(schemas).toContain("AdminAccountsResponse");
    expect(schemas).toContain("AdminActivityResponse");
    expect(schemas).toContain("CreateWebhookRequest");
    expect(schemas).toContain("WebhookResponse");
    expect(schemas).toContain("WebhookListResponse");
    expect(schemas).toContain("WebhookDeliveryListResponse");
    expect(schemas).toContain("DbStatsResponse");
    expect(schemas).toContain("DbMaintenanceResponse");
  });

  it("all paths start with /v1/", () => {
    for (const path of Object.keys(spec.paths)) {
      expect(path.startsWith("/v1/")).toBe(true);
    }
  });

  it("every operation has an operationId", () => {
    for (const [_path, methods] of Object.entries(spec.paths)) {
      const ops = methods as Record<string, Record<string, unknown>>;
      for (const [method, op] of Object.entries(ops)) {
        if (["get", "post", "put", "delete", "patch"].includes(method)) {
          expect(op.operationId, `${method.toUpperCase()} ${_path}`).toBeDefined();
        }
      }
    }
  });

  it("every operation has at least one tag", () => {
    for (const [_path, methods] of Object.entries(spec.paths)) {
      const ops = methods as Record<string, Record<string, unknown>>;
      for (const [method, op] of Object.entries(ops)) {
        if (["get", "post", "put", "delete", "patch"].includes(method)) {
          expect((op.tags as string[])?.length, `${method.toUpperCase()} ${_path}`).toBeGreaterThan(0);
        }
      }
    }
  });
});
