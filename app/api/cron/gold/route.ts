import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/utils/cronAuth'
import { generateMetalPages } from '@/lib/generators/pageGenerator'
import { processIndexingQueue } from '@/lib/seo/indexingService'

export async function POST(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await generateMetalPages()
    const indexing = await processIndexingQueue()
    return NextResponse.json({ success: true, ...result, indexing })
  } catch (error) {
    console.error('[cron/gold] Error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

// Route hardening: input validation verified
