import axios from 'axios'
import { prisma } from '@/lib/db/prisma'
import { startOfDay } from 'date-fns'

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function getOrgId(accessToken: string): Promise<string | null> {
  try {
    const res = await axios.get('https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organizationalTarget~(localizedName)))', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const elements = res.data.elements
    if (elements && elements.length > 0) {
      return elements[0].organizationalTarget
    }
    return null
  } catch {
    return null
  }
}

export async function postToLinkedIn() {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN
  if (!accessToken) { console.log('[linkedin] No access token configured'); return { posted: 0 } }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  let posted = 0

  // Get org URN or use person URN
  const orgId = await getOrgId(accessToken)
  const author = orgId || 'unknown'

  if (author === 'unknown') {
    // Try posting as person
    try {
      const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const personUrn = `urn:li:person:${profileRes.data.sub}`

      const stocks = await prisma.stockEvent.findMany({
        where: { tweetPosted: false, isPublished: true, publishedAt: { gte: startOfDay(new Date()) } },
        take: 3,
        orderBy: { changePercent: 'desc' },
      })

      for (const s of stocks) {
        if (posted >= 3) break
        const verb = s.eventType === 'RISE' ? 'rose' : 'fell'
        const emoji = s.eventType === 'RISE' ? '📈' : '📉'
        const text = `${emoji} ${s.companyName} (${s.symbol}) shares ${verb} ${s.changePercent.toFixed(1)}% today on NSE\n\nFind out why: ${siteUrl}/stocks/${s.slug}\n\n#StockMarket #NSE #IndianStocks #${s.symbol}`

        try {
          await axios.post('https://api.linkedin.com/v2/ugcPosts', {
            author: personUrn,
            lifecycleState: 'PUBLISHED',
            specificContent: { 'com.linkedin.ugc.ShareContent': { shareCommentary: { text }, shareMediaCategory: 'ARTICLE', media: [{ status: 'READY', originalUrl: `${siteUrl}/stocks/${s.slug}` }] } },
            visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
          }, { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } })

          await prisma.stockEvent.update({ where: { id: s.id }, data: { tweetPosted: true } })
          posted++
          await delay(5000)
        } catch (error) {
          console.error(`[linkedin] Failed to post ${s.symbol}:`, error)
        }
      }
    } catch (error) {
      console.error('[linkedin] Failed to get profile:', error)
    }
  }

  return { posted }
}
