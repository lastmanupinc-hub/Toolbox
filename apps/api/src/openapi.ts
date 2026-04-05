// ─── OpenAPI 3.1 Specification for AXIS Toolbox API ─────────────

export interface OpenApiSpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact: { name: string; url: string };
  };
  servers: Array<{ url: string; description: string }>;
  paths: Record<string, unknown>;
  components: {
    securitySchemes: Record<string, unknown>;
    schemas: Record<string, unknown>;
  };
}

export function buildOpenApiSpec(): OpenApiSpec {
  return {
    openapi: "3.1.0",
    info: {
      title: "AXIS Toolbox API",
      version: "0.2.0",
      description:
        "AXIS Toolbox provides AI-powered code analysis, context mapping, and multi-program file generation. " +
        "Submit a codebase snapshot and AXIS produces tailored configuration files, analysis reports, and generator outputs across 17+ programs.",
      contact: {
        name: "AXIS Platform",
        url: "https://github.com/no-fate-platform/axis-toolbox",
      },
    },
    servers: [
      { url: "http://localhost:4000", description: "Local development" },
    ],
    paths: {
      // ── Health ──
      "/v1/health": {
        get: {
          summary: "Health check",
          operationId: "getHealth",
          tags: ["Health"],
          responses: {
            200: { description: "Service is healthy", content: jsonContent(ref("HealthResponse")) },
            503: { description: "Service is shutting down" },
          },
        },
      },

      // ── Snapshots ──
      "/v1/snapshots": {
        post: {
          summary: "Create a snapshot from uploaded files",
          operationId: "createSnapshot",
          tags: ["Snapshots"],
          requestBody: jsonBody(ref("CreateSnapshotRequest")),
          responses: {
            201: { description: "Snapshot created and processed", content: jsonContent(ref("SnapshotResponse")) },
            400: { description: "Validation error", content: jsonContent(ref("ErrorResponse")) },
            401: { description: "Invalid or revoked API key" },
            413: { description: "File count or size limit exceeded" },
            429: { description: "Rate limit or quota exceeded" },
          },
        },
      },
      "/v1/snapshots/{snapshot_id}": {
        get: {
          summary: "Get snapshot by ID",
          operationId: "getSnapshot",
          tags: ["Snapshots"],
          parameters: [pathParam("snapshot_id", "Snapshot identifier")],
          responses: {
            200: { description: "Snapshot details", content: jsonContent(ref("SnapshotDetail")) },
            404: { description: "Snapshot not found" },
          },
        },
      },

      // ── Projects ──
      "/v1/projects/{project_id}/context": {
        get: {
          summary: "Get context map and repo profile for latest project snapshot",
          operationId: "getProjectContext",
          tags: ["Projects"],
          parameters: [pathParam("project_id", "Project identifier")],
          responses: {
            200: { description: "Context and repo profile" },
            404: { description: "No snapshots for project" },
          },
        },
      },
      "/v1/projects/{project_id}/generated-files": {
        get: {
          summary: "Get all generated files for latest project snapshot",
          operationId: "getGeneratedFiles",
          tags: ["Projects"],
          parameters: [pathParam("project_id", "Project identifier")],
          responses: {
            200: { description: "Generated file listing" },
            404: { description: "No generated files available" },
          },
        },
      },
      "/v1/projects/{project_id}/generated-files/{file_path}": {
        get: {
          summary: "Get a specific generated file by path",
          operationId: "getGeneratedFile",
          tags: ["Projects"],
          parameters: [
            pathParam("project_id", "Project identifier"),
            pathParam("file_path", "File path within generated outputs"),
          ],
          responses: {
            200: { description: "Raw file content" },
            400: { description: "Invalid file path" },
            404: { description: "File not found" },
          },
        },
      },
      "/v1/projects/{project_id}/export": {
        get: {
          summary: "Export all generated files as a ZIP archive",
          operationId: "exportZip",
          tags: ["Projects"],
          parameters: [pathParam("project_id", "Project identifier")],
          responses: {
            200: { description: "ZIP archive", content: { "application/zip": { schema: { type: "string", format: "binary" } } } },
            404: { description: "No generated files" },
          },
        },
      },

      // ── Programs ──
      ...programEndpoints(),

      // ── GitHub ──
      "/v1/github/analyze": {
        post: {
          summary: "Create snapshot from a GitHub repository URL",
          operationId: "githubAnalyze",
          tags: ["GitHub"],
          requestBody: jsonBody(ref("GitHubAnalyzeRequest")),
          responses: {
            201: { description: "Snapshot created from GitHub repo" },
            400: { description: "Invalid GitHub URL" },
            404: { description: "Repository not found or inaccessible" },
          },
        },
      },

      // ── Search ──
      "/v1/search/index": {
        post: {
          summary: "Build search index for a snapshot's file contents",
          operationId: "searchIndex",
          tags: ["Search"],
          requestBody: jsonBody({ type: "object", required: ["snapshot_id"], properties: { snapshot_id: { type: "string" } } }),
          responses: {
            200: { description: "Index built", content: jsonContent(ref("SearchIndexResponse")) },
            404: { description: "Snapshot not found" },
          },
        },
      },
      "/v1/search/query": {
        post: {
          summary: "Search indexed file contents for a snapshot",
          operationId: "searchQuery",
          tags: ["Search"],
          requestBody: jsonBody(ref("SearchQueryRequest")),
          responses: {
            200: { description: "Search results", content: jsonContent(ref("SearchQueryResponse")) },
            400: { description: "Missing or invalid query" },
          },
        },
      },
      "/v1/search/{snapshot_id}/stats": {
        get: {
          summary: "Get search index statistics for a snapshot",
          operationId: "searchStats",
          tags: ["Search"],
          parameters: [pathParam("snapshot_id", "Snapshot identifier")],
          responses: {
            200: { description: "Index stats", content: jsonContent(ref("SearchStatsResponse")) },
          },
        },
      },
      "/v1/search/export": {
        post: {
          summary: "Export search program results for a snapshot",
          operationId: "searchExport",
          tags: ["Search"],
          requestBody: jsonBody({ type: "object", required: ["snapshot_id"], properties: { snapshot_id: { type: "string" } } }),
          responses: { 200: { description: "Search export results" }, 404: { description: "No results" } },
        },
      },

      // ── Programs listing ──
      "/v1/programs": {
        get: {
          summary: "List available programs and their outputs",
          operationId: "listPrograms",
          tags: ["Programs"],
          responses: {
            200: { description: "Program listing", content: jsonContent(ref("ProgramsListResponse")) },
          },
        },
      },

      // ── Account & Billing ──
      "/v1/accounts": {
        post: {
          summary: "Create a new account",
          operationId: "createAccount",
          tags: ["Billing"],
          requestBody: jsonBody(ref("CreateAccountRequest")),
          responses: { 201: { description: "Account created" }, 400: { description: "Validation error" } },
        },
      },
      "/v1/account": {
        get: {
          summary: "Get current account details (requires API key)",
          operationId: "getAccount",
          tags: ["Billing"],
          security: [{ apiKey: [] }],
          responses: { 200: { description: "Account details" }, 401: { description: "Invalid API key" } },
        },
      },
      "/v1/account/keys": {
        post: { summary: "Create a new API key", operationId: "createApiKey", tags: ["Billing"], responses: { 201: { description: "Key created" } } },
        get: { summary: "List API keys", operationId: "listApiKeys", tags: ["Billing"], responses: { 200: { description: "Key list" } } },
      },
      "/v1/account/keys/{key_id}/revoke": {
        post: {
          summary: "Revoke an API key",
          operationId: "revokeApiKey",
          tags: ["Billing"],
          parameters: [pathParam("key_id", "API key identifier")],
          responses: { 200: { description: "Key revoked" }, 404: { description: "Key not found" } },
        },
      },
      "/v1/account/usage": {
        get: { summary: "Get account usage summary", operationId: "getUsage", tags: ["Billing"], responses: { 200: { description: "Usage data" } } },
      },
      "/v1/account/tier": {
        post: { summary: "Update account tier", operationId: "updateTier", tags: ["Billing"], responses: { 200: { description: "Tier updated" } } },
      },
      "/v1/account/programs": {
        post: { summary: "Toggle program entitlements", operationId: "updatePrograms", tags: ["Billing"], responses: { 200: { description: "Programs updated" } } },
      },

      // ── Funnel & Seats ──
      "/v1/plans": {
        get: { summary: "List available plans and features", operationId: "getPlans", tags: ["Funnel"], responses: { 200: { description: "Plan listing" } } },
      },
      "/v1/account/seats": {
        post: { summary: "Invite a team member", operationId: "inviteSeat", tags: ["Funnel"], responses: { 201: { description: "Seat created" } } },
        get: { summary: "List team seats", operationId: "listSeats", tags: ["Funnel"], responses: { 200: { description: "Seat list" } } },
      },
      "/v1/account/seats/{seat_id}/accept": {
        post: { summary: "Accept a seat invitation", operationId: "acceptSeat", tags: ["Funnel"], parameters: [pathParam("seat_id", "Seat identifier")], responses: { 200: { description: "Seat accepted" } } },
      },
      "/v1/account/seats/{seat_id}/revoke": {
        post: { summary: "Revoke a seat", operationId: "revokeSeat", tags: ["Funnel"], parameters: [pathParam("seat_id", "Seat identifier")], responses: { 200: { description: "Seat revoked" } } },
      },
      "/v1/account/upgrade-prompt": {
        get: { summary: "Get personalized upgrade prompt", operationId: "getUpgradePrompt", tags: ["Funnel"], responses: { 200: { description: "Upgrade prompt data" } } },
      },
      "/v1/account/upgrade-prompt/dismiss": {
        post: { summary: "Dismiss upgrade prompt", operationId: "dismissUpgradePrompt", tags: ["Funnel"], responses: { 200: { description: "Dismissed" } } },
      },
      "/v1/account/funnel": {
        get: { summary: "Get funnel status for current account", operationId: "getFunnelStatus", tags: ["Funnel"], responses: { 200: { description: "Funnel status" } } },
      },
      "/v1/funnel/metrics": {
        get: { summary: "Get aggregate funnel metrics", operationId: "getFunnelMetrics", tags: ["Funnel"], responses: { 200: { description: "Funnel metrics" } } },
      },
    },
    components: {
      securitySchemes: {
        apiKey: {
          type: "apiKey",
          in: "header",
          name: "Authorization",
          description: "API key in Authorization header: `Bearer <api_key>`",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string", description: "Human-readable error message" },
            error_code: { type: "string", description: "Machine-readable error code" },
            request_id: { type: "string", description: "Unique request identifier" },
          },
          required: ["error", "error_code"],
        },
        HealthResponse: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["ok", "shutting_down"] },
            service: { type: "string" },
            version: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
          },
        },
        CreateSnapshotRequest: {
          type: "object",
          required: ["manifest", "files"],
          properties: {
            manifest: { $ref: "#/components/schemas/SnapshotManifest" },
            files: { type: "array", items: { $ref: "#/components/schemas/FileEntry" } },
            input_method: { type: "string", enum: ["api_submission", "github_url"] },
          },
        },
        SnapshotManifest: {
          type: "object",
          required: ["project_name", "project_type", "frameworks", "goals", "requested_outputs"],
          properties: {
            project_name: { type: "string" },
            project_type: { type: "string" },
            frameworks: { type: "array", items: { type: "string" } },
            goals: { type: "array", items: { type: "string" } },
            requested_outputs: { type: "array", items: { type: "string" } },
          },
        },
        FileEntry: {
          type: "object",
          required: ["path", "content"],
          properties: {
            path: { type: "string", description: "File path relative to project root" },
            content: { type: "string", description: "File content (UTF-8)" },
            size: { type: "integer", description: "File size in bytes (computed if omitted)" },
          },
        },
        SnapshotResponse: {
          type: "object",
          properties: {
            snapshot_id: { type: "string" },
            project_id: { type: "string" },
            status: { type: "string", enum: ["processing", "ready", "failed"] },
            context_map: { type: "object" },
            repo_profile: { type: "object" },
            generated_files: { type: "array", items: { type: "object", properties: { path: { type: "string" }, program: { type: "string" }, description: { type: "string" } } } },
          },
        },
        SnapshotDetail: {
          type: "object",
          properties: {
            snapshot_id: { type: "string" },
            project_id: { type: "string" },
            created_at: { type: "string", format: "date-time" },
            input_method: { type: "string" },
            manifest: { type: "object" },
            file_count: { type: "integer" },
            total_size_bytes: { type: "integer" },
            status: { type: "string" },
          },
        },
        GitHubAnalyzeRequest: {
          type: "object",
          required: ["github_url"],
          properties: {
            github_url: { type: "string", format: "uri", description: "GitHub repository URL (https://github.com/owner/repo)" },
          },
        },
        ProgramRequest: {
          type: "object",
          required: ["snapshot_id"],
          properties: {
            snapshot_id: { type: "string" },
            outputs: { type: "array", items: { type: "string" }, description: "Custom output file list (overrides defaults)" },
          },
        },
        SearchQueryRequest: {
          type: "object",
          required: ["snapshot_id", "query"],
          properties: {
            snapshot_id: { type: "string" },
            query: { type: "string", maxLength: 500 },
            limit: { type: "integer", minimum: 1, maximum: 200, default: 50 },
          },
        },
        SearchQueryResponse: {
          type: "object",
          properties: {
            snapshot_id: { type: "string" },
            query: { type: "string" },
            total_indexed_lines: { type: "integer" },
            total_indexed_files: { type: "integer" },
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  file_path: { type: "string" },
                  line_number: { type: "integer" },
                  content: { type: "string" },
                  rank: { type: "integer" },
                },
              },
            },
          },
        },
        SearchIndexResponse: {
          type: "object",
          properties: {
            snapshot_id: { type: "string" },
            indexed_files: { type: "integer" },
            indexed_lines: { type: "integer" },
          },
        },
        SearchStatsResponse: {
          type: "object",
          properties: {
            snapshot_id: { type: "string" },
            file_count: { type: "integer" },
            line_count: { type: "integer" },
          },
        },
        ProgramsListResponse: {
          type: "object",
          properties: {
            programs: { type: "array", items: { type: "object", properties: { name: { type: "string" }, outputs: { type: "array", items: { type: "string" } }, generator_count: { type: "integer" } } } },
            total_generators: { type: "integer" },
          },
        },
        CreateAccountRequest: {
          type: "object",
          required: ["name", "email"],
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
          },
        },
      },
    },
  };
}

// ─── Helpers ────────────────────────────────────────────────────

function ref(name: string) {
  return { $ref: `#/components/schemas/${name}` };
}

function jsonContent(schema: unknown) {
  return { "application/json": { schema } };
}

function jsonBody(schema: unknown) {
  return { required: true, content: jsonContent(schema) };
}

function pathParam(name: string, description: string) {
  return { name, in: "path", required: true, schema: { type: "string" }, description };
}

function programEndpoints(): Record<string, unknown> {
  const programs: Array<{ path: string; name: string; summary: string }> = [
    { path: "/v1/search/export", name: "searchExport", summary: "Run search program" },
    { path: "/v1/skills/generate", name: "skillsGenerate", summary: "Generate skills files (AGENTS.md, CLAUDE.md, etc.)" },
    { path: "/v1/debug/analyze", name: "debugAnalyze", summary: "Run debug analysis program" },
    { path: "/v1/frontend/audit", name: "frontendAudit", summary: "Run frontend audit program" },
    { path: "/v1/seo/analyze", name: "seoAnalyze", summary: "Run SEO analysis program" },
    { path: "/v1/optimization/analyze", name: "optimizationAnalyze", summary: "Run optimization analysis program" },
    { path: "/v1/theme/generate", name: "themeGenerate", summary: "Generate design theme tokens" },
    { path: "/v1/brand/generate", name: "brandGenerate", summary: "Generate brand guidelines" },
    { path: "/v1/superpowers/generate", name: "superpowersGenerate", summary: "Generate superpower pack" },
    { path: "/v1/marketing/generate", name: "marketingGenerate", summary: "Generate marketing assets" },
    { path: "/v1/notebook/generate", name: "notebookGenerate", summary: "Generate notebook/research files" },
    { path: "/v1/obsidian/analyze", name: "obsidianAnalyze", summary: "Generate Obsidian vault files" },
    { path: "/v1/mcp/provision", name: "mcpProvision", summary: "Provision MCP server config" },
    { path: "/v1/artifacts/generate", name: "artifactsGenerate", summary: "Generate code artifacts" },
    { path: "/v1/remotion/generate", name: "remotionGenerate", summary: "Generate Remotion video scripts" },
    { path: "/v1/canvas/generate", name: "canvasGenerate", summary: "Generate canvas/poster designs" },
    { path: "/v1/algorithmic/generate", name: "algorithmicGenerate", summary: "Generate algorithmic art" },
  ];

  const endpoints: Record<string, unknown> = {};
  for (const p of programs) {
    endpoints[p.path] = {
      post: {
        summary: p.summary,
        operationId: p.name,
        tags: ["Programs"],
        requestBody: jsonBody(ref("ProgramRequest")),
        responses: {
          200: { description: "Program output files" },
          400: { description: "Validation error" },
          404: { description: "No context for snapshot" },
        },
      },
    };
  }
  return endpoints;
}
