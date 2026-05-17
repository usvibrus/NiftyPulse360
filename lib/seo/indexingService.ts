import axios from 'axios'
import { google } from 'googleapis'
import { prisma } from '@/lib/db/prisma'

// LAYER 1: Google Indexing API — direct ping to Google
async function pingGoogleIndexing(url: string): Promise<boolean> {
  const email = process.env.GOOGLE_INDEXING_SA_EMAIL
  const privateKey = process.env.GOOGLE_INDEXING_SA_PRIVATE_KEY
  if (!email || !privateKey) return false

  try {
    const auth = new google.auth.JWT({
      email,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/indexing'],
    })
    const indexing = google.indexing({ version: 'v3', auth })
    await indexing.urlNotifications.publish({ requestBody: { url, type: 'URL_UPDATED' } })
    return true
  } catch (error) {
    console.error(`[indexing] Google Indexing failed for ${url}:`, error)
    return false
  }
}

// LAYER 2: IndexNow — Google + Bing + Yandex simultaneously
async function pingIndexNow(urls: string[]): Promise<{ success: boolean; count: number }> {
  const key = process.env.INDEXNOW_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!key || !siteUrl) return { success: false, count: 0 }

  try {
    await axios.post('https://api.indexnow.org/indexnow', {
      host: new URL(siteUrl).hostname,
      key,
      keyLocation: `${siteUrl}/${key}.txt`,
      urlList: urls,
    })
    console.log(`[indexing] IndexNow pinged ${urls.length} URLs (Google + Bing + Yandex)`)
    return { success: true, count: urls.length }
  } catch (error) {
    console.error('[indexing] IndexNow failed:', error)
    return { success: false, count: 0 }
  }
}

export async function processIndexingQueue() {
  const pending = await prisma.indexingQueue.findMany({
    where: { success: false, attempts: { lt: 3 } },
    take: 200,
  })

  if (pending.length === 0) return { processed: 0, indexNow: { success: false, count: 0 }, googleSuccess: 0 }

  const urls = pending.map(p => p.url)

  // Run BOTH layers in parallel — neither depends on the other
  // Layer 1: Google Indexing API (per-URL, parallel batch of 10)
  const googlePromise = (async () => {
    let googleSuccess = 0
    // Process in chunks of 10 in parallel for speed
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

  // Layer 2: IndexNow (single batch call for all URLs)
  const indexNowPromise = pingIndexNow(urls)

  // Wait for both layers to complete
  const [googleSuccess, indexNowResult] = await Promise.all([googlePromise, indexNowPromise])

  return {
    processed: pending.length,
    googleSuccess,
    indexNow: indexNowResult,
  }
}
