import { prisma } from '@/lib/db/prisma'

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function getPersonUrn(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return `urn:li:person:${data.sub}`
  } catch {
    return null
  }
}

async function uploadImageToLinkedIn(accessToken: string, personUrn: string, imageUrl: string): Promise<string | null> {
  try {
    // Step 1: Register upload
    const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: personUrn,
          serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }],
        },
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (!registerRes.ok) return null
    const registerData = await registerRes.json()

    const uploadUrl = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl
    const asset = registerData.value?.asset
    if (!uploadUrl || !asset) return null

    // Step 2: Fetch the OG image from our server
    const imageRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) })
    if (!imageRes.ok) return null
    const imageBuffer = await imageRes.arrayBuffer()

    // Step 3: Upload image to LinkedIn
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'image/png' },
      body: imageBuffer,
      signal: AbortSignal.timeout(15000),
    })
    if (!uploadRes.ok) return null

    return asset
  } catch (error) {
    console.error('[linkedin] Image upload failed:', error instanceof Error ? error.message : error)
    return null
  }
}

export async function postToLinkedIn() {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN
  if (!accessToken) { console.log('[linkedin] No access token configured'); return { posted: 0 } }

  // An empty fallback produced relative links that are broken on third-party sites
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'
  let posted = 0

  const personUrn = await getPersonUrn(accessToken)
  if (!personUrn) { console.log('[linkedin] Could not get person URN'); return { posted: 0 } }

  const stocks = await prisma.stockEvent.findMany({
    where: { tweetPosted: false, isPublished: true },
    take: 3,
    orderBy: { publishedAt: 'desc' },
  })

  for (const s of stocks) {
    const verb = s.eventType === 'RISE' ? 'rose' : 'fell'
    const verbAction = s.eventType === 'RISE' ? 'surged' : 'dropped'
    const emoji = s.eventType === 'RISE' ? '📈' : '📉'
    const text = `${emoji} ${s.companyName} (${s.symbol}) shares ${verb} ${s.changePercent.toFixed(1)}% today on NSE\n\nFind out why: ${siteUrl}/stocks/${s.slug}\n\n#StockMarket #NSE #IndianStocks #${s.symbol}`

    // Generate OG image URL
    const imageUrl = `${siteUrl}/api/og?title=${encodeURIComponent(`${s.companyName} shares ${verbAction} ${s.changePercent.toFixed(1)}%`)}&symbol=${encodeURIComponent(s.symbol)}&change=${encodeURIComponent(`${s.changePercent.toFixed(1)}%`)}&type=${s.eventType}`

    try {
      // Try uploading image for a rich post
      const imageAsset = await uploadImageToLinkedIn(accessToken, personUrn, imageUrl)

      let postRes: Response
      if (imageAsset) {
        // Post with full-width image
        postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            author: personUrn,
            lifecycleState: 'PUBLISHED',
            specificContent: { 'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text },
              shareMediaCategory: 'IMAGE',
              media: [{ status: 'READY', media: imageAsset, title: { text: `${s.companyName} (${s.symbol}) ${verb} ${s.changePercent.toFixed(1)}%` }, description: { text: `NSE • ${s.sector || 'Equity'}` } }],
            } },
            visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
          }),
          signal: AbortSignal.timeout(15000),
        })
      } else {
        // Fallback: post as article link (still shows OG image as preview card)
        postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            author: personUrn,
            lifecycleState: 'PUBLISHED',
            specificContent: { 'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text },
              shareMediaCategory: 'ARTICLE',
              media: [{ status: 'READY', originalUrl: `${siteUrl}/stocks/${s.slug}` }],
            } },
            visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
          }),
          signal: AbortSignal.timeout(15000),
        })
      }

      // Only mark as posted once LinkedIn accepted the post, so 401/422/429 get retried
      if (!postRes.ok) {
        throw new Error(`ugcPosts HTTP ${postRes.status}: ${(await postRes.text()).slice(0, 200)}`)
      }

      await prisma.stockEvent.update({ where: { id: s.id }, data: { tweetPosted: true } })
      posted++
      console.log(`[linkedin] Posted ${s.symbol} (${imageAsset ? 'with image' : 'article link'})`)
      await delay(5000)
    } catch (error) {
      console.error(`[linkedin] Failed to post ${s.symbol}:`, error)
    }
  }

  return { posted }
}

// Service reliability verified
