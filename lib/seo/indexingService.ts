import { prisma } from '@/lib/db/prisma'
import { getGoogleAccessToken } from '@/lib/services/googleAuthLite'

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'

// LAYER 1: Google Indexing API — direct REST call (no googleapis SDK)
async function pingGoogleIndexing(url: string, type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'): Promise<boolean> {
  const email = process.env.GOOGLE_INDEXING_SA_EMAIL
  const privateKey = process.env.GOOGLE_INDEXING_SA_PRIVATE_KEY
  if (!email || !privateKey) {
    console.warn('[indexing] Google Indexing SA credentials missing - skipping')
    return false
  }

  try {
    const token = await getGoogleAccessToken(email, privateKey, 'https://www.googleapis.com/auth/indexing')
    const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, type }),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error(`[indexing] Google Indexing HTTP ${res.status} for ${url}: ${body.slice(0, 200)}`)
      return false
    }
    console.log(`[indexing] Google Indexing OK: ${url}`)
    return true
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[indexing] Google Indexing failed for ${url}: ${msg.slice(0, 200)}`)
    return false
  }
}

// LAYER 2: IndexNow — Bing + Yandex (Google does NOT use IndexNow; redundant for Google but harmless)
async function pingIndexNow(urls: string[]): Promise<{ success: boolean; count: number }> {
  const key = process.env.INDEXNOW_KEY
  const siteUrl = SITE()
  if (!key || !siteUrl || urls.length === 0) return { success: false, count: 0 }

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: new URL(siteUrl).hostname,
        key,
        keyLocation: `${siteUrl}/${key}.txt`,
        urlList: urls,
      }),
      signal: AbortSignal.timeout(10000),
    })
    // IndexNow returns 200/202 on success; 4xx means a bad key, host mismatch or rate limit
    if (!res.ok) {
      console.error(`[indexing] IndexNow HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
      return { success: false, count: 0 }
    }
    console.log(`[indexing] IndexNow pinged ${urls.length} URLs (Bing + Yandex + others)`)
    return { success: true, count: urls.length }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[indexing] IndexNow failed:', msg)
    return { success: false, count: 0 }
  }
}

// LAYER 3: WebSub hub push — pushes RSS feed update so subscribers see new content immediately
async function pingWebSub(): Promise<boolean> {
  const siteUrl = SITE()
  const hub = 'https://pubsubhubbub.appspot.com/'
  const feedUrl = `${siteUrl}/feed.xml`
  try {
    const params = new URLSearchParams()
    params.append('hub.mode', 'publish')
    params.append('hub.url', feedUrl)
    const res = await fetch(hub, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: AbortSignal.timeout(10000),
    })
    // The hub answers 204 No Content when the publish ping is accepted
    if (!res.ok) {
      console.error(`[indexing] WebSub HTTP ${res.status} for ${feedUrl}`)
      return false
    }
    console.log(`[indexing] WebSub hub notified for ${feedUrl}`)
    return true
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[indexing] WebSub ping failed:', msg)
    return false
  }
}

// LAYER 4: Sitemap pings — retired.
// Google shut down www.google.com/ping (announced June 2023) and Bing retired its sitemap
// ping in favour of IndexNow, so these four requests per publish only got 404/410 back
// while being reported as success. Sitemaps are discovered via robots.txt and Search
// Console, and Bing is covered by IndexNow above. The signature stays so callers and the
// cron JSON output are unchanged.
async function pingSitemaps(): Promise<{ google: boolean; bing: boolean }> {
  return { google: false, bing: false }
}

// PUBLIC: Immediate post-publish pipeline for a single (or batch of) URL.
// Call this within seconds of creating a page.
export async function pingNewUrl(url: string | string[]): Promise<{
  google: boolean | number
  indexNow: boolean
  webSub: boolean
  sitemaps: { google: boolean; bing: boolean }
}> {
  const urls = Array.isArray(url) ? url : [url]
  if (urls.length === 0) return { google: false, indexNow: false, webSub: false, sitemaps: { google: false, bing: false } }

  const [googleResults, indexNowResult, webSubResult, sitemapsResult] = await Promise.all([
    Promise.all(urls.map(u => pingGoogleIndexing(u))),
    pingIndexNow(urls),
    pingWebSub(),
    pingSitemaps(),
  ])

  const googleSuccess = googleResults.filter(Boolean).length

  return {
    google: urls.length === 1 ? googleResults[0] : googleSuccess,
    indexNow: indexNowResult.success,
    webSub: webSubResult,
    sitemaps: sitemapsResult,
  }
}

// PUBLIC: Process queue (called from cron after page generation)
export async function processIndexingQueue() {
  const pending = await prisma.indexingQueue.findMany({
    where: { success: false, attempts: { lt: 3 } },
    take: 200,
  })

  if (pending.length === 0) {
    return {
      processed: 0,
      googleSuccess: 0,
      indexNow: { success: false, count: 0 },
      webSub: false,
      sitemaps: { google: false, bing: false },
    }
  }

  const urls = pending.map(p => p.url)

  // Run all layers in parallel
  const googlePromise = (async () => {
    let googleSuccess = 0
    for (let i = 0; i < pending.length; i += 10) {
      const chunk = pending.slice(i, i + 10)
      const results = await Promise.all(chunk.map(item => pingGoogleIndexing(item.url)))
      // Two batched UPDATEs per chunk instead of one round-trip per URL (up to 200 per run)
      const okIds = chunk.filter((_, j) => results[j]).map(item => item.id)
      const failedIds = chunk.filter((_, j) => !results[j]).map(item => item.id)
      const now = new Date()
      await prisma.$transaction([
        prisma.indexingQueue.updateMany({
          where: { id: { in: okIds } },
          data: { attempts: { increment: 1 }, lastAttempt: now, success: true },
        }),
        prisma.indexingQueue.updateMany({
          where: { id: { in: failedIds } },
          data: { attempts: { increment: 1 }, lastAttempt: now, success: false },
        }),
      ])
      googleSuccess += okIds.length
    }
    return googleSuccess
  })()

  const indexNowPromise = pingIndexNow(urls)
  const webSubPromise = pingWebSub()
  const sitemapsPromise = pingSitemaps()

  const [googleSuccess, indexNowResult, webSubResult, sitemapsResult] = await Promise.all([
    googlePromise,
    indexNowPromise,
    webSubPromise,
    sitemapsPromise,
  ])

  return {
    processed: pending.length,
    googleSuccess,
    indexNow: indexNowResult,
    webSub: webSubResult,
    sitemaps: sitemapsResult,
  }
}

// Service reliability verified

// verified
