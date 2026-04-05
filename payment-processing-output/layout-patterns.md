# Layout Patterns — avery-pay-platform

Generated: 2026-04-05T07:37:21.801Z

## Page Layout Architecture

Standard layout structure for Go projects:

- **Shell Layout**: Navigation + main content area + footer
- **Split Layout**: Sidebar + content pane
- **Centered Layout**: Single-column centered content (forms, auth)

## Layout Components

| Layout | Use Case | Contains |
|--------|----------|----------|
| RootLayout | All pages | Theme provider, global nav, font loading |
| DashboardLayout | Authenticated views | Sidebar, breadcrumbs, user menu |
| AuthLayout | Login/signup | Centered card, minimal chrome |
| MarketingLayout | Public pages | Hero nav, CTA footer, social proof |
| SettingsLayout | User settings | Tab nav, form sections |

## Responsive Breakpoints

| Breakpoint | Width | Layout Behavior |
|------------|-------|-----------------|
| Mobile | < 640px | Single column, stacked |
| Tablet | 640–1024px | Collapsible sidebar |
| Desktop | > 1024px | Full multi-column |

## Route-to-Layout Mapping

| Route | Suggested Layout |
|-------|-----------------|
| GET / | MarketingLayout |
| POST /v1/payments | DashboardLayout |
| POST /v1/payouts | DashboardLayout |
| POST /v1/kyc/check | DashboardLayout |
| POST /v1/providers/:name/connect | DashboardLayout |
| POST /v1/webhooks/provider | DashboardLayout |
| GET /v1/admin/metrics | DashboardLayout |
| GET /healthz | DashboardLayout |
| POST /v1/payments | DashboardLayout |
| POST /v1/payouts | DashboardLayout |
| POST /v1/kyc/check | DashboardLayout |
| POST /v1/providers/:name/connect | DashboardLayout |

## Grid System

```css
/* Standard 12-column grid */
.grid-layout {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-4, 16px);
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-4, 16px);
}
```
