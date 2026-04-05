# SEO Rules — avery-pay-platform

> SEO guidelines for a static site built with Go

## Meta Tags & Head

- Every page MUST have a unique `<title>` (50–60 chars)
- Every page MUST have a unique `<meta name="description">` (120–160 chars)
- Use canonical URLs: `<link rel="canonical" href="...">` on every page
- Add `<meta name="robots" content="index, follow">` for public pages
- Add `<meta name="viewport" content="width=device-width, initial-scale=1">`

## Rendering Strategy

### Svelte SSR

- SvelteKit provides SSR by default — ensure `+page.server.ts` loads data for SEO pages
- Use `<svelte:head>` for per-page meta tags

## Structured Data (JSON-LD)

- Add JSON-LD structured data to key pages
- Use `@type: WebSite` on the homepage
- Use `@type: WebApplication` or `@type: SoftwareApplication` for SaaS products
- Use `@type: BreadcrumbList` for navigation hierarchy
- Validate with [Google Rich Results Test](https://search.google.com/test/rich-results)

## Route SEO Audit

| Route | Method | SEO Action |
|-------|--------|------------|
| `/` | GET | Needs unique title, description, canonical |
| `/v1/payments` | POST | API route — no indexing needed |
| `/v1/payouts` | POST | API route — no indexing needed |
| `/v1/kyc/check` | POST | API route — no indexing needed |
| `/v1/providers/:name/connect` | POST | API route — no indexing needed |
| `/v1/webhooks/provider` | POST | API route — no indexing needed |
| `/v1/admin/metrics` | GET | Needs unique title, description, canonical |
| `/healthz` | GET | Needs unique title, description, canonical |
| `/v1/payments` | POST | API route — no indexing needed |
| `/v1/payouts` | POST | API route — no indexing needed |
| `/v1/kyc/check` | POST | API route — no indexing needed |
| `/v1/providers/:name/connect` | POST | API route — no indexing needed |
| `/v1/webhooks/provider` | POST | API route — no indexing needed |
| `/v1/admin/metrics` | GET | Needs unique title, description, canonical |
| `/v1/payments` | POST | API route — no indexing needed |

## Technical SEO

- Ensure `robots.txt` exists at site root
- Generate and submit `sitemap.xml`
- Use clean, descriptive URLs — avoid query parameters for content pages
- Implement proper 301 redirects for moved pages
- Set appropriate cache headers for static assets
- Ensure `<img>` tags have `alt` attributes
- Ensure `<a>` tags have descriptive text (avoid "click here")
- Keep page load time under 3 seconds (Core Web Vitals)

## Accessibility (SEO Impact)

- Use semantic HTML (`<header>`, `<main>`, `<nav>`, `<article>`, `<footer>`)
- Use heading hierarchy (`h1` > `h2` > `h3`) — one `h1` per page
- Provide `aria-label` for interactive elements without visible text
