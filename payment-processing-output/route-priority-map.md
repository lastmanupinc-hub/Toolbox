# Route Priority Map — avery-pay-platform

> Route-level SEO prioritization for crawl budget and sitemap configuration

## Sitemap Configuration

| Route | Priority | Changefreq | Index | Reason |
|-------|----------|------------|-------|--------|
| `/` | 1.0 | weekly | Yes | Homepage — highest priority |
| `/v1/admin/metrics` | 0.5 | monthly | Yes | Standard page |
| `/healthz` | 0.5 | monthly | Yes | Standard page |
| `/v1/admin/metrics` | 0.5 | monthly | Yes | Standard page |

## Summary

- **Total routes:** 4
- **Indexable:** 4
- **Noindex:** 0

## API Routes (Excluded)

These routes should NOT appear in sitemap or be indexed:

- `POST /v1/payments`
- `POST /v1/payouts`
- `POST /v1/kyc/check`
- `POST /v1/providers/:name/connect`
- `POST /v1/webhooks/provider`
- `POST /v1/payments`
- `POST /v1/payouts`
- `POST /v1/kyc/check`
- `POST /v1/providers/:name/connect`
- `POST /v1/webhooks/provider`
- `POST /v1/payments`

## robots.txt Recommendations

```
User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://yoursite.com/sitemap.xml
```
