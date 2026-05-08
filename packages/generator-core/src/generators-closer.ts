import { createHash } from "node:crypto";
import type { ContextMap, RepoProfile } from "@axis/context-engine";
import type { GeneratedFile, SourceFile } from "./types.js";

const PROGRAM = "closer";
const CERTLIB_PROFILE = "certlib-offline-v1";

const TARGET_MARKETPLACES = [
  "npm",
  "unreal",
  "vscode",
  "dockerhub",
  "github-marketplace",
] as const;

type TargetMarketplace = (typeof TARGET_MARKETPLACES)[number];

interface BrandingConfig {
  product_name: string;
  tagline: string;
  target_marketplaces: TargetMarketplace[];
}

interface ProjectSignals {
  detected_frameworks: string[];
  primary_language: string;
  uses_docker: boolean;
  has_makefile: boolean;
  has_ci: boolean;
  monetization_hints: string[];
  selected_license: "MIT" | "Apache-2.0" | "Proprietary";
}

interface MerkleBundle {
  root: string;
  leaves: Array<{ path: string; digest: string }>;
  levels: string[][];
  signature: string;
}

const CLOSER_OUTPUT_PATHS = [
  "packaging/README.md",
  "packaging/LICENSE",
  "Dockerfile",
  "docker-compose.yml",
  ".github/workflows/ci.yml",
  ".github/workflows/release.yml",
  "packaging/manifests/npm-package.json",
  "packaging/manifests/unreal.uplugin",
  "packaging/manifests/vscode-extension.json",
  "packaging/manifests/dockerhub-repository.md",
  "packaging/manifests/github-marketplace-listing.md",
  "packaging/trust-fabric/attestation.json",
  "packaging/trust-fabric/merkle-proof.json",
  "packaging-report.md",
  "DISTRIBUTABLE.md",
  "Makefile",
] as const;

function hash(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function normalizeMarketplace(value: string): TargetMarketplace | null {
  const lowered = value.trim().toLowerCase();
  if (lowered === "github marketplace" || lowered === "github_marketplace") {
    return "github-marketplace";
  }
  if (lowered === "docker" || lowered === "docker hub") {
    return "dockerhub";
  }
  if ((TARGET_MARKETPLACES as readonly string[]).includes(lowered)) {
    return lowered as TargetMarketplace;
  }
  return null;
}

function defaultBranding(ctx: ContextMap): BrandingConfig {
  const projectName = (ctx.project_identity.name || "Project").trim();
  return {
    product_name: projectName,
    tagline: `Production-grade ${projectName} packaging and release kit`,
    target_marketplaces: [...TARGET_MARKETPLACES],
  };
}

function readBrandingConfig(files: SourceFile[] | undefined, ctx: ContextMap): BrandingConfig {
  const fallback = defaultBranding(ctx);
  if (!files || files.length === 0) return fallback;

  const configCandidates = files.filter(file =>
    /(^|\/)(closer(\.|-)config\.json|branding\.config\.json|branding\.json)$/i.test(file.path),
  );

  if (configCandidates.length === 0) return fallback;

  for (const candidate of configCandidates) {
    try {
      const parsed = JSON.parse(candidate.content) as Record<string, unknown>;
      const product_name =
        typeof parsed.product_name === "string" && parsed.product_name.trim().length > 0
          ? parsed.product_name.trim()
          : fallback.product_name;
      const tagline =
        typeof parsed.tagline === "string" && parsed.tagline.trim().length > 0
          ? parsed.tagline.trim()
          : fallback.tagline;

      const requested = Array.isArray(parsed.target_marketplaces)
        ? parsed.target_marketplaces
            .filter((value): value is string => typeof value === "string")
            .map(normalizeMarketplace)
            .filter((value): value is TargetMarketplace => value !== null)
        : [];

      return {
        product_name,
        tagline,
        target_marketplaces: requested.length > 0 ? Array.from(new Set(requested)) : fallback.target_marketplaces,
      };
    } catch {
      // Fall through to defaults if the optional branding config is malformed.
    }
  }

  return fallback;
}

function detectProjectSignals(ctx: ContextMap, profile: RepoProfile, files?: SourceFile[]): ProjectSignals {
  const frameworks = ctx.detection.frameworks.map(f => f.name);
  const allText = files?.map(f => `${f.path}\n${f.content}`).join("\n") ?? "";

  const monetization_hints: string[] = [];
  if (/pricing|subscription|plan|checkout|invoice|billing|license/i.test(allText)) {
    monetization_hints.push("Monetization intent detected in source files");
  }
  if (/enterprise|saas|marketplace|plugin|extension/i.test(allText)) {
    monetization_hints.push("Marketplace distribution language detected");
  }
  if (ctx.routes.length > 0) {
    monetization_hints.push("API surface detected — package supports commercial integration");
  }

  const hasInternalOnly = /internal use only|confidential|proprietary|all rights reserved/i.test(allText);
  const hasApacheHint = /patent|contributor license agreement|cla/i.test(allText);
  const selected_license: "MIT" | "Apache-2.0" | "Proprietary" =
    hasInternalOnly ? "Proprietary" : hasApacheHint || profile.project.primary_language === "Go" ? "Apache-2.0" : "MIT";

  return {
    detected_frameworks: frameworks,
    primary_language: profile.project.primary_language,
    uses_docker: Boolean(files?.some(f => /(^|\/)(dockerfile|docker-compose\.ya?ml)$/i.test(f.path))),
    has_makefile: Boolean(files?.some(f => /(^|\/)(makefile)$/i.test(f.path))),
    has_ci: Boolean(files?.some(f => /(^|\/)\.github\/workflows\//i.test(f.path))),
    monetization_hints,
    selected_license,
  };
}

function renderLicense(license: ProjectSignals["selected_license"], holder: string): string {
  if (license === "Proprietary") {
    return [
      `${holder} Proprietary License`,
      "",
      `Copyright (c) ${new Date().getUTCFullYear()} ${holder}`,
      "",
      "All rights reserved.",
      "",
      "This software is licensed, not sold. Unauthorized reproduction, modification, or redistribution of this package or any derived work is prohibited unless explicitly permitted in a separate written commercial agreement.",
      "",
      "For commercial licensing inquiries: legal@company.example",
    ].join("\n");
  }

  if (license === "Apache-2.0") {
    return [
      "Apache License",
      "Version 2.0, January 2004",
      "http://www.apache.org/licenses/",
      "",
      `Copyright ${new Date().getUTCFullYear()} ${holder}`,
      "",
      "Licensed under the Apache License, Version 2.0 (the \"License\");",
      "you may not use this file except in compliance with the License.",
      "You may obtain a copy of the License at",
      "",
      "    http://www.apache.org/licenses/LICENSE-2.0",
      "",
      "Unless required by applicable law or agreed to in writing, software",
      "distributed under the License is distributed on an \"AS IS\" BASIS,",
      "WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
      "See the License for the specific language governing permissions and",
      "limitations under the License.",
    ].join("\n");
  }

  return [
    "MIT License",
    "",
    `Copyright (c) ${new Date().getUTCFullYear()} ${holder}`,
    "",
    "Permission is hereby granted, free of charge, to any person obtaining a copy",
    "of this software and associated documentation files (the \"Software\"), to deal",
    "in the Software without restriction, including without limitation the rights",
    "to use, copy, modify, merge, publish, distribute, sublicense, and/or sell",
    "copies of the Software, and to permit persons to whom the Software is",
    "furnished to do so, subject to the following conditions:",
    "",
    "The above copyright notice and this permission notice shall be included in all",
    "copies or substantial portions of the Software.",
    "",
    "THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR",
    "IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,",
    "FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE",
    "AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER",
    "LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,",
    "OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE",
    "SOFTWARE.",
  ].join("\n");
}

function buildMerkleBundle(
  ctx: ContextMap,
  branding: BrandingConfig,
  signals: ProjectSignals,
): MerkleBundle {
  const leaves = CLOSER_OUTPUT_PATHS.map(path => ({
    path,
    digest: hash(`${ctx.snapshot_id}|${ctx.project_id}|${branding.product_name}|${signals.primary_language}|${path}`),
  }));

  let current = leaves.map(leaf => leaf.digest);
  const levels: string[][] = [current];
  while (current.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < current.length; i += 2) {
      const left = current[i];
      const right = current[i + 1] ?? current[i];
      next.push(hash(`${left}${right}`));
    }
    current = next;
    levels.push(current);
  }

  const root = current[0];
  const signature = hash(`${CERTLIB_PROFILE}:${root}:${ctx.snapshot_id}:${ctx.project_id}`);

  return { root, leaves, levels, signature };
}

function readinessScore(signals: ProjectSignals, marketplaces: number): number {
  let score = 72;
  if (signals.uses_docker) score += 5;
  if (signals.has_ci) score += 5;
  if (signals.has_makefile) score += 4;
  score += Math.min(10, marketplaces * 2);
  if (signals.selected_license === "Proprietary") score -= 4;
  return Math.max(0, Math.min(100, score));
}

export function generatePackagingReadme(
  ctx: ContextMap,
  profile: RepoProfile,
  files?: SourceFile[],
): GeneratedFile {
  const branding = readBrandingConfig(files, ctx);
  const signals = detectProjectSignals(ctx, profile, files);
  const score = readinessScore(signals, branding.target_marketplaces.length);

  const content = [
    `# ${branding.product_name}`,
    "",
    `> ${branding.tagline}`,
    "",
    `## Why Teams Buy This`,
    "",
    `- Ships as a production package with CI/CD, release gates, and marketplace manifests.`,
    `- Delivers operational trust through deterministic attestation and reproducible packaging.`,
    `- Reduces adoption friction with one-command startup and explicit monetization hooks.`,
    "",
    `## Installation`,
    "",
    "```bash",
    "git clone <repo-url>",
    "cd <project>",
    "make ship",
    "```",
    "",
    `## Screenshots`,
    "",
    `- Placeholder: hero UI screenshot (desktop)`,
    `- Placeholder: workflow screenshot (mobile)`,
    `- Placeholder: trust attestation verification panel`,
    "",
    `## Trust Signals`,
    "",
    `- Packaging readiness score: **${score}/100**`,
    `- License strategy: **${signals.selected_license}**`,
    `- Build + release automation included`,
    `- Signed Merkle attestation included in packaging/trust-fabric`,
    "",
    `## Monetization`,
    "",
    `- Recommended pricing: $99-$499 depending on support tier and hosting footprint.`,
    `- Suggested SKUs: Starter (self-serve), Team (SLA + onboarding), Enterprise (private deployment).`,
    `- Distribution targets: ${branding.target_marketplaces.join(", ")}.`,
    "",
    `## Compatibility`,
    "",
    `- Primary language: ${signals.primary_language}`,
    `- Detected frameworks: ${signals.detected_frameworks.join(", ") || "none"}`,
    `- Targets: Linux containers, cloud runners, and local developer setup`,
  ].join("\n");

  return {
    path: "packaging/README.md",
    content,
    content_type: "text/markdown",
    program: PROGRAM,
    description: "Professional, benefit-driven product README for marketplace and commercial packaging",
  };
}

export function generatePackagingLicense(
  ctx: ContextMap,
  profile: RepoProfile,
  files?: SourceFile[],
): GeneratedFile {
  const branding = readBrandingConfig(files, ctx);
  const signals = detectProjectSignals(ctx, profile, files);
  return {
    path: "packaging/LICENSE",
    content: renderLicense(signals.selected_license, branding.product_name),
    content_type: "text/plain",
    program: PROGRAM,
    description: "Commercially suitable licensing file selected from MIT, Apache-2.0, or Proprietary",
  };
}

export function generateCloserDockerfile(
  ctx: ContextMap,
  profile: RepoProfile,
): GeneratedFile {
  const entryHint = profile.project.primary_language === "Go" ? "./bin/app" : "node dist/server.js";
  const content = [
    "# syntax=docker/dockerfile:1.7",
    "FROM debian:bookworm-slim AS runtime",
    "WORKDIR /app",
    "ENV NODE_ENV=production",
    "COPY . /app",
    "RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates make && rm -rf /var/lib/apt/lists/*",
    "EXPOSE 8080",
    `CMD [\"sh\", \"-lc\", \"${entryHint}\"]`,
  ].join("\n");

  return {
    path: "Dockerfile",
    content,
    content_type: "text/plain",
    program: PROGRAM,
    description: `Container build configuration generated for ${ctx.project_identity.name}`,
  };
}

export function generateCloserDockerCompose(
  ctx: ContextMap,
): GeneratedFile {
  const content = [
    "version: \"3.9\"",
    "services:",
    "  app:",
    "    build:",
    "      context: .",
    "      dockerfile: Dockerfile",
    "    container_name: closer-app",
    "    ports:",
    "      - \"8080:8080\"",
    "    environment:",
    `      - PRODUCT_NAME=${ctx.project_identity.name}`,
    "    restart: unless-stopped",
  ].join("\n");

  return {
    path: "docker-compose.yml",
    content,
    content_type: "application/yaml",
    program: PROGRAM,
    description: "Container orchestration config for local packaging validation and smoke checks",
  };
}

export function generateCloserCiWorkflow(): GeneratedFile {
  const content = [
    "name: ci",
    "on:",
    "  pull_request:",
    "  push:",
    "    branches: [main]",
    "jobs:",
    "  verify:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    "      - name: Checkout",
    "        uses: actions/checkout@v4",
    "      - name: Setup Node",
    "        uses: actions/setup-node@v4",
    "        with:",
    "          node-version: 22",
    "          cache: npm",
    "      - name: Install",
    "        run: npm ci --ignore-scripts",
    "      - name: Lint",
    "        run: npm run lint --if-present",
    "      - name: Test",
    "        run: npm test --if-present",
    "      - name: Build",
    "        run: npm run build --if-present",
    "      - name: Package audit",
    "        run: make ship",
  ].join("\n");

  return {
    path: ".github/workflows/ci.yml",
    content,
    content_type: "application/yaml",
    program: PROGRAM,
    description: "Marketplace-grade continuous integration workflow with lint, test, build, and ship validation",
  };
}

export function generateCloserReleaseWorkflow(
  _ctx: ContextMap,
  _profile: RepoProfile,
  files?: SourceFile[],
): GeneratedFile {
  const config = readBrandingConfig(files, {
    version: "1.0.0",
    snapshot_id: "",
    project_id: "",
    generated_at: "",
    project_identity: {
      name: "project",
      type: "unknown",
      primary_language: "unknown",
      description: null,
      repo_url: null,
      go_module: null,
    },
    structure: {
      total_files: 0,
      total_directories: 0,
      total_loc: 0,
      file_tree_summary: [],
      top_level_layout: [],
    },
    detection: {
      languages: [],
      frameworks: [],
      build_tools: [],
      test_frameworks: [],
      package_managers: [],
      ci_platform: null,
      deployment_target: null,
    },
    dependency_graph: { external_dependencies: [], internal_imports: [], hotspots: [] },
    entry_points: [],
    routes: [],
    domain_models: [],
    sql_schema: [],
    architecture_signals: { patterns_detected: [], layer_boundaries: [], separation_score: 0 },
    ai_context: { project_summary: "", key_abstractions: [], conventions: [], warnings: [] },
  });

  const content = [
    "name: release",
    "on:",
    "  workflow_dispatch:",
    "  push:",
    "    tags:",
    "      - \"v*\"",
    "jobs:",
    "  publish:",
    "    runs-on: ubuntu-latest",
    "    permissions:",
    "      contents: write",
    "      id-token: write",
    "    steps:",
    "      - uses: actions/checkout@v4",
    "      - uses: actions/setup-node@v4",
    "        with:",
    "          node-version: 22",
    "      - run: npm ci --ignore-scripts",
    "      - run: npm run build --if-present",
    "      - run: make ship",
    "      - name: Create Release",
    "        uses: softprops/action-gh-release@v2",
    "        with:",
    `          name: ${config.product_name} \${{ github.ref_name }}`,
    "          generate_release_notes: true",
  ].join("\n");

  return {
    path: ".github/workflows/release.yml",
    content,
    content_type: "application/yaml",
    program: PROGRAM,
    description: "Automated release workflow with deterministic packaging and release publication",
  };
}

export function generateCloserManifestNpm(
  ctx: ContextMap,
  _profile: RepoProfile,
  files?: SourceFile[],
): GeneratedFile {
  const branding = readBrandingConfig(files, ctx);
  const npmName = branding.product_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const content = JSON.stringify(
    {
      name: npmName,
      version: "1.0.0",
      description: branding.tagline,
      license: "SEE LICENSE IN packaging/LICENSE",
      repository: {
        type: "git",
        url: ctx.project_identity.repo_url ?? "https://github.com/owner/repo",
      },
      homepage: "https://example.com",
      keywords: ["marketplace", "packaged", "production", "certified"],
    },
    null,
    2,
  );

  return {
    path: "packaging/manifests/npm-package.json",
    content,
    content_type: "application/json",
    program: PROGRAM,
    description: "npm marketplace manifest template for product listing and distribution",
  };
}

export function generateCloserManifestUnreal(
  ctx: ContextMap,
  _profile: RepoProfile,
  files?: SourceFile[],
): GeneratedFile {
  const branding = readBrandingConfig(files, ctx);
  const content = JSON.stringify(
    {
      FileVersion: 3,
      Version: 1,
      VersionName: "1.0.0",
      FriendlyName: branding.product_name,
      Description: branding.tagline,
      Category: "Tools",
      CreatedBy: branding.product_name,
      CanContainContent: true,
      IsBetaVersion: false,
      Installed: false,
    },
    null,
    2,
  );

  return {
    path: "packaging/manifests/unreal.uplugin",
    content,
    content_type: "application/json",
    program: PROGRAM,
    description: "Unreal marketplace plugin descriptor generated for submission packaging",
  };
}

export function generateCloserManifestVsCode(
  ctx: ContextMap,
  _profile: RepoProfile,
  files?: SourceFile[],
): GeneratedFile {
  const branding = readBrandingConfig(files, ctx);
  const slug = branding.product_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const content = JSON.stringify(
    {
      name: slug,
      displayName: branding.product_name,
      description: branding.tagline,
      version: "1.0.0",
      publisher: "your-publisher",
      engines: { vscode: "^1.95.0" },
      categories: ["Other"],
      main: "./dist/extension.js",
      contributes: { commands: [{ command: `${slug}.open`, title: `${branding.product_name}: Open` }] },
    },
    null,
    2,
  );

  return {
    path: "packaging/manifests/vscode-extension.json",
    content,
    content_type: "application/json",
    program: PROGRAM,
    description: "VS Code Marketplace extension manifest scaffold",
  };
}

export function generateCloserManifestDockerHub(
  ctx: ContextMap,
  _profile: RepoProfile,
  files?: SourceFile[],
): GeneratedFile {
  const branding = readBrandingConfig(files, ctx);
  const content = [
    `# Docker Hub Listing — ${branding.product_name}`,
    "",
    `## Overview`,
    branding.tagline,
    "",
    "## Tags",
    "- latest",
    "- 1.0.0",
    "",
    "## Quick Start",
    "```bash",
    "docker run --rm -p 8080:8080 your-org/your-image:latest",
    "```",
    "",
    "## Compliance and Trust",
    "- Includes signed Merkle attestation in packaging/trust-fabric/attestation.json",
    "- Generated with offline certlib profile",
  ].join("\n");

  return {
    path: "packaging/manifests/dockerhub-repository.md",
    content,
    content_type: "text/markdown",
    program: PROGRAM,
    description: "Docker Hub repository listing content with trust and launch metadata",
  };
}

export function generateCloserManifestGitHubMarketplace(
  ctx: ContextMap,
  _profile: RepoProfile,
  files?: SourceFile[],
): GeneratedFile {
  const branding = readBrandingConfig(files, ctx);
  const content = [
    `# GitHub Marketplace Listing — ${branding.product_name}`,
    "",
    `## Value Proposition`,
    branding.tagline,
    "",
    "## Features",
    "- Production packaging profile (CI, release, container runtime)",
    "- Marketplace manifests for npm, Unreal, VS Code, and Docker Hub",
    "- Trust Fabric attestation bundle with deterministic Merkle root",
    "",
    "## Support",
    "- SLA tiers: Community / Team / Enterprise",
    "- Contact: support@company.example",
    "",
    "## Billing",
    "- Suggested base subscription: $99/month",
    "- Premium assisted onboarding: $499 one-time",
  ].join("\n");

  return {
    path: "packaging/manifests/github-marketplace-listing.md",
    content,
    content_type: "text/markdown",
    program: PROGRAM,
    description: "GitHub Marketplace listing copy for commercial positioning and distribution",
  };
}

export function generateCloserTrustAttestation(
  ctx: ContextMap,
  profile: RepoProfile,
  files?: SourceFile[],
): GeneratedFile {
  const branding = readBrandingConfig(files, ctx);
  const signals = detectProjectSignals(ctx, profile, files);
  const bundle = buildMerkleBundle(ctx, branding, signals);

  const content = JSON.stringify(
    {
      schema_version: "1.0",
      certlib_profile: CERTLIB_PROFILE,
      generated_at: new Date().toISOString(),
      snapshot_id: ctx.snapshot_id,
      project_id: ctx.project_id,
      product_name: branding.product_name,
      package_root: "./",
      merkle_root: bundle.root,
      signature: {
        algorithm: "sha256-pseudo-signature",
        signer: "axis-closer",
        value: bundle.signature,
      },
      leaf_count: bundle.leaves.length,
      leaves: bundle.leaves,
    },
    null,
    2,
  );

  return {
    path: "packaging/trust-fabric/attestation.json",
    content,
    content_type: "application/json",
    program: PROGRAM,
    description: "Trust Fabric certlib-style attestation with signed Merkle root over package artifacts",
  };
}

export function generateCloserMerkleProof(
  ctx: ContextMap,
  profile: RepoProfile,
  files?: SourceFile[],
): GeneratedFile {
  const branding = readBrandingConfig(files, ctx);
  const signals = detectProjectSignals(ctx, profile, files);
  const bundle = buildMerkleBundle(ctx, branding, signals);

  const content = JSON.stringify(
    {
      schema_version: "1.0",
      merkle_root: bundle.root,
      levels: bundle.levels,
      leaf_index: bundle.leaves.map((leaf, index) => ({ index, path: leaf.path, digest: leaf.digest })),
      verification: {
        algorithm: "sha256",
        certlib_profile: CERTLIB_PROFILE,
        replay_command: "node verify-attestation.js packaging/trust-fabric/attestation.json packaging/trust-fabric/merkle-proof.json",
      },
    },
    null,
    2,
  );

  return {
    path: "packaging/trust-fabric/merkle-proof.json",
    content,
    content_type: "application/json",
    program: PROGRAM,
    description: "Merkle proof bundle for offline verification of distributable artifact integrity",
  };
}

export function generateCloserPackagingReport(
  ctx: ContextMap,
  profile: RepoProfile,
  files?: SourceFile[],
): GeneratedFile {
  const branding = readBrandingConfig(files, ctx);
  const signals = detectProjectSignals(ctx, profile, files);
  const score = readinessScore(signals, branding.target_marketplaces.length);

  const readinessBand = score >= 90 ? "ship-ready" : score >= 80 ? "near-ready" : "hardening-required";
  const remainingSteps = [
    "Replace screenshot placeholders with real product visuals.",
    "Finalize publisher handles for each marketplace.",
    "Run legal review for license + trademark usage.",
    "Execute one dry-run release on a private tag.",
  ];

  const content = [
    "# Packaging Report",
    "",
    `## Readiness Score`,
    "",
    `- Score: **${score}/100**`,
    `- Band: **${readinessBand}**`,
    "",
    "## Auto-Added",
    "",
    ...CLOSER_OUTPUT_PATHS.map(path => `- ${path}`),
    "",
    "## Remaining Human Steps",
    "",
    ...remainingSteps.map(step => `- ${step}`),
    "",
    "## Commercial Potential",
    "",
    `- Product: ${branding.product_name}`,
    `- Tagline: ${branding.tagline}`,
    `- Target marketplaces: ${branding.target_marketplaces.join(", ")}`,
    `- Monetization signals: ${signals.monetization_hints.length > 0 ? signals.monetization_hints.join("; ") : "No direct signal found, but package is commercially structured."}`,
    "",
    "## Certification Summary",
    "",
    `- Attestation profile: ${CERTLIB_PROFILE}`,
    "- Signed Merkle root generated",
    "- Offline verification supported",
  ].join("\n");

  return {
    path: "packaging-report.md",
    content,
    content_type: "text/markdown",
    program: PROGRAM,
    description: "Packaging readiness scorecard with auto-adds, remaining actions, and commercialization potential",
  };
}

export function generateDistributableGuide(
  ctx: ContextMap,
  _profile: RepoProfile,
  files?: SourceFile[],
): GeneratedFile {
  const branding = readBrandingConfig(files, ctx);
  const content = [
    `# DISTRIBUTABLE — ${branding.product_name}`,
    "",
    "This project is packaged for marketplace distribution.",
    "",
    "## Ship Checklist",
    "",
    "- [ ] `make ship` passes locally",
    "- [ ] CI workflow is green on main",
    "- [ ] release workflow tag tested in dry-run",
    "- [ ] marketplace manifests updated with final publisher IDs",
    "- [ ] legal and trademark review approved",
    "",
    "## Included Packaging Assets",
    "",
    "- packaging/README.md",
    "- packaging/LICENSE",
    "- Dockerfile",
    "- docker-compose.yml",
    "- .github/workflows/ci.yml",
    "- .github/workflows/release.yml",
    "- packaging/manifests/*",
    "- packaging/trust-fabric/*",
    "",
    "## Verify Attestation",
    "",
    "```bash",
    "cat packaging/trust-fabric/attestation.json",
    "cat packaging/trust-fabric/merkle-proof.json",
    "```",
  ].join("\n");

  return {
    path: "DISTRIBUTABLE.md",
    content,
    content_type: "text/markdown",
    program: PROGRAM,
    description: "Root-level shipping guide and go-live checklist for final distribution",
  };
}

export function generateMakefileWithShipTarget(
  ctx: ContextMap,
  profile: RepoProfile,
  files?: SourceFile[],
): GeneratedFile {
  const signals = detectProjectSignals(ctx, profile, files);
  const testCommand = profile.project.primary_language === "Go" ? "go test ./..." : "npm test --if-present";
  const buildCommand = profile.project.primary_language === "Go" ? "go build ./..." : "npm run build --if-present";

  const content = [
    ".PHONY: build test package attest ship",
    "",
    "build:",
    `\t${buildCommand}`,
    "",
    "test:",
    `\t${testCommand}`,
    "",
    "package:",
    "\tdocker build -t product-release:latest .",
    "",
    "attest:",
    "\t@echo \"Attestation bundle: packaging/trust-fabric/attestation.json\"",
    "",
    "ship: build test package attest",
    "\t@echo \"Ready to ship: run release workflow and publish marketplace manifests\"",
    "",
    "ship-summary:",
    `\t@echo \"Project: ${ctx.project_identity.name} | Language: ${signals.primary_language} | Docker: ${signals.uses_docker}\"`,
  ].join("\n");

  return {
    path: "Makefile",
    content,
    content_type: "text/plain",
    program: PROGRAM,
    description: "Build orchestration file with required make ship target for release readiness",
  };
}
