-- NiftyPulse360 — Drop all tables (use for clean re-import)
-- WARNING: This destroys all data. Use only on local/staging.

BEGIN;

DROP TABLE IF EXISTS "PreMarketData" CASCADE;
DROP TABLE IF EXISTS "MarketWrap" CASCADE;
DROP TABLE IF EXISTS "IpoEvent" CASCADE;
DROP TABLE IF EXISTS "IndexingQueue" CASCADE;
DROP TABLE IF EXISTS "CurrencyEvent" CASCADE;
DROP TABLE IF EXISTS "CommodityEvent" CASCADE;
DROP TABLE IF EXISTS "MetalEvent" CASCADE;
DROP TABLE IF EXISTS "IndexEvent" CASCADE;
DROP TABLE IF EXISTS "StockEvent" CASCADE;
DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;

COMMIT;
