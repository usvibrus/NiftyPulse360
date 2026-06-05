-- CreateTable
CREATE TABLE "IpoEvent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "symbol" TEXT,
    "ipoType" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priceBandMin" DOUBLE PRECISION,
    "priceBandMax" DOUBLE PRECISION,
    "issuePrice" DOUBLE PRECISION,
    "lotSize" INTEGER,
    "issueSizeCr" DOUBLE PRECISION,
    "freshIssue" DOUBLE PRECISION,
    "offerForSale" DOUBLE PRECISION,
    "openDate" TIMESTAMP(3),
    "closeDate" TIMESTAMP(3),
    "allotmentDate" TIMESTAMP(3),
    "refundDate" TIMESTAMP(3),
    "listingDate" TIMESTAMP(3),
    "gmpValue" DOUBLE PRECISION,
    "gmpPercent" DOUBLE PRECISION,
    "gmpHistory" JSONB,
    "gmpUpdatedAt" TIMESTAMP(3),
    "subscriptionData" JSONB,
    "subscriptionUpdatedAt" TIMESTAMP(3),
    "listingPrice" DOUBLE PRECISION,
    "listingGainLoss" DOUBLE PRECISION,
    "listingDayClose" DOUBLE PRECISION,
    "currentPrice" DOUBLE PRECISION,
    "aboutCompany" TEXT,
    "promoterHolding" DOUBLE PRECISION,
    "financials" JSONB,
    "objectOfIssue" TEXT,
    "registrarName" TEXT,
    "registrarUrl" TEXT,
    "leadManagers" TEXT[],
    "aiAnalysis" TEXT,
    "faqContent" JSONB,
    "pageContent" TEXT,
    "metaTitle" TEXT NOT NULL,
    "metaDesc" TEXT NOT NULL,
    "keywords" TEXT[],
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "googleIndexed" BOOLEAN NOT NULL DEFAULT false,
    "tweetPosted" BOOLEAN NOT NULL DEFAULT false,
    "listingSlug" TEXT,
    "listingPageContent" TEXT,
    "listingMetaTitle" TEXT,
    "listingMetaDesc" TEXT,
    "listingPublishedAt" TIMESTAMP(3),

    CONSTRAINT "IpoEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketWrap" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "wrapDate" TIMESTAMP(3) NOT NULL,
    "niftyClose" DOUBLE PRECISION,
    "niftyChange" DOUBLE PRECISION,
    "niftyChangePct" DOUBLE PRECISION,
    "sensexClose" DOUBLE PRECISION,
    "sensexChange" DOUBLE PRECISION,
    "sensexChangePct" DOUBLE PRECISION,
    "bankNiftyClose" DOUBLE PRECISION,
    "bankNiftyChange" DOUBLE PRECISION,
    "topGainers" JSONB,
    "topLosers" JSONB,
    "sectorSummary" JSONB,
    "aiSummary" TEXT,
    "pageContent" TEXT NOT NULL,
    "metaTitle" TEXT NOT NULL,
    "metaDesc" TEXT NOT NULL,
    "keywords" TEXT[],
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "googleIndexed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MarketWrap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreMarketData" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "dataDate" TIMESTAMP(3) NOT NULL,
    "giftNifty" DOUBLE PRECISION,
    "giftNiftyChange" DOUBLE PRECISION,
    "giftNiftyPct" DOUBLE PRECISION,
    "dowJones" DOUBLE PRECISION,
    "dowChange" DOUBLE PRECISION,
    "sp500" DOUBLE PRECISION,
    "sp500Change" DOUBLE PRECISION,
    "nasdaq" DOUBLE PRECISION,
    "nasdaqChange" DOUBLE PRECISION,
    "crudeOil" DOUBLE PRECISION,
    "crudeChange" DOUBLE PRECISION,
    "goldPrice" DOUBLE PRECISION,
    "goldChange" DOUBLE PRECISION,
    "usdInr" DOUBLE PRECISION,
    "usdInrChange" DOUBLE PRECISION,
    "nikkei" DOUBLE PRECISION,
    "nikkeiChange" DOUBLE PRECISION,
    "hangSeng" DOUBLE PRECISION,
    "hangSengChange" DOUBLE PRECISION,
    "aiExpectation" TEXT,
    "pageContent" TEXT NOT NULL,
    "metaTitle" TEXT NOT NULL,
    "metaDesc" TEXT NOT NULL,
    "keywords" TEXT[],
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "googleIndexed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PreMarketData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IpoEvent_slug_key" ON "IpoEvent"("slug");
CREATE UNIQUE INDEX "IpoEvent_listingSlug_key" ON "IpoEvent"("listingSlug");
CREATE INDEX "IpoEvent_status_idx" ON "IpoEvent"("status");
CREATE INDEX "IpoEvent_ipoType_idx" ON "IpoEvent"("ipoType");
CREATE INDEX "IpoEvent_openDate_idx" ON "IpoEvent"("openDate");
CREATE INDEX "IpoEvent_listingDate_idx" ON "IpoEvent"("listingDate");
CREATE INDEX "IpoEvent_publishedAt_idx" ON "IpoEvent"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketWrap_slug_key" ON "MarketWrap"("slug");
CREATE UNIQUE INDEX "MarketWrap_wrapDate_key" ON "MarketWrap"("wrapDate");
CREATE INDEX "MarketWrap_wrapDate_idx" ON "MarketWrap"("wrapDate");

-- CreateIndex
CREATE UNIQUE INDEX "PreMarketData_slug_key" ON "PreMarketData"("slug");
CREATE UNIQUE INDEX "PreMarketData_dataDate_key" ON "PreMarketData"("dataDate");
CREATE INDEX "PreMarketData_dataDate_idx" ON "PreMarketData"("dataDate");
