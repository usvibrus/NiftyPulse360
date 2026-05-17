import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/utils/cronAuth'
import { generateStockPages } from '@/lib/generators/pageGenerator'
import { processIndexingQueue } from '@/lib/seo/indexingService'
import { postToLinkedIn } from '@/lib/seo/linkedinService'
import { postToPinterest } from '@/lib/seo/pinterestService'
import { postToDevTo } from '@/lib/seo/devtoService'
import { postToTumblr } from '@/lib/seo/tumblrService'

export async function POST(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await generateStockPages()
    const indexing = await processIndexingQueue()
    const linkedin = await postToLinkedIn()
    const pinterest = await postToPinterest()
    const devto = await postToDevTo()
    const tumblr = await postToTumblr()
    return NextResponse.json({ success: true, ...result, indexing, linkedin, pinterest, devto, tumblr })
  } catch (error) {
    console.error('[cron/stocks] Error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
