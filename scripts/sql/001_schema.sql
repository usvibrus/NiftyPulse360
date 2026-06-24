-- NiftyPulse360 Database Schema
-- PostgreSQL CREATE TABLE script generated from Prisma schema
-- Run this first to create all tables, indexes, and constraints

BEGIN;

-- ============================================================
-- StockEvent
-- ============================================================
CREATE TABLE IF NOT EXISTS "StockEvent" (
  "id"              TEXT NOT NULL,
  "slug"            TEXT NOT NULL,
  "symbol"          TEXT NOT NULL,
  "companyName"     TEXT NOT NULL,
  "exchange"        TEXT NOT NULL,
  "sector"          TEXT,
  "eventType"       TEXT NOT NULL,
  "changePercent"   DOUBLE PRECISION NOT NULL,
  "changeAmount"    DOUBLE PRECISION NOT NULL,
  "openPrice"       DOUBLE PRECISION NOT NULL,
  "closePrice"      DOUBLE PRECISION NOT NULL,
  "highPrice"       DOUBLE PRECISION NOT NULL,
  "lowPrice"        DOUBLE PRECISION NOT NULL,
  "volume"          BIGINT NOT NULL,
  "avgVolume"       BIGINT,
  "marketCap"       DOUBLE PRECISION,
  "week52High"      DOUBLE PRECISION,
  "week52Low"       DOUBLE PRECISION,
  "sectorChange"    DOUBLE PRECISION,
  "niftyChange"     DOUBLE PRECISION,
  "aiAnalysis"      TEXT,
  "faqContent"      JSONB,
  "newsItems"       JSONB NOT NULL,
  "pageContent"     TEXT NOT NULL,
  "metaTitle"       TEXT NOT NULL,
  "metaDesc"        TEXT NOT NULL,
  "keywords"        TEXT[] NOT NULL,
  "eventDate"       TIMESTAMP(3) NOT NULL,
  "publishedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  "isPublished"     BOOLEAN NOT NULL DEFAULT true,
  "pageViews"       INTEGER NOT NULL DEFAULT 0,
  "tweetPosted"     BOOLEAN NOT NULL DEFAULT false,
  "googleIndexed"   BOOLEAN NOT NULL DEFAULT false,
  "devtoPosted"     BOOLEAN NOT NULL DEFAULT false,
  "tumblrPosted"    BOOLEAN NOT NULL DEFAULT false,
  "telegraphPosted" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "StockEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StockEvent_slug_key" ON "StockEvent"("slug");
CREATE INDEX IF NOT EXISTS "StockEvent_symbol_idx" ON "StockEvent"("symbol");
CREATE INDEX IF NOT EXISTS "StockEvent_eventDate_idx" ON "StockEvent"("eventDate");
CREATE INDEX IF NOT EXISTS "StockEvent_eventType_idx" ON "StockEvent"("eventType");
CREATE INDEX IF NOT EXISTS "StockEvent_changePercent_idx" ON "StockEvent"("changePercent");
CREATE INDEX IF NOT EXISTS "StockEvent_publishedAt_idx" ON "StockEvent"("publishedAt");

-- ============================================================
-- IndexEvent
-- ============================================================
CREATE TABLE IF NOT EXISTS "IndexEvent" (
  "id"            TEXT NOT NULL,
  "slug"          TEXT NOT NULL,
  "indexName"     TEXT NOT NULL,
  "indexSymbol"   TEXT NOT NULL,
  "eventType"     TEXT NOT NULL,
  "changePercent" DOUBLE PRECISION NOT NULL,
  "changePoints"  DOUBLE PRECISION NOT NULL,
  "openValue"     DOUBLE PRECISION NOT NULL,
  "closeValue"    DOUBLE PRECISION NOT NULL,
  "highValue"     DOUBLE PRECISION NOT NULL,
  "lowValue"      DOUBLE PRECISION NOT NULL,
  "newsItems"     JSONB NOT NULL,
  "pageContent"   TEXT NOT NULL,
  "metaTitle"     TEXT NOT NULL,
  "metaDesc"      TEXT NOT NULL,
  "keywords"      TEXT[] NOT NULL,
  "eventDate"     TIMESTAMP(3) NOT NULL,
  "publishedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  "isPublished"   BOOLEAN NOT NULL DEFAULT true,
  "pageViews"     INTEGER NOT NULL DEFAULT 0,
  "tweetPosted"   BOOLEAN NOT NULL DEFAULT false,
  "googleIndexed" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "IndexEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IndexEvent_slug_key" ON "IndexEvent"("slug");
CREATE INDEX IF NOT EXISTS "IndexEvent_indexSymbol_idx" ON "IndexEvent"("indexSymbol");
CREATE INDEX IF NOT EXISTS "IndexEvent_eventDate_idx" ON "IndexEvent"("eventDate");

-- ============================================================
-- MetalEvent
-- ============================================================
CREATE TABLE IF NOT EXISTS "MetalEvent" (
  "id"            TEXT NOT NULL,
  "slug"          TEXT NOT NULL,
  "metal"         TEXT NOT NULL,
  "carat"         TEXT,
  "eventType"     TEXT NOT NULL,
  "changePercent" DOUBLE PRECISION NOT NULL,
  "pricePerGram"  DOUBLE PRECISION NOT NULL,
  "pricePerTola"  DOUBLE PRECISION,
  "pricePerOunce" DOUBLE PRECISION NOT NULL,
  "newsItems"     JSONB NOT NULL,
  "pageContent"   TEXT NOT NULL,
  "metaTitle"     TEXT NOT NULL,
  "metaDesc"      TEXT NOT NULL,
  "keywords"      TEXT[] NOT NULL,
  "eventDate"     TIMESTAMP(3) NOT NULL,
  "publishedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  "isPublished"   BOOLEAN NOT NULL DEFAULT true,
  "pageViews"     INTEGER NOT NULL DEFAULT 0,
  "tweetPosted"   BOOLEAN NOT NULL DEFAULT false,
  "googleIndexed" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "MetalEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MetalEvent_slug_key" ON "MetalEvent"("slug");
CREATE INDEX IF NOT EXISTS "MetalEvent_metal_idx" ON "MetalEvent"("metal");
CREATE INDEX IF NOT EXISTS "MetalEvent_eventDate_idx" ON "MetalEvent"("eventDate");

-- ============================================================
-- CommodityEvent
-- ============================================================
CREATE TABLE IF NOT EXISTS "CommodityEvent" (
  "id"            TEXT NOT NULL,
  "slug"          TEXT NOT NULL,
  "commodity"     TEXT NOT NULL,
  "eventType"     TEXT NOT NULL,
  "changePercent" DOUBLE PRECISION NOT NULL,
  "priceUSD"      DOUBLE PRECISION NOT NULL,
  "priceINR"      DOUBLE PRECISION,
  "newsItems"     JSONB NOT NULL,
  "pageContent"   TEXT NOT NULL,
  "metaTitle"     TEXT NOT NULL,
  "metaDesc"      TEXT NOT NULL,
  "keywords"      TEXT[] NOT NULL,
  "eventDate"     TIMESTAMP(3) NOT NULL,
  "publishedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  "isPublished"   BOOLEAN NOT NULL DEFAULT true,
  "pageViews"     INTEGER NOT NULL DEFAULT 0,
  "tweetPosted"   BOOLEAN NOT NULL DEFAULT false,
  "googleIndexed" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "CommodityEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CommodityEvent_slug_key" ON "CommodityEvent"("slug");
CREATE INDEX IF NOT EXISTS "CommodityEvent_commodity_idx" ON "CommodityEvent"("commodity");
CREATE INDEX IF NOT EXISTS "CommodityEvent_eventDate_idx" ON "CommodityEvent"("eventDate");

-- ============================================================
-- CurrencyEvent
-- ============================================================
CREATE TABLE IF NOT EXISTS "CurrencyEvent" (
  "id"            TEXT NOT NULL,
  "slug"          TEXT NOT NULL,
  "pair"          TEXT NOT NULL,
  "eventType"     TEXT NOT NULL,
  "changePercent" DOUBLE PRECISION NOT NULL,
  "rateValue"     DOUBLE PRECISION NOT NULL,
  "newsItems"     JSONB NOT NULL,
  "pageContent"   TEXT NOT NULL,
  "metaTitle"     TEXT NOT NULL,
  "metaDesc"      TEXT NOT NULL,
  "keywords"      TEXT[] NOT NULL,
  "eventDate"     TIMESTAMP(3) NOT NULL,
  "publishedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  "isPublished"   BOOLEAN NOT NULL DEFAULT true,
  "pageViews"     INTEGER NOT NULL DEFAULT 0,
  "tweetPosted"   BOOLEAN NOT NULL DEFAULT false,
  "googleIndexed" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "CurrencyEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CurrencyEvent_slug_key" ON "CurrencyEvent"("slug");
CREATE INDEX IF NOT EXISTS "CurrencyEvent_pair_idx" ON "CurrencyEvent"("pair");
CREATE INDEX IF NOT EXISTS "CurrencyEvent_eventDate_idx" ON "CurrencyEvent"("eventDate");

-- ============================================================
-- IndexingQueue
-- ============================================================
CREATE TABLE IF NOT EXISTS "IndexingQueue" (
  "id"          TEXT NOT NULL,
  "url"         TEXT NOT NULL,
  "pageType"    TEXT NOT NULL,
  "attempts"    INTEGER NOT NULL DEFAULT 0,
  "lastAttempt" TIMESTAMP(3),
  "success"     BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "IndexingQueue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IndexingQueue_url_key" ON "IndexingQueue"("url");
CREATE INDEX IF NOT EXISTS "IndexingQueue_success_idx" ON "IndexingQueue"("success");

-- ============================================================
-- IpoEvent
-- ============================================================
CREATE TABLE IF NOT EXISTS "IpoEvent" (
  "id"                    TEXT NOT NULL,
  "slug"                  TEXT NOT NULL,
  "companyName"           TEXT NOT NULL,
  "symbol"                TEXT,
  "ipoType"              TEXT NOT NULL,
  "exchange"             TEXT NOT NULL,
  "status"               TEXT NOT NULL,

  "priceBandMin"         DOUBLE PRECISION,
  "priceBandMax"         DOUBLE PRECISION,
  "issuePrice"           DOUBLE PRECISION,
  "lotSize"              INTEGER,
  "issueSizeCr"          DOUBLE PRECISION,
  "freshIssue"           DOUBLE PRECISION,
  "offerForSale"         DOUBLE PRECISION,

  "openDate"             TIMESTAMP(3),
  "closeDate"            TIMESTAMP(3),
  "allotmentDate"        TIMESTAMP(3),
  "refundDate"           TIMESTAMP(3),
  "listingDate"          TIMESTAMP(3),

  "gmpValue"             DOUBLE PRECISION,
  "gmpPercent"           DOUBLE PRECISION,
  "gmpHistory"           JSONB,
  "gmpUpdatedAt"         TIMESTAMP(3),

  "subscriptionData"     JSONB,
  "subscriptionUpdatedAt" TIMESTAMP(3),

  "listingPrice"         DOUBLE PRECISION,
  "listingGainLoss"      DOUBLE PRECISION,
  "listingDayClose"      DOUBLE PRECISION,
  "currentPrice"         DOUBLE PRECISION,

  "aboutCompany"         TEXT,
  "promoterHolding"      DOUBLE PRECISION,
  "financials"           JSONB,
  "objectOfIssue"        TEXT,

  "registrarName"        TEXT,
  "registrarUrl"         TEXT,
  "leadManagers"         TEXT[] NOT NULL,

  "aiAnalysis"           TEXT,
  "faqContent"           JSONB,
  "pageContent"          TEXT,
  "metaTitle"            TEXT NOT NULL,
  "metaDesc"             TEXT NOT NULL,
  "keywords"             TEXT[] NOT NULL,

  "publishedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL,
  "isPublished"          BOOLEAN NOT NULL DEFAULT true,
  "pageViews"            INTEGER NOT NULL DEFAULT 0,
  "googleIndexed"        BOOLEAN NOT NULL DEFAULT false,
  "tweetPosted"          BOOLEAN NOT NULL DEFAULT false,

  "listingSlug"          TEXT,
  "listingPageContent"   TEXT,
  "listingMetaTitle"     TEXT,
  "listingMetaDesc"      TEXT,
  "listingPublishedAt"   TIMESTAMP(3),

  CONSTRAINT "IpoEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IpoEvent_slug_key" ON "IpoEvent"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "IpoEvent_listingSlug_key" ON "IpoEvent"("listingSlug");
CREATE INDEX IF NOT EXISTS "IpoEvent_status_idx" ON "IpoEvent"("status");
CREATE INDEX IF NOT EXISTS "IpoEvent_ipoType_idx" ON "IpoEvent"("ipoType");
CREATE INDEX IF NOT EXISTS "IpoEvent_openDate_idx" ON "IpoEvent"("openDate");
CREATE INDEX IF NOT EXISTS "IpoEvent_listingDate_idx" ON "IpoEvent"("listingDate");
CREATE INDEX IF NOT EXISTS "IpoEvent_publishedAt_idx" ON "IpoEvent"("publishedAt");

-- ============================================================
-- MarketWrap
-- ============================================================
CREATE TABLE IF NOT EXISTS "MarketWrap" (
  "id"              TEXT NOT NULL,
  "slug"            TEXT NOT NULL,
  "wrapDate"        TIMESTAMP(3) NOT NULL,

  "niftyClose"      DOUBLE PRECISION,
  "niftyChange"     DOUBLE PRECISION,
  "niftyChangePct"  DOUBLE PRECISION,
  "sensexClose"     DOUBLE PRECISION,
  "sensexChange"    DOUBLE PRECISION,
  "sensexChangePct" DOUBLE PRECISION,
  "bankNiftyClose"  DOUBLE PRECISION,
  "bankNiftyChange" DOUBLE PRECISION,

  "topGainers"      JSONB,
  "topLosers"       JSONB,
  "sectorSummary"   JSONB,

  "aiSummary"       TEXT,
  "pageContent"     TEXT NOT NULL,
  "metaTitle"       TEXT NOT NULL,
  "metaDesc"        TEXT NOT NULL,
  "keywords"        TEXT[] NOT NULL,

  "publishedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  "isPublished"     BOOLEAN NOT NULL DEFAULT true,
  "googleIndexed"   BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "MarketWrap_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MarketWrap_slug_key" ON "MarketWrap"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "MarketWrap_wrapDate_key" ON "MarketWrap"("wrapDate");
CREATE INDEX IF NOT EXISTS "MarketWrap_wrapDate_idx" ON "MarketWrap"("wrapDate");

-- ============================================================
-- PreMarketData
-- ============================================================
CREATE TABLE IF NOT EXISTS "PreMarketData" (
  "id"              TEXT NOT NULL,
  "slug"            TEXT NOT NULL,
  "dataDate"        TIMESTAMP(3) NOT NULL,

  "giftNifty"       DOUBLE PRECISION,
  "giftNiftyChange" DOUBLE PRECISION,
  "giftNiftyPct"    DOUBLE PRECISION,
  "dowJones"        DOUBLE PRECISION,
  "dowChange"       DOUBLE PRECISION,
  "sp500"           DOUBLE PRECISION,
  "sp500Change"     DOUBLE PRECISION,
  "nasdaq"          DOUBLE PRECISION,
  "nasdaqChange"    DOUBLE PRECISION,

  "crudeOil"        DOUBLE PRECISION,
  "crudeChange"     DOUBLE PRECISION,
  "goldPrice"       DOUBLE PRECISION,
  "goldChange"      DOUBLE PRECISION,

  "usdInr"          DOUBLE PRECISION,
  "usdInrChange"    DOUBLE PRECISION,

  "nikkei"          DOUBLE PRECISION,
  "nikkeiChange"    DOUBLE PRECISION,
  "hangSeng"        DOUBLE PRECISION,
  "hangSengChange"  DOUBLE PRECISION,

  "aiExpectation"   TEXT,
  "pageContent"     TEXT NOT NULL,
  "metaTitle"       TEXT NOT NULL,
  "metaDesc"        TEXT NOT NULL,
  "keywords"        TEXT[] NOT NULL,

  "publishedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  "isPublished"     BOOLEAN NOT NULL DEFAULT true,
  "googleIndexed"   BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "PreMarketData_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PreMarketData_slug_key" ON "PreMarketData"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "PreMarketData_dataDate_key" ON "PreMarketData"("dataDate");
CREATE INDEX IF NOT EXISTS "PreMarketData_dataDate_idx" ON "PreMarketData"("dataDate");

-- ============================================================
-- Prisma migrations metadata table
-- ============================================================
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id"                  VARCHAR(36) NOT NULL,
  "checksum"            VARCHAR(64) NOT NULL,
  "finished_at"         TIMESTAMP WITH TIME ZONE,
  "migration_name"      VARCHAR(255) NOT NULL,
  "logs"                TEXT,
  "rolled_back_at"      TIMESTAMP WITH TIME ZONE,
  "started_at"          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

COMMIT;
