import type { ContextMap, RepoProfile } from "@axis/context-engine";
import type { GeneratedFile } from "./types.js";

// ─── mcp-config.json ────────────────────────────────────────────

export function generateMcpConfig(ctx: ContextMap, profile: RepoProfile): GeneratedFile {
  const id = ctx.project_identity;
  const frameworks = ctx.detection.frameworks.map(f => f.name);
  const pkgManagers = ctx.detection.package_managers;

  const tools: Array<{ name: string; description: string; category: string; enabled: boolean }> = [];

  // File system tools
  tools.push({
    name: "read_file",
    description: "Read source files from the project",
    category: "filesystem",
    enabled: true,
  });
  tools.push({
    name: "list_directory",
    description: "List directory contents",
    category: "filesystem",
    enabled: true,
  });
  tools.push({
    name: "search_files",
    description: "Search for files by pattern",
    category: "filesystem",
    enabled: true,
  });

  // Build tools
  const pkgMgr = pkgManagers.includes("pnpm") ? "pnpm" : pkgManagers.includes("yarn") ? "yarn" : "npm";
  tools.push({
    name: "run_build",
    description: `Execute ${pkgMgr} build`,
    category: "build",
    enabled: true,
  });
  tools.push({
    name: "run_tests",
    description: `Execute test suite via ${ctx.detection.test_frameworks[0] ?? pkgMgr + " test"}`,
    category: "build",
    enabled: true,
  });
  tools.push({
    name: "type_check",
    description: "Run TypeScript type checking (tsc --noEmit)",
    category: "build",
    enabled: id.primary_language === "TypeScript" || id.primary_language === "JavaScript",
  });

  // Git tools
  tools.push({
    name: "git_status",
    description: "Check repository status",
    category: "git",
    enabled: true,
  });
  tools.push({
    name: "git_diff",
    description: "Show changes in working directory",
    category: "git",
    enabled: true,
  });
  tools.push({
    name: "git_log",
    description: "Show recent commit history",
    category: "git",
    enabled: true,
  });

  // Framework-specific tools
  if (frameworks.includes("Next.js")) {
    tools.push({
      name: "nextjs_dev_server",
      description: "Start Next.js development server",
      category: "framework",
      enabled: true,
    });
  }
  if (frameworks.includes("Prisma")) {
    tools.push({
      name: "prisma_studio",
      description: "Open Prisma Studio for database management",
      category: "framework",
      enabled: true,
    });
  }

  const config = {
    mcpVersion: "1.0",
    project: id.name,
    generated_at: new Date().toISOString(),
    server: {
      name: `${id.name.toLowerCase().replace(/\s+/g, "-")}-mcp`,
      version: "0.1.0",
      description: `MCP server configuration for ${id.name}`,
    },
    capabilities: {
      tools: true,
      resources: true,
      prompts: true,
    },
    tools,
    resources: [
      {
        uri: `project://${id.name}/context-map`,
        name: "Context Map",
        description: "Full project context map with structure, detection, and AI context",
        mimeType: "application/json",
      },
      {
        uri: `project://${id.name}/repo-profile`,
        name: "Repository Profile",
        description: "Repository health profile with detection and goals",
        mimeType: "application/yaml",
      },
    ],
    prompts: [
      {
        name: "project-context",
        description: `Inject ${id.name} project context into the conversation`,
        arguments: [],
      },
      {
        name: "code-review",
        description: "Review code changes against project conventions",
        arguments: [{ name: "file_path", description: "Path to the file to review", required: true }],
      },
    ],
    security: {
      allowed_directories: ["."],
      denied_patterns: ["node_modules/**", ".env*", "*.key", "*.pem"],
      max_file_size_bytes: 1048576,
    },
  };

  return {
    path: "mcp-config.json",
    content: JSON.stringify(config, null, 2),
    content_type: "application/json",
    program: "mcp",
    description: "MCP server configuration with tools, resources, prompts, and security settings",
  };
}

// ─── connector-map.yaml ─────────────────────────────────────────

export function generateConnectorMap(ctx: ContextMap): GeneratedFile {
  const id = ctx.project_identity;
  const frameworks = ctx.detection.frameworks.map(f => f.name);
  const lines: string[] = [];

  lines.push("# Connector Map");
  lines.push(`# Project: ${id.name}`);
  lines.push(`# Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("connectors:");

  // IDE connectors
  lines.push("  - id: vscode");
  lines.push("    name: VS Code");
  lines.push("    type: ide");
  lines.push("    protocol: mcp");
  lines.push("    status: available");
  lines.push("    capabilities:");
  lines.push("      - file_editing");
  lines.push("      - terminal_execution");
  lines.push("      - diagnostics");
  lines.push("      - code_actions");

  lines.push("  - id: cursor");
  lines.push("    name: Cursor");
  lines.push("    type: ide");
  lines.push("    protocol: mcp");
  lines.push("    status: available");
  lines.push("    capabilities:");
  lines.push("      - file_editing");
  lines.push("      - terminal_execution");
  lines.push("      - ai_chat");

  // CI/CD connectors
  if (ctx.detection.ci_platform) {
    lines.push(`  - id: ci_${ctx.detection.ci_platform.toLowerCase().replace(/\s+/g, "_")}`);
    lines.push(`    name: ${ctx.detection.ci_platform}`);
    lines.push("    type: ci_cd");
    lines.push("    protocol: webhook");
    lines.push("    status: detected");
    lines.push("    capabilities:");
    lines.push("      - build_trigger");
    lines.push("      - test_execution");
    lines.push("      - deployment");
  }

  // Package registry connectors
  const pkgManagers = ctx.detection.package_managers;
  if (pkgManagers.includes("npm") || pkgManagers.includes("pnpm") || pkgManagers.includes("yarn")) {
    lines.push("  - id: npm_registry");
    lines.push("    name: npm Registry");
    lines.push("    type: package_registry");
    lines.push("    protocol: https");
    lines.push("    status: available");
    lines.push("    capabilities:");
    lines.push("      - package_publish");
    lines.push("      - version_check");
    lines.push("      - audit");
  }

  if (pkgManagers.includes("pip")) {
    lines.push("  - id: pypi");
    lines.push("    name: PyPI");
    lines.push("    type: package_registry");
    lines.push("    protocol: https");
    lines.push("    status: available");
    lines.push("    capabilities:");
    lines.push("      - package_publish");
    lines.push("      - version_check");
  }

  // Database connectors
  if (frameworks.includes("Prisma")) {
    lines.push("  - id: prisma_db");
    lines.push("    name: Prisma Database");
    lines.push("    type: database");
    lines.push("    protocol: prisma");
    lines.push("    status: detected");
    lines.push("    capabilities:");
    lines.push("      - schema_management");
    lines.push("      - migrations");
    lines.push("      - studio");
  }

  // Git connector
  lines.push("  - id: git");
  lines.push("    name: Git");
  lines.push("    type: version_control");
  lines.push("    protocol: git");
  lines.push("    status: available");
  lines.push("    capabilities:");
  lines.push("      - commit");
  lines.push("      - branch");
  lines.push("      - merge");
  lines.push("      - push");
  lines.push("");

  lines.push("integration_flows:");
  lines.push("  - name: development_loop");
  lines.push("    description: Standard development workflow");
  lines.push("    steps:");
  lines.push("      - connector: vscode");
  lines.push("        action: edit_files");
  lines.push("      - connector: vscode");
  lines.push("        action: run_tests");
  lines.push("      - connector: git");
  lines.push("        action: commit");
  if (ctx.detection.ci_platform) {
    lines.push(`      - connector: ci_${ctx.detection.ci_platform.toLowerCase().replace(/\s+/g, "_")}`);
    lines.push("        action: build_and_test");
  }
  lines.push("");

  return {
    path: "connector-map.yaml",
    content: lines.join("\n"),
    content_type: "text/yaml",
    program: "mcp",
    description: "Map of available connectors, integration protocols, and workflow flows",
  };
}

// ─── capability-registry.json ───────────────────────────────────

export function generateCapabilityRegistry(ctx: ContextMap): GeneratedFile {
  const id = ctx.project_identity;
  const testFws = ctx.detection.test_frameworks;
  const buildTools = ctx.detection.build_tools;
  const pkgManagers = ctx.detection.package_managers;
  const pkgMgr = pkgManagers.includes("pnpm") ? "pnpm" : pkgManagers.includes("yarn") ? "yarn" : "npm";

  const capabilities: Array<{
    id: string;
    name: string;
    category: string;
    provider: string;
    command: string;
    available: boolean;
  }> = [];

  // Build capabilities
  capabilities.push({
    id: "build",
    name: "Build Project",
    category: "build",
    provider: buildTools[0] ?? pkgMgr,
    command: `${pkgMgr} run build`,
    available: true,
  });

  capabilities.push({
    id: "dev",
    name: "Start Dev Server",
    category: "build",
    provider: buildTools.includes("vite") ? "vite" : pkgMgr,
    command: `${pkgMgr} run dev`,
    available: true,
  });

  // Test capabilities
  if (testFws.length > 0) {
    capabilities.push({
      id: "test",
      name: "Run Tests",
      category: "testing",
      provider: testFws[0],
      command: testFws.includes("vitest") ? "npx vitest run" : testFws.includes("jest") ? "npx jest" : `${pkgMgr} test`,
      available: true,
    });

    capabilities.push({
      id: "test_watch",
      name: "Run Tests (Watch)",
      category: "testing",
      provider: testFws[0],
      command: testFws.includes("vitest") ? "npx vitest" : testFws.includes("jest") ? "npx jest --watch" : `${pkgMgr} test -- --watch`,
      available: true,
    });
  }

  // Type checking
  if (id.primary_language === "TypeScript" || buildTools.includes("tsc")) {
    capabilities.push({
      id: "typecheck",
      name: "Type Check",
      category: "analysis",
      provider: "tsc",
      command: "npx tsc --noEmit",
      available: true,
    });
  }

  // Linting
  capabilities.push({
    id: "lint",
    name: "Lint Code",
    category: "analysis",
    provider: "eslint",
    command: `${pkgMgr} run lint`,
    available: buildTools.includes("eslint"),
  });

  // Format
  capabilities.push({
    id: "format",
    name: "Format Code",
    category: "analysis",
    provider: "prettier",
    command: `${pkgMgr} run format`,
    available: buildTools.includes("prettier"),
  });

  // Install
  capabilities.push({
    id: "install",
    name: "Install Dependencies",
    category: "setup",
    provider: pkgMgr,
    command: `${pkgMgr} install`,
    available: true,
  });

  // Git capabilities
  capabilities.push({
    id: "git_status",
    name: "Git Status",
    category: "version_control",
    provider: "git",
    command: "git status",
    available: true,
  });

  capabilities.push({
    id: "git_commit",
    name: "Git Commit",
    category: "version_control",
    provider: "git",
    command: "git add -A && git commit -m \"<message>\"",
    available: true,
  });

  const registry = {
    project: id.name,
    generated_at: new Date().toISOString(),
    total_capabilities: capabilities.length,
    categories: [...new Set(capabilities.map(c => c.category))],
    capabilities,
  };

  return {
    path: "capability-registry.json",
    content: JSON.stringify(registry, null, 2),
    content_type: "application/json",
    program: "mcp",
    description: "Registry of available project capabilities with commands and providers",
  };
}
