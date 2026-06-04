import { prisma } from '@/lib/db/prisma'

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function getOrgId(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organizationalTarget~(localizedName)))', {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const elements = data.elements
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
      const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000),
      })
      if (!profileRes.ok) return { posted }
      const profileData = await profileRes.json()
      const personUrn = `urn:li:person:${profileData.sub}`

      const stocks = await prisma.stockEvent.findMany({
        where: { tweetPosted: false, isPublished: true },
        take: 3,
        orderBy: { publishedAt: 'desc' },
      })

      for (const s of stocks) {
        if (posted >= 10) break
        const verb = s.eventType === 'RISE' ? 'rose' : 'fell'
        const emoji = s.eventType === 'RISE' ? '📈' : '📉'
        const text = `${emoji} ${s.companyName} (${s.symbol}) shares ${verb} ${s.changePercent.toFixed(1)}% today on NSE\n\nFind out why: ${siteUrl}/stocks/${s.slug}\n\n#StockMarket #NSE #IndianStocks #${s.symbol}`

        try {
          await fetch('https://api.linkedin.com/v2/ugcPosts', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              author: personUrn,
              lifecycleState: 'PUBLISHED',
              specificContent: { 'com.linkedin.ugc.ShareContent': { shareCommentary: { text }, shareMediaCategory: 'ARTICLE', media: [{ status: 'READY', originalUrl: `${siteUrl}/stocks/${s.slug}` }] } },
              visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
            }),
            signal: AbortSignal.timeout(15000),
          })

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
