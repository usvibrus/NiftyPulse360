/**
 * One-shot cleanup for corrupted MetalEvent records.
 *
 * Marks as unpublished any metal event with:
 *  - pricePerOunce too low to be real (< ₹10K/oz for silver, < ₹1L/oz for gold)
 *  - pricePerOunce too high to be real (> ₹5L/oz for silver, > ₹20L/oz for gold)
 *  - pricePerGram <= 0
 *  - changePercent > 1000 (no metal moves 1000% in a day)
 *
 * Run with: npx tsx scripts/cleanCorruptedMetals.ts
 */

import { prisma } from '../lib/db/prisma'

async function main() {
  console.log('[clean] Scanning MetalEvent table for corrupted records...')

  const corrupted = await prisma.metalEvent.findMany({
    where: {
      OR: [
        { pricePerGram: { lte: 0 } },
        { changePercent: { gt: 1000 } },
        { AND: [{ metal: 'GOLD' }, { OR: [{ pricePerOunce: { lt: 100000 } }, { pricePerOunce: { gt: 2000000 } }] }] },
        { AND: [{ metal: 'SILVER' }, { OR: [{ pricePerOunce: { lt: 10000 } }, { pricePerOunce: { gt: 500000 } }] }] },
      ],
    },
    select: { id: true, metal: true, pricePerGram: true, pricePerOunce: true, changePercent: true, eventDate: true },
  })

  if (corrupted.length === 0) {
    console.log('[clean] No corrupted records found. Nothing to do.')
    return
  }

  console.log(`[clean] Found ${corrupted.length} corrupted records:`)
  for (const r of corrupted) {
    console.log(`  - ${r.metal} | ${r.eventDate.toISOString().slice(0, 10)} | ₹${r.pricePerOunce.toFixed(2)}/oz | ₹${r.pricePerGram.toFixed(2)}/g | change ${r.changePercent.toFixed(2)}%`)
  }

  const result = await prisma.metalEvent.updateMany({
    where: { id: { in: corrupted.map(r => r.id) } },
    data: { isPublished: false },
  })

  console.log(`[clean] Marked ${result.count} record(s) as unpublished. Done.`)
}

main()
  .catch(e => {
    console.error('[clean] Failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

// Script validated
