/**
 * Export all data from the database as SQL INSERT statements.
 *
 * Usage:
 *   npx tsx scripts/sql/export-data.ts
 *
 * Output:
 *   scripts/sql/002_data.sql — contains INSERT statements for every row in every table
 *
 * Requires DATABASE_URL in .env
 */

import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

function escapeStr(val: unknown): string {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'boolean') return val ? 'true' : 'false'
  if (typeof val === 'number') return String(val)
  if (typeof val === 'bigint') return String(val)
  if (val instanceof Date) return `'${val.toISOString()}'`
  if (Array.isArray(val)) {
    if (val.length === 0) return "ARRAY[]::TEXT[]"
    const items = val.map(v => `'${String(v).replace(/'/g, "''")}'`)
    return `ARRAY[${items.join(',')}]::TEXT[]`
  }
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::JSONB`
  }
  return `'${String(val).replace(/'/g, "''")}'`
}

function buildInsert(table: string, rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return `-- ${table}: no data\n`

  const columns = Object.keys(rows[0])
  const colList = columns.map(c => `"${c}"`).join(', ')
  const lines: string[] = []

  lines.push(`-- ${table}: ${rows.length} rows`)
  lines.push(`-- Inserting with conflict handling (skip duplicates)`)
  lines.push('')

  for (const row of rows) {
    const values = columns.map(col => escapeStr(row[col])).join(', ')
    lines.push(`INSERT INTO "${table}" (${colList}) VALUES (${values}) ON CONFLICT DO NOTHING;`)
  }

  lines.push('')
  return lines.join('\n')
}

async function main() {
  console.log('Connecting to database...')

  const output: string[] = []
  output.push('-- NiftyPulse360 Full Data Export')
  output.push(`-- Generated: ${new Date().toISOString()}`)
  output.push('-- Run 001_schema.sql first, then this file')
  output.push('')
  output.push('BEGIN;')
  output.push('')

  // StockEvent
  console.log('Exporting StockEvent...')
  const stocks = await prisma.stockEvent.findMany({ orderBy: { eventDate: 'asc' } })
  output.push(buildInsert('StockEvent', stocks as unknown as Record<string, unknown>[]))

  // IndexEvent
  console.log('Exporting IndexEvent...')
  const indices = await prisma.indexEvent.findMany({ orderBy: { eventDate: 'asc' } })
  output.push(buildInsert('IndexEvent', indices as unknown as Record<string, unknown>[]))

  // MetalEvent
  console.log('Exporting MetalEvent...')
  const metals = await prisma.metalEvent.findMany({ orderBy: { eventDate: 'asc' } })
  output.push(buildInsert('MetalEvent', metals as unknown as Record<string, unknown>[]))

  // CommodityEvent
  console.log('Exporting CommodityEvent...')
  const commodities = await prisma.commodityEvent.findMany({ orderBy: { eventDate: 'asc' } })
  output.push(buildInsert('CommodityEvent', commodities as unknown as Record<string, unknown>[]))

  // CurrencyEvent
  console.log('Exporting CurrencyEvent...')
  const currencies = await prisma.currencyEvent.findMany({ orderBy: { eventDate: 'asc' } })
  output.push(buildInsert('CurrencyEvent', currencies as unknown as Record<string, unknown>[]))

  // IpoEvent
  console.log('Exporting IpoEvent...')
  const ipos = await prisma.ipoEvent.findMany({ orderBy: { publishedAt: 'asc' } })
  output.push(buildInsert('IpoEvent', ipos as unknown as Record<string, unknown>[]))

  // MarketWrap
  console.log('Exporting MarketWrap...')
  const wraps = await prisma.marketWrap.findMany({ orderBy: { wrapDate: 'asc' } })
  output.push(buildInsert('MarketWrap', wraps as unknown as Record<string, unknown>[]))

  // PreMarketData
  console.log('Exporting PreMarketData...')
  const preMarket = await prisma.preMarketData.findMany({ orderBy: { dataDate: 'asc' } })
  output.push(buildInsert('PreMarketData', preMarket as unknown as Record<string, unknown>[]))

  // IndexingQueue
  console.log('Exporting IndexingQueue...')
  const queue = await prisma.indexingQueue.findMany({ orderBy: { createdAt: 'asc' } })
  output.push(buildInsert('IndexingQueue', queue as unknown as Record<string, unknown>[]))

  output.push('COMMIT;')
  output.push('')

  const outPath = join(__dirname, '002_data.sql')
  writeFileSync(outPath, output.join('\n'), 'utf-8')

  const totalRows = stocks.length + indices.length + metals.length + commodities.length +
    currencies.length + ipos.length + wraps.length + preMarket.length + queue.length

  console.log(`\nExport complete!`)
  console.log(`Total rows: ${totalRows}`)
  console.log(`  StockEvent:     ${stocks.length}`)
  console.log(`  IndexEvent:     ${indices.length}`)
  console.log(`  MetalEvent:     ${metals.length}`)
  console.log(`  CommodityEvent: ${commodities.length}`)
  console.log(`  CurrencyEvent:  ${currencies.length}`)
  console.log(`  IpoEvent:       ${ipos.length}`)
  console.log(`  MarketWrap:     ${wraps.length}`)
  console.log(`  PreMarketData:  ${preMarket.length}`)
  console.log(`  IndexingQueue:  ${queue.length}`)
  console.log(`\nOutput: ${outPath}`)
}

main()
  .catch(e => { console.error('Export failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
