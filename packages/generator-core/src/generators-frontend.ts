import type { ContextMap } from "@axis/context-engine";
import type { GeneratedFile } from "./types.js";

export function generateFrontendRules(ctx: ContextMap): GeneratedFile {
  const id = ctx.project_identity;
  const lines: string[] = [];

  lines.push(`# Frontend Rules — ${id.name}`);
  lines.push("");
  lines.push(`> UI engineering standards for this ${id.type.replace(/_/g, " ")}`);
  lines.push("");

  // Component conventions
  lines.push("## Component Conventions");
  lines.push("");

  if (ctx.detection.frameworks.some(f => f.name === "React")) {
    lines.push("- Use functional components with hooks");
    lines.push("- Colocate component, types, and tests in the same directory");
    lines.push("- Export one primary component per file");
    lines.push("- Name files after the component: `DataTable.tsx` exports `DataTable`");
  }

  if (ctx.detection.frameworks.some(f => f.name === "Next.js")) {
    lines.push("- Use Server Components by default");
    lines.push("- Add `'use client'` only for interactive components (forms, modals, state)");
    lines.push("- Page components in `app/` directory follow file-based routing");
    lines.push("- Shared layouts use `layout.tsx`, loading states use `loading.tsx`");
  }

  if (ctx.detection.frameworks.some(f => f.name === "Vue")) {
    lines.push("- Use `<script setup>` with Composition API");
    lines.push("- Single File Components (`.vue`) with `<template>`, `<script>`, `<style>`");
  }

  if (ctx.detection.frameworks.some(f => f.name === "Svelte")) {
    lines.push("- Use `.svelte` single file components");
    lines.push("- Prefer reactive declarations (`$:`) over manual subscriptions");
  }
  lines.push("");

  // Styling
  lines.push("## Styling");
  lines.push("");
  if (ctx.detection.frameworks.some(f => f.name === "Tailwind CSS")) {
    lines.push("- Use Tailwind utility classes exclusively");
    lines.push("- Avoid custom CSS unless extending the design system");
    lines.push("- Use `@apply` sparingly — prefer inline utilities");
    lines.push("- Color tokens should come from the Tailwind config, not hardcoded hex values");
    lines.push("- Responsive design: mobile-first with `sm:`, `md:`, `lg:` breakpoints");
  } else {
    lines.push("- Follow the project's established styling pattern");
    lines.push("- Use CSS modules or scoped styles to avoid global namespace collisions");
  }
  lines.push("");

  // State management
  lines.push("## State Management");
  lines.push("");
  if (ctx.detection.frameworks.some(f => f.name === "Next.js")) {
    lines.push("- Server state: fetch in Server Components, revalidate with `revalidatePath()`");
    lines.push("- Client state: `useState` / `useReducer` for local UI state");
    lines.push("- Form state: use Server Actions with `useFormState()` / `useFormStatus()`");
  } else if (ctx.detection.frameworks.some(f => f.name === "React")) {
    lines.push("- Local state: `useState` / `useReducer`");
    lines.push("- Shared state: Context API or state library");
    lines.push("- Server state: data-fetching library (SWR, React Query, etc.)");
  }
  lines.push("");

  // Data fetching
  if (ctx.routes.some(r => r.path.includes("api"))) {
    lines.push("## Data Fetching");
    lines.push("");
    lines.push("Available API routes:");
    lines.push("");
    for (const r of ctx.routes.filter(r => r.path.includes("api"))) {
      lines.push(`- \`${r.method} ${r.path}\` → ${r.source_file}`);
    }
    lines.push("");
    if (ctx.detection.frameworks.some(f => f.name === "Next.js")) {
      lines.push("- Prefer Server Component data fetching over client-side `fetch`");
      lines.push("- Use Route Handlers (`app/api/`) for external API consumers");
    }
    lines.push("");
  }

  // Accessibility
  lines.push("## Accessibility");
  lines.push("");
  lines.push("- All interactive elements must be keyboard accessible");
  lines.push("- Images require `alt` text");
  lines.push("- Form inputs require associated `<label>` elements");
  lines.push("- Use semantic HTML: `<nav>`, `<main>`, `<section>`, `<article>`");
  lines.push("- Color contrast must meet WCAG 2.1 AA (4.5:1 minimum)");
  lines.push("");

  // Performance
  lines.push("## Performance");
  lines.push("");
  if (ctx.detection.frameworks.some(f => f.name === "Next.js")) {
    lines.push("- Use `next/image` for optimized images");
    lines.push("- Use `next/font` for font loading");
    lines.push("- Lazy load below-the-fold components with `dynamic()`");
  }
  lines.push("- Minimize client-side JavaScript — prefer server rendering");
  lines.push("- Avoid layout shift — specify dimensions for images and embeds");
  lines.push("");

  // Testing
  if (ctx.detection.test_frameworks.length > 0) {
    lines.push("## Testing");
    lines.push("");
    lines.push(`- Unit test components with ${ctx.detection.test_frameworks[0]}`);
    if (ctx.detection.test_frameworks.includes("playwright"))
      lines.push("- E2E tests with Playwright for critical user flows");
    if (ctx.detection.test_frameworks.includes("cypress"))
      lines.push("- E2E tests with Cypress for critical user flows");
    lines.push("- Test user interactions, not implementation details");
    lines.push("- Mock API responses at the network layer");
    lines.push("");
  }

  lines.push("---");
  lines.push("*Generated by Axis Frontend*");
  lines.push("");

  return {
    path: ".ai/frontend-rules.md",
    content: lines.join("\n"),
    content_type: "text/markdown",
    program: "frontend",
    description: "Frontend engineering rules derived from framework detection and project structure",
  };
}

export function generateComponentGuidelines(ctx: ContextMap): GeneratedFile {
  const lines: string[] = [];
  const id = ctx.project_identity;

  lines.push(`# Component Guidelines — ${id.name}`);
  lines.push("");

  // Component structure
  lines.push("## File Structure");
  lines.push("");
  lines.push("```");
  if (ctx.detection.frameworks.some(f => f.name === "Next.js")) {
    lines.push("components/");
    lines.push("├── ui/              # Generic UI primitives (Button, Input, Modal)");
    lines.push("├── layout/          # Layout components (Header, Sidebar, Footer)");
    lines.push("├── features/        # Feature-specific components");
    lines.push("└── shared/          # Shared across features");
  } else {
    lines.push("src/components/");
    lines.push("├── common/          # Generic reusable components");
    lines.push("├── layout/          # Layout components");
    lines.push("└── features/        # Feature-specific components");
  }
  lines.push("```");
  lines.push("");

  // Naming
  lines.push("## Naming");
  lines.push("");
  lines.push("- **Components:** PascalCase (`DataTable`, `UserProfile`)");
  lines.push("- **Files:** Match component name (`DataTable.tsx`)");
  lines.push("- **Props types:** `ComponentNameProps` (`DataTableProps`)");
  lines.push("- **Hooks:** `use` prefix (`useAuth`, `useTable`)");
  lines.push("");

  // Component template
  lines.push("## Component Template");
  lines.push("");

  if (ctx.detection.frameworks.some(f => f.name === "React" || f.name === "Next.js")) {
    lines.push("```tsx");
    lines.push("interface MyComponentProps {");
    lines.push("  title: string;");
    lines.push("  children?: React.ReactNode;");
    lines.push("}");
    lines.push("");
    lines.push("export function MyComponent({ title, children }: MyComponentProps) {");
    lines.push("  return (");
    lines.push("    <div>");
    lines.push("      <h2>{title}</h2>");
    lines.push("      {children}");
    lines.push("    </div>");
    lines.push("  );");
    lines.push("}");
    lines.push("```");
  }
  lines.push("");

  // Anti-patterns
  lines.push("## Anti-Patterns");
  lines.push("");
  lines.push("- Do not use `any` for props");
  lines.push("- Do not inline complex logic in JSX — extract to hooks or helpers");
  lines.push("- Do not create god components with 200+ lines — split into sub-components");
  lines.push("- Do not maintain duplicate state — derive values where possible");
  lines.push("");

  lines.push("---");
  lines.push("*Generated by Axis Frontend*");
  lines.push("");

  return {
    path: "component-guidelines.md",
    content: lines.join("\n"),
    content_type: "text/markdown",
    program: "frontend",
    description: "Component architecture guidelines based on detected framework patterns",
  };
}
