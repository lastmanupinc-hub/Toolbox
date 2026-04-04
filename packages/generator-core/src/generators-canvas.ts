import type { ContextMap, RepoProfile } from "@axis/context-engine";
import type { GeneratedFile } from "./types.js";

// ─── canvas-spec.json ───────────────────────────────────────────

export function generateCanvasSpec(ctx: ContextMap, profile: RepoProfile): GeneratedFile {
  const id = ctx.project_identity;
  const frameworks = ctx.detection.frameworks.map(f => f.name);
  const languages = ctx.detection.languages;

  const brandColors = {
    primary: "#6366f1",
    secondary: "#8b5cf6",
    accent: "#06b6d4",
    background: "#0f172a",
    surface: "#1e293b",
    text: "#f8fafc",
    muted: "#94a3b8",
  };

  const spec = {
    project: id.name,
    generated_at: new Date().toISOString(),
    design_system: {
      colors: brandColors,
      typography: {
        heading: { family: "Inter", weight: 700, sizes: [48, 36, 28, 24] },
        body: { family: "Inter", weight: 400, sizes: [16, 14, 12] },
        code: { family: "JetBrains Mono", weight: 400, sizes: [14, 12] },
      },
      spacing: { unit: 8, scale: [4, 8, 12, 16, 24, 32, 48, 64] },
      border_radius: { sm: 4, md: 8, lg: 12, xl: 16 },
    },
    templates: [
      {
        id: "social-og",
        name: "Open Graph Image",
        width: 1200,
        height: 630,
        use_case: "Social media sharing (Twitter, LinkedIn, Facebook)",
        layers: ["background", "logo", "title", "subtitle", "tech-badges"],
      },
      {
        id: "social-square",
        name: "Square Social Post",
        width: 1080,
        height: 1080,
        use_case: "Instagram, social media feeds",
        layers: ["background", "header", "stats-grid", "footer"],
      },
      {
        id: "poster-a4",
        name: "A4 Poster",
        width: 2480,
        height: 3508,
        use_case: "Print-ready poster, presentations",
        layers: ["background", "hero", "architecture-diagram", "stats", "footer"],
      },
      {
        id: "banner-wide",
        name: "Wide Banner",
        width: 1920,
        height: 480,
        use_case: "GitHub readme, website hero",
        layers: ["background", "gradient", "title", "description", "badges"],
      },
    ],
    data_bindings: {
      title: id.name,
      subtitle: id.description,
      type: id.type,
      language: id.primary_language,
      frameworks,
      language_stats: languages.map(l => ({ name: l.name, percent: l.loc_percent })),
      architecture_score: ctx.architecture_signals.separation_score,
      patterns: ctx.architecture_signals.patterns_detected,
      entry_point_count: ctx.entry_points.length,
      hotspot_count: ctx.dependency_graph.hotspots.length,
    },
  };

  return {
    path: "canvas-spec.json",
    content: JSON.stringify(spec, null, 2),
    content_type: "application/json",
    program: "canvas",
    description: "Canvas design specification with templates, design system, and data bindings",
  };
}

// ─── social-pack.md ─────────────────────────────────────────────

export function generateSocialPack(ctx: ContextMap): GeneratedFile {
  const id = ctx.project_identity;
  const frameworks = ctx.detection.frameworks.map(f => f.name);
  const languages = ctx.detection.languages;

  const lines: string[] = [];

  lines.push(`# Social Pack — ${id.name}`);
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  lines.push("## Open Graph Image (1200×630)");
  lines.push("");
  lines.push("### Layout");
  lines.push("```");
  lines.push("┌──────────────────────────────────────────┐");
  lines.push("│  [gradient background]                    │");
  lines.push("│                                           │");
  lines.push(`│     ${id.name}                            │`);
  lines.push(`│     ${(id.description ?? "").slice(0, 50)}...     │`);
  lines.push("│                                           │");
  lines.push(`│     [${frameworks.slice(0, 4).join("] [")}]    │`);
  lines.push("│                                           │");
  lines.push("│     Powered by AXIS Toolbox               │");
  lines.push("└──────────────────────────────────────────┘");
  lines.push("```");
  lines.push("");

  lines.push("### Copy Variants");
  lines.push("");
  lines.push(`1. **Technical**: "${id.name} — ${id.type} built with ${id.primary_language}"`);
  lines.push(`2. **Marketing**: "${id.name}: ${id.description}"`);
  lines.push(`3. **Minimal**: "${id.name}"`);
  lines.push("");

  lines.push("## Square Post (1080×1080)");
  lines.push("");
  lines.push("### Content");
  lines.push("");
  lines.push("| Stat | Value |");
  lines.push("|------|-------|");
  for (const lang of languages.slice(0, 3)) {
    lines.push(`| ${lang.name} | ${lang.loc_percent}% |`);
  }
  lines.push(`| Frameworks | ${frameworks.length} |`);
  lines.push(`| Architecture Score | ${ctx.architecture_signals.separation_score}/100 |`);
  lines.push("");

  lines.push("## Twitter/X Card");
  lines.push("");
  lines.push("### Thread Template");
  lines.push("");
  lines.push(`🧵 1/ Just analyzed ${id.name} with @AxisToolbox`);
  lines.push("");
  lines.push(`📊 2/ Tech stack: ${frameworks.slice(0, 3).join(", ") || id.primary_language}`);
  lines.push(`Architecture score: ${ctx.architecture_signals.separation_score}/100`);
  lines.push("");
  lines.push(`🔍 3/ Found ${ctx.entry_points.length} entry points and ${ctx.dependency_graph.hotspots.length} hotspots`);
  lines.push("");
  lines.push(`🎯 4/ Key patterns: ${ctx.architecture_signals.patterns_detected.slice(0, 3).join(", ") || "Custom architecture"}`);
  lines.push("");

  lines.push("## LinkedIn Post");
  lines.push("");
  lines.push(`📋 Project Analysis: ${id.name}`);
  lines.push("");
  lines.push(`I ran ${id.name} through AXIS Toolbox and here's what it found:`);
  lines.push("");
  lines.push(`• Type: ${id.type}`);
  lines.push(`• Primary Language: ${id.primary_language}`);
  lines.push(`• Frameworks: ${frameworks.join(", ") || "None"}`);
  lines.push(`• Architecture Score: ${ctx.architecture_signals.separation_score}/100`);
  lines.push("");

  return {
    path: "social-pack.md",
    content: lines.join("\n"),
    content_type: "text/markdown",
    program: "canvas",
    description: "Social media templates with layouts, copy variants, and thread templates",
  };
}

// ─── poster-layouts.md ──────────────────────────────────────────

export function generatePosterLayouts(ctx: ContextMap): GeneratedFile {
  const id = ctx.project_identity;
  const frameworks = ctx.detection.frameworks.map(f => f.name);
  const languages = ctx.detection.languages;
  const patterns = ctx.architecture_signals.patterns_detected;
  const layers = ctx.architecture_signals.layer_boundaries;

  const lines: string[] = [];

  lines.push(`# Poster Layouts — ${id.name}`);
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  lines.push("## Layout A: Tech Overview (A4 Portrait)");
  lines.push("");
  lines.push("### Zones");
  lines.push("```");
  lines.push("┌─────────────────────────┐");
  lines.push("│      HERO ZONE          │  ← Project name, logo, tagline");
  lines.push("│                         │");
  lines.push("├─────────────────────────┤");
  lines.push("│  STATS    │  LANGUAGE   │  ← Key metrics, language pie chart");
  lines.push("│  GRID     │  BREAKDOWN  │");
  lines.push("├─────────────────────────┤");
  lines.push("│      ARCHITECTURE       │  ← Patterns, layers, score");
  lines.push("│      DIAGRAM            │");
  lines.push("├─────────────────────────┤");
  lines.push("│  FRAMEWORK BADGES       │  ← Tech stack badges");
  lines.push("├─────────────────────────┤");
  lines.push("│      FOOTER             │  ← AXIS branding, date");
  lines.push("└─────────────────────────┘");
  lines.push("```");
  lines.push("");

  lines.push("### Data for Zones");
  lines.push("");
  lines.push("**Hero Zone**");
  lines.push(`- Title: ${id.name}`);
  lines.push(`- Subtitle: ${id.description}`);
  lines.push(`- Type Badge: ${id.type}`);
  lines.push("");
  lines.push("**Stats Grid**");
  lines.push(`- Entry Points: ${ctx.entry_points.length}`);
  lines.push(`- Hotspots: ${ctx.dependency_graph.hotspots.length}`);
  lines.push(`- Architecture Score: ${ctx.architecture_signals.separation_score}/100`);
  lines.push(`- Dependencies: ${ctx.dependency_graph.external_dependencies.length}`);
  lines.push("");
  lines.push("**Language Breakdown**");
  for (const lang of languages) {
    lines.push(`- ${lang.name}: ${lang.loc_percent}% (${lang.loc} LOC)`);
  }
  lines.push("");

  if (patterns.length > 0 || layers.length > 0) {
    lines.push("**Architecture Diagram**");
    if (patterns.length > 0) {
      lines.push(`- Patterns: ${patterns.join(", ")}`);
    }
    if (layers.length > 0) {
      for (const l of layers) {
        lines.push(`- ${l.layer}: ${l.directories.join(", ")}`);
      }
    }
    lines.push("");
  }

  lines.push("**Framework Badges**");
  for (const fw of frameworks) {
    lines.push(`- ${fw}`);
  }
  lines.push("");

  lines.push("## Layout B: Minimal Card (Landscape)");
  lines.push("");
  lines.push("### Zones");
  lines.push("```");
  lines.push("┌──────────────────────────────────────────┐");
  lines.push("│  LOGO  │  PROJECT NAME & TYPE  │  SCORE  │");
  lines.push("│        │  Framework badges      │  ##/100 │");
  lines.push("└──────────────────────────────────────────┘");
  lines.push("```");
  lines.push("");
  lines.push(`- Name: ${id.name}`);
  lines.push(`- Type: ${id.type}`);
  lines.push(`- Score: ${ctx.architecture_signals.separation_score}/100`);
  lines.push(`- Badges: ${frameworks.join(", ") || id.primary_language}`);
  lines.push("");

  lines.push("## Layout C: Data Dashboard");
  lines.push("");
  lines.push("### Zones");
  lines.push("```");
  lines.push("┌────────────┬────────────┬────────────┐");
  lines.push("│  LANGUAGES │ FRAMEWORKS │  HOTSPOTS  │");
  lines.push("│  pie chart │   list     │   table    │");
  lines.push("├────────────┴────────────┴────────────┤");
  lines.push("│         DEPENDENCY GRAPH              │");
  lines.push("│         (node visualization)          │");
  lines.push("└──────────────────────────────────────┘");
  lines.push("```");
  lines.push("");

  return {
    path: "poster-layouts.md",
    content: lines.join("\n"),
    content_type: "text/markdown",
    program: "canvas",
    description: "Poster layout templates with zones, data bindings, and visual structure",
  };
}

// ─── asset-guidelines.md ────────────────────────────────────────

export function generateCanvasAssetGuidelines(ctx: ContextMap): GeneratedFile {
  const id = ctx.project_identity;
  const frameworks = ctx.detection.frameworks.map(f => f.name);

  const lines: string[] = [];

  lines.push(`# Asset Guidelines — ${id.name}`);
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  lines.push("## Color System");
  lines.push("");
  lines.push("| Role | Hex | Usage |");
  lines.push("|------|-----|-------|");
  lines.push("| Primary | #6366f1 | CTAs, links, active states |");
  lines.push("| Secondary | #8b5cf6 | Gradients, accents |");
  lines.push("| Accent | #06b6d4 | Highlights, badges |");
  lines.push("| Background | #0f172a | Dark canvas base |");
  lines.push("| Surface | #1e293b | Cards, panels |");
  lines.push("| Text | #f8fafc | Primary text |");
  lines.push("| Muted | #94a3b8 | Secondary text, labels |");
  lines.push("");

  lines.push("## Typography");
  lines.push("");
  lines.push("| Level | Font | Weight | Size |");
  lines.push("|-------|------|--------|------|");
  lines.push("| H1 | Inter | 700 | 48px |");
  lines.push("| H2 | Inter | 700 | 36px |");
  lines.push("| H3 | Inter | 700 | 28px |");
  lines.push("| Body | Inter | 400 | 16px |");
  lines.push("| Code | JetBrains Mono | 400 | 14px |");
  lines.push("| Caption | Inter | 400 | 12px |");
  lines.push("");

  lines.push("## Icon & Badge Rules");
  lines.push("");
  lines.push("- Framework badges: pill shape, accent background, white text");
  lines.push("- Stat icons: 24×24, stroke style, muted color");
  lines.push("- Logo: SVG preferred, minimum 32×32 display size");
  lines.push("- Separator lines: 1px, muted color, 50% opacity");
  lines.push("");

  lines.push("## Required Assets");
  lines.push("");
  lines.push("### Logos & Icons");
  lines.push(`- [ ] ${id.name} logo (SVG, light + dark variants)`);
  lines.push("- [ ] AXIS Toolbox watermark (SVG, low opacity)");
  for (const fw of frameworks.slice(0, 6)) {
    lines.push(`- [ ] ${fw} icon (SVG or PNG)`);
  }
  lines.push("");

  lines.push("### Backgrounds");
  lines.push("- [ ] Dark gradient (primary → secondary, 135deg)");
  lines.push("- [ ] Noise texture overlay (PNG, 5% opacity)");
  lines.push("- [ ] Grid pattern (SVG, muted color, 10% opacity)");
  lines.push("");

  lines.push("## Export Specifications");
  lines.push("");
  lines.push("| Format | DPI | Color Space | Use Case |");
  lines.push("|--------|-----|-------------|----------|");
  lines.push("| PNG | 72 | sRGB | Web, social media |");
  lines.push("| PNG | 300 | sRGB | Print |");
  lines.push("| SVG | — | sRGB | Scalable assets |");
  lines.push("| WebP | 72 | sRGB | Web (optimized) |");
  lines.push("| PDF | 300 | CMYK | Print-ready |");
  lines.push("");

  lines.push("## Spacing & Layout");
  lines.push("");
  lines.push("- Base unit: 8px");
  lines.push("- Margins: 32px (desktop), 16px (social)");
  lines.push("- Card padding: 24px");
  lines.push("- Badge padding: 8px 16px");
  lines.push("- Section gap: 32px");
  lines.push("- Border radius: 8px (cards), 4px (badges)");
  lines.push("");

  return {
    path: "asset-guidelines.md",
    content: lines.join("\n"),
    content_type: "text/markdown",
    program: "canvas",
    description: "Design asset guidelines with colors, typography, spacing, and export specifications",
  };
}
