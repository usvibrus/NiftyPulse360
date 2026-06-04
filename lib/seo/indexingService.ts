import { prisma } from '@/lib/db/prisma'

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'

// LAYER 1: Google Indexing API — direct ping to Google
// googleapis is ~100-150MB in memory, so we dynamic-import it only when needed
async function pingGoogleIndexing(url: string, type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'): Promise<boolean> {
  const email = process.env.GOOGLE_INDEXING_SA_EMAIL
  const privateKey = process.env.GOOGLE_INDEXING_SA_PRIVATE_KEY
  if (!email || !privateKey) {
    console.warn('[indexing] Google Indexing SA credentials missing - skipping')
    return false
  }

  try {
    const { google } = await import('googleapis')
    const auth = new google.auth.JWT({
      email,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/indexing'],
    })
    const indexing = google.indexing({ version: 'v3', auth })
    await indexing.urlNotifications.publish({ requestBody: { url, type } })
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
    await fetch('https://api.indexnow.org/indexnow', {
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
    await fetch(hub, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: AbortSignal.timeout(10000),
    })
    console.log(`[indexing] WebSub hub notified for ${feedUrl}`)
    return true
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[indexing] WebSub ping failed:', msg)
    return false
  }
}

// LAYER 4: Sitemap pings — Google + Bing
async function pingSitemaps(): Promise<{ google: boolean; bing: boolean }> {
  const siteUrl = SITE()
  const sitemaps = [`${siteUrl}/sitemap.xml`, `${siteUrl}/news-sitemap.xml`]
  let googleOk = false
  let bingOk = false

  // Google
  for (const sm of sitemaps) {
    try {
      await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sm)}`, { signal: AbortSignal.timeout(8000) })
      googleOk = true
    } catch {
      // ignore - Google deprecated this endpoint but still returns 200 in many cases
    }
  }
  // Bing
  for (const sm of sitemaps) {
    try {
      await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sm)}`, { signal: AbortSignal.timeout(8000) })
      bingOk = true
    } catch {
      // ignore
    }
  }
  return { google: googleOk, bing: bingOk }
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
      for (let j = 0; j < chunk.length; j++) {
        const item = chunk[j]
        const success = results[j]
        await prisma.indexingQueue.update({
          where: { id: item.id },
          data: { attempts: { increment: 1 }, lastAttempt: new Date(), success },
        })
        if (success) googleSuccess++
      }
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
