# LargeKite Capital — Finance-first site (v1.2)

Human-led finance consulting. AI is our tool, not the product.

## Quickstart
```bash
npm i
npm run dev
```
Visit http://localhost:3000

## Deploy (Vercel)
- Import this repo to Vercel.
- Add domain `largekitecapital.com` and `www.largekitecapital.com` in Vercel → Settings → Domains.
- DNS in Squarespace:
  - A @ → 76.76.21.21
  - CNAME www → cname.vercel-dns.com
- Env vars:
  - `RESEND_API_KEY=...`
  - `CONTACT_TO=you@largekitecapital.com`

## Content
- `/app` — pages (App Router)
- `/content/insights` — MDX posts

## Market Sentiment Page
- URL: `/market-sentiment`
- API: `/api/sentiment` pulls `^GSPC` and `^VIX` from Yahoo endpoints.
- Manual override for demos: `/market-sentiment?override=hot|cool|neutral`


### Trend Gate
- Hot is only declared if SMA50 > SMA200 on the S&P 500 series.


### Sparklines & Crossovers
- `/api/sentiment` now returns `spxSeries` with `t`, `close`, `ma50`, `ma200` and `crossovers` events.
- `/market-sentiment` renders inline SVG sparklines and lists last bull/bear crosses.


### Compact JSON
- `/api/sentiment?format=compact` for embedding on homepage cards/widgets.


### Shared sentiment logic
- `app/lib/sentiment.ts` centralizes Yahoo fetch + calculations.
- API and server components both import from this helper (no internal HTTP dependency).
