import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/utils/cronAuth'
import { generateStockPages } from '@/lib/generators/pageGenerator'
import { processIndexingQueue } from '@/lib/seo/indexingService'

export async function POST(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await generateStockPages()
    const indexing = await processIndexingQueue()
    return NextResponse.json({ success: true, ...result, indexing })
  } catch (error) {
    console.error('[cron/stocks] Error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
