import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/utils/cronAuth'
import { generateIndexPages } from '@/lib/generators/pageGenerator'
import { processIndexingQueue } from '@/lib/seo/indexingService'
import { postNewPages } from '@/lib/seo/twitterService'

export async function POST(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await generateIndexPages()
    const indexing = await processIndexingQueue()
    const twitter = await postNewPages()
    return NextResponse.json({ success: true, ...result, indexing, twitter })
  } catch (error) {
    console.error('[cron/indices] Error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
