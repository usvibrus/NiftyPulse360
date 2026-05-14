-- CreateTable
CREATE TABLE "StockEvent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "sector" TEXT,
    "eventType" TEXT NOT NULL,
    "changePercent" DOUBLE PRECISION NOT NULL,
    "changeAmount" DOUBLE PRECISION NOT NULL,
    "openPrice" DOUBLE PRECISION NOT NULL,
    "closePrice" DOUBLE PRECISION NOT NULL,
    "highPrice" DOUBLE PRECISION NOT NULL,
    "lowPrice" DOUBLE PRECISION NOT NULL,
    "volume" BIGINT NOT NULL,
    "marketCap" DOUBLE PRECISION,
    "newsItems" JSONB NOT NULL,
    "pageContent" TEXT NOT NULL,
    "metaTitle" TEXT NOT NULL,
    "metaDesc" TEXT NOT NULL,
    "keywords" TEXT[],
    "eventDate" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "tweetPosted" BOOLEAN NOT NULL DEFAULT false,
    "googleIndexed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StockEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexEvent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "indexName" TEXT NOT NULL,
    "indexSymbol" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "changePercent" DOUBLE PRECISION NOT NULL,
    "changePoints" DOUBLE PRECISION NOT NULL,
    "openValue" DOUBLE PRECISION NOT NULL,
    "closeValue" DOUBLE PRECISION NOT NULL,
    "highValue" DOUBLE PRECISION NOT NULL,
    "lowValue" DOUBLE PRECISION NOT NULL,
    "newsItems" JSONB NOT NULL,
    "pageContent" TEXT NOT NULL,
    "metaTitle" TEXT NOT NULL,
    "metaDesc" TEXT NOT NULL,
    "keywords" TEXT[],
    "eventDate" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "tweetPosted" BOOLEAN NOT NULL DEFAULT false,
    "googleIndexed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "IndexEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetalEvent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "metal" TEXT NOT NULL,
    "carat" TEXT,
    "eventType" TEXT NOT NULL,
    "changePercent" DOUBLE PRECISION NOT NULL,
    "pricePerGram" DOUBLE PRECISION NOT NULL,
    "pricePerTola" DOUBLE PRECISION,
    "pricePerOunce" DOUBLE PRECISION NOT NULL,
    "newsItems" JSONB NOT NULL,
    "pageContent" TEXT NOT NULL,
    "metaTitle" TEXT NOT NULL,
    "metaDesc" TEXT NOT NULL,
    "keywords" TEXT[],
    "eventDate" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "tweetPosted" BOOLEAN NOT NULL DEFAULT false,
    "googleIndexed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MetalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommodityEvent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "commodity" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "changePercent" DOUBLE PRECISION NOT NULL,
    "priceUSD" DOUBLE PRECISION NOT NULL,
    "priceINR" DOUBLE PRECISION,
    "newsItems" JSONB NOT NULL,
    "pageContent" TEXT NOT NULL,
    "metaTitle" TEXT NOT NULL,
    "metaDesc" TEXT NOT NULL,
    "keywords" TEXT[],
    "eventDate" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "tweetPosted" BOOLEAN NOT NULL DEFAULT false,
    "googleIndexed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CommodityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrencyEvent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "changePercent" DOUBLE PRECISION NOT NULL,
    "rateValue" DOUBLE PRECISION NOT NULL,
    "newsItems" JSONB NOT NULL,
    "pageContent" TEXT NOT NULL,
    "metaTitle" TEXT NOT NULL,
    "metaDesc" TEXT NOT NULL,
    "keywords" TEXT[],
    "eventDate" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "tweetPosted" BOOLEAN NOT NULL DEFAULT false,
    "googleIndexed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CurrencyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexingQueue" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "pageType" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttempt" TIMESTAMP(3),
    "success" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndexingQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockEvent_slug_key" ON "StockEvent"("slug");

-- CreateIndex
CREATE INDEX "StockEvent_symbol_idx" ON "StockEvent"("symbol");

-- CreateIndex
CREATE INDEX "StockEvent_eventDate_idx" ON "StockEvent"("eventDate");

-- CreateIndex
CREATE INDEX "StockEvent_eventType_idx" ON "StockEvent"("eventType");

-- CreateIndex
CREATE INDEX "StockEvent_changePercent_idx" ON "StockEvent"("changePercent");

-- CreateIndex
CREATE INDEX "StockEvent_publishedAt_idx" ON "StockEvent"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "IndexEvent_slug_key" ON "IndexEvent"("slug");

-- CreateIndex
CREATE INDEX "IndexEvent_indexSymbol_idx" ON "IndexEvent"("indexSymbol");

-- CreateIndex
CREATE INDEX "IndexEvent_eventDate_idx" ON "IndexEvent"("eventDate");

-- CreateIndex
CREATE UNIQUE INDEX "MetalEvent_slug_key" ON "MetalEvent"("slug");

-- CreateIndex
CREATE INDEX "MetalEvent_metal_idx" ON "MetalEvent"("metal");

-- CreateIndex
CREATE INDEX "MetalEvent_eventDate_idx" ON "MetalEvent"("eventDate");

-- CreateIndex
CREATE UNIQUE INDEX "CommodityEvent_slug_key" ON "CommodityEvent"("slug");

-- CreateIndex
CREATE INDEX "CommodityEvent_commodity_idx" ON "CommodityEvent"("commodity");

-- CreateIndex
CREATE INDEX "CommodityEvent_eventDate_idx" ON "CommodityEvent"("eventDate");

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyEvent_slug_key" ON "CurrencyEvent"("slug");

-- CreateIndex
CREATE INDEX "CurrencyEvent_pair_idx" ON "CurrencyEvent"("pair");

-- CreateIndex
CREATE INDEX "CurrencyEvent_eventDate_idx" ON "CurrencyEvent"("eventDate");

-- CreateIndex
CREATE UNIQUE INDEX "IndexingQueue_url_key" ON "IndexingQueue"("url");

-- CreateIndex
CREATE INDEX "IndexingQueue_success_idx" ON "IndexingQueue"("success");
