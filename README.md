# NiftyPulse360

Automated Indian stock market content platform that generates AI-powered analysis pages for stock movements, indices, IPOs, gold/commodities, and daily market wrap-ups. Combines real-time market data, news aggregation, and Gemini AI to produce SEO-optimized pages distributed across multiple channels.

**Live:** [niftypulse360.com](https://niftypulse360.com)

## Tech Stack

- **Framework:** Next.js 16 (App Router, ISR, Standalone output)
- **Language:** TypeScript 5
- **Database:** PostgreSQL + Prisma ORM
- **Styling:** Tailwind CSS 4
- **AI:** Google Gemini (analysis + FAQ generation)
- **Deployment:** Docker (Node 20 Alpine, 768MB heap)
- **Port:** 8080

## Features

### Market Coverage

- **Stocks** — Large-cap, mid-cap, small-cap movers (4%+ / 6%+ threshold)
- **Indices** — Nifty 50, Sensex, Bank Nifty, Nifty IT, Pharma
- **IPOs** — Full lifecycle: upcoming, open, allotment, GMP tracking, listing
- **Gold & Silver** — Daily price per gram/tola/ounce (INR)
- **Commodities** — Crude Oil (WTI + Brent)
- **Forex** — USD/INR, EUR/INR, GBP/INR
- **Pre-Market** — Gift Nifty, US markets (Dow/S&P/Nasdaq), crude, USD/INR
- **Market Wrap** — Daily summary with top gainers/losers, sector performance

### Content Pipeline

1. Cron jobs fetch market data from multiple sources (Google Finance, Yahoo Finance v8, NSE, RapidAPI, ExchangeRate API)
2. News aggregation from Economic Times, Moneycontrol, Business Standard, Mint, Zerodha Pulse, Google News RSS
3. AI analysis via Gemini generates insights + FAQ for each event
4. Quality gate rejects thin content (<800 words, <5 data points)
5. Pages are published with SEO meta, Schema.org structured data, and OG images

### Search Engine Indexing (4-layer)

1. **Google Indexing API** — Direct submission via service account
2. **IndexNow** — Instant notification to Bing, Yandex, and others
3. **WebSub** — Push notification to RSS subscribers
4. **Sitemap Pings** — XML sitemap submission to Google & Bing

### Social Distribution

- LinkedIn (article posts with OG image)
- Twitter
- Dev.to (full markdown articles)
- Telegraph (instant articles)

## Project Structure

```
app/
├── api/cron/            # Automated cron endpoints (stocks, indices, gold, commodities, ipo, market-wrap, pre-market)
├── stocks/              # Stock pages + category filters (gainers, losers, 52W high/low, circuits)
├── indices/             # Index movement pages
├── ipo/                 # IPO pages (detail, GMP, subscription, upcoming, listed)
├── gold/                # Gold/silver price pages
├── commodities/         # Commodity pages
├── market-wrap/         # Daily market summaries
├── pre-market-today/    # Pre-market indicators
└── api/og              # Dynamic OG image generation

lib/
├── services/            # Market data fetching (17 services)
├── seo/                 # Indexing + social distribution
├── generators/          # Content, title, slug, page generation
├── db/                  # Prisma client singleton
└── utils/               # Auth, date (IST), formatting

prisma/
└── schema.prisma        # 8 models: StockEvent, IndexEvent, MetalEvent, CommodityEvent, CurrencyEvent, IpoEvent, MarketWrap, IndexingQueue
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- API keys (see `.env.example`)

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Fill in your API keys and DATABASE_URL

# Setup database
npx prisma migrate deploy
npx prisma generate

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Docker

```bash
docker build -t niftypulse360 .
docker run -p 8080:8080 --env-file .env niftypulse360
```

## Environment Variables

| Category | Variables |
|----------|-----------|
| **Database** | `DATABASE_URL` |
| **App** | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_NAME`, `CRON_SECRET` |
| **Market Data** | `MARKETAUX_API_KEY`, `EXCHANGERATE_API_KEY`, `RAPIDAPI_KEY` |
| **AI** | `GEMINI_API_KEY` |
| **Indexing** | `GOOGLE_INDEXING_SA_EMAIL`, `GOOGLE_INDEXING_SA_PRIVATE_KEY`, `INDEXNOW_KEY` |
| **Social** | `LINKEDIN_ACCESS_TOKEN`, `TWITTER_API_KEY`/`SECRET`/`ACCESS_TOKEN`/`ACCESS_SECRET`, `DEV_TO_API_KEY` |
| **Ads** | `NEXT_PUBLIC_ADSENSE_CLIENT`, `NEXT_PUBLIC_ADSENSE_SLOT_*` |

See `.env.example` for the full list (40+ variables).

## Cron Jobs

All cron endpoints require `CRON_SECRET` header authentication.

| Endpoint | Purpose |
|----------|---------|
| `POST /api/cron/stocks` | Detect stock movers, generate pages, distribute |
| `POST /api/cron/indices` | Generate index movement pages |
| `POST /api/cron/gold` | Gold/silver price tracking |
| `POST /api/cron/commodities` | Crude oil & commodity prices |
| `POST /api/cron/ipo` | IPO scraping, GMP updates, status transitions |
| `POST /api/cron/market-wrap` | Daily market summary |
| `POST /api/cron/pre-market` | Pre-market indicators (Gift Nifty, US markets) |

## Data Sources

- **Google Finance** — Indian indices (primary)
- **Yahoo Finance** (v8 chart API) — US markets, commodities, forex
- **NSE** — IPO data, stock listings
- **RapidAPI** — Gold/silver rates (India)
- **ExchangeRate API** — Currency conversion
- **RSS Feeds** — Economic Times, Moneycontrol, Business Standard, Mint, Zerodha Pulse
- **Marketaux** — Stock-specific news (fallback)

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build (includes prisma generate)
npm run start        # Start production server
npm run lint         # ESLint
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed database
npm run db:generate  # Generate Prisma client
```

## License

Private — All rights reserved.
