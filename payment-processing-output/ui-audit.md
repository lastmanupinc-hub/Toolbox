# UI Audit — avery-pay-platform

Generated: 2026-04-05T07:37:21.801Z

## UI Stack Summary

| Aspect | Detected |
|--------|----------|
| UI Frameworks | None detected |
| Styling | CSS/SCSS |
| TypeScript | Yes |
| UI Libraries | None detected |
| Total Routes | 15 |
| Entry Points | 1 |

## Accessibility Checklist

| Requirement | Status | Notes |
|-------------|--------|-------|
| Semantic HTML | ⚠️ Verify | Check for div-soup vs proper heading hierarchy |
| ARIA labels | ⚠️ Verify | Interactive elements need aria-label/aria-describedby |
| Keyboard navigation | ⚠️ Verify | Tab order, focus management, skip links |
| Color contrast | ⚠️ Verify | 4.5:1 ratio for text, 3:1 for large text |
| Screen reader | ⚠️ Verify | Test with VoiceOver/NVDA |
| Focus indicators | ⚠️ Verify | Visible focus rings on all interactive elements |
| Alt text | ⚠️ Verify | All images need descriptive alt attributes |

## Performance Audit

| Metric | Target | How to Measure |
|--------|--------|----------------|
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse, Web Vitals |
| FID (First Input Delay) | < 100ms | Lighthouse, Web Vitals |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse, Web Vitals |
| Bundle size | < 250KB gzip | Build output |
| Image optimization | WebP/AVIF | Check image formats |
| Font loading | font-display: swap | Verify CSS |

## Component Coverage

| Route | Has Component | Interactive | Needs Testing |
|-------|--------------|-------------|---------------|
| / | ⚠️ Verify | ⚠️ Verify | Yes |
| /v1/payments | ⚠️ Verify | ⚠️ Verify | Yes |
| /v1/payouts | ⚠️ Verify | ⚠️ Verify | Yes |
| /v1/kyc/check | ⚠️ Verify | ⚠️ Verify | Yes |
| /v1/providers/:name/connect | ⚠️ Verify | ⚠️ Verify | Yes |
| /v1/webhooks/provider | ⚠️ Verify | ⚠️ Verify | Yes |
| /v1/admin/metrics | ⚠️ Verify | ⚠️ Verify | Yes |
| /healthz | ⚠️ Verify | ⚠️ Verify | Yes |
| /v1/payments | ⚠️ Verify | ⚠️ Verify | Yes |
| /v1/payouts | ⚠️ Verify | ⚠️ Verify | Yes |

## Audit Score

**Overall UI Readiness: 70/100**

| Factor | Score |
|--------|-------|
| Framework detection | 0 |
| Styling system | 0 |
| TypeScript | +10 |
| UI component library | 0 |
| Route coverage | +10 |
