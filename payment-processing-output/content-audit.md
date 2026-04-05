# Content Audit — avery-pay-platform

> Automated analysis of content structure, metadata coverage, and SEO readiness

## Project Type Assessment

| Attribute | Value |
|-----------|-------|
| Project Type | static site |
| Primary Language | Go |
| Frameworks | Svelte |
| Total Files | 1829 |
| Total LOC | 417166 |

## SEO Readiness Score

**70/100**

| Check | Status | Weight |
|-------|--------|--------|
| Server-Side Rendering | PASS | 3 |
| Route Detection | PASS | 2 |
| Has TypeScript | FAIL | 1 |
| Has CI/CD | FAIL | 1 |
| Has README | PASS | 1 |
| Has Tests | PASS | 1 |
| Architecture Layers | FAIL | 1 |

## Content Files Analysis

- **Content files (md/mdx/html):** 116
- **Template files (tsx/jsx/vue/svelte):** 196
- **Total source files:** 1829

## Page Components

These files likely render as individual pages:

| File | Language | LOC | SEO Action |
|------|----------|-----|------------|
| `archive/trust-fabric-frontend/src/routes/+error.svelte` | Svelte | 35 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/+layout.svelte` | Svelte | 87 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/+layout.ts` | TypeScript | 2 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/+page.svelte` | Svelte | 104 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/builder/+page.svelte` | Svelte | 580 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/builder/audit/+page.svelte` | Svelte | 78 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/builder/certifications/+page.svelte` | Svelte | 161 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/builder/classify/+page.svelte` | Svelte | 466 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/builder/history/+page.svelte` | Svelte | 104 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/builder/licensing/+page.svelte` | Svelte | 262 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/builder/listings/+page.svelte` | Svelte | 458 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/builder/profile/+page.svelte` | Svelte | 225 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/builder/signals/+page.svelte` | Svelte | 111 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/builder/submissions/+page.svelte` | Svelte | 265 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/builder/submissions/[submission_id]/+page.svelte` | Svelte | 328 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/builder/workflow/[submission_id]/+page.svelte` | Svelte | 544 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/buyer/+page.svelte` | Svelte | 139 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/buyer/allowlist/+page.svelte` | Svelte | 119 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/buyer/request/+page.svelte` | Svelte | 94 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/docs/passports/+page.svelte` | Svelte | 72 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/investor/+page.svelte` | Svelte | 205 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/login/+page.svelte` | Svelte | 213 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/marketplace/+page.svelte` | Svelte | 88 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/marketplace/[listing_slug]/+page.svelte` | Svelte | 81 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/marketplace/[listing_slug]/passport/+page.svelte` | Svelte | 81 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/marketplace/[listing_slug]/pricing/+page.svelte` | Svelte | 153 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/mfa/+page.svelte` | Svelte | 144 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/reviewer/+page.svelte` | Svelte | 69 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/reviewer/submissions/[submission_id]/+page.svelte` | Svelte | 134 | Needs meta tags |
| `archive/trust-fabric-frontend/src/routes/setup-2fa/+page.svelte` | Svelte | 292 | Needs meta tags |

## Recommendations


## Core Web Vitals Checklist

- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] First Input Delay (FID) < 100ms
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Enable image optimization (WebP/AVIF, lazy loading)
- [ ] Minify CSS and JavaScript bundles
- [ ] Use font-display: swap for web fonts
- [ ] Preload critical resources
