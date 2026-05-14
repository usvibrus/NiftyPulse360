import axios from 'axios'
import { google } from 'googleapis'
import { prisma } from '@/lib/db/prisma'

async function pingIndexNow(urls: string[]) {
  const key = process.env.INDEXNOW_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!key || !siteUrl) return

  try {
    await axios.post('https://api.indexnow.org/indexnow', {
      host: new URL(siteUrl).hostname,
      key,
      keyLocation: `${siteUrl}/${key}.txt`,
      urlList: urls,
    })
    console.log(`[indexing] IndexNow pinged ${urls.length} URLs`)
  } catch (error) {
    console.error('[indexing] IndexNow failed:', error)
  }
}

async function pingGoogleIndexing(url: string) {
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

export async function processIndexingQueue() {
  const pending = await prisma.indexingQueue.findMany({
    where: { success: false, attempts: { lt: 3 } },
    take: 200,
  })

  if (pending.length === 0) return { processed: 0 }

  // Batch IndexNow
  const urls = pending.map(p => p.url)
  await pingIndexNow(urls)

  // Google Indexing API (one by one, max 200/day)
  let googleSuccess = 0
  for (const item of pending) {
    const success = await pingGoogleIndexing(item.url)
    await prisma.indexingQueue.update({
      where: { id: item.id },
      data: { attempts: { increment: 1 }, lastAttempt: new Date(), success },
    })
    if (success) googleSuccess++
  }

  return { processed: pending.length, googleSuccess }
}
