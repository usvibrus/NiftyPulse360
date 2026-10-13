import { NextResponse } from 'next/server'

// Step 1: Visit this URL to authorize:
// https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=77cuimrjskhutc&redirect_uri=https://niftypulse360.com/api/linkedin&scope=w_member_social%20w_organization_social%20r_organization_social

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (!code) {
    // Redirect to LinkedIn auth
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_SITE_URL + '/api/linkedin')}&scope=w_member_social%20w_organization_social%20r_organization_social`
    return NextResponse.redirect(authUrl)
  }

  // Exchange code for access token
  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.NEXT_PUBLIC_SITE_URL + '/api/linkedin',
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    })
    const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: AbortSignal.timeout(15000),
    })

    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to get token', details: data }, { status: 500 })
    }

    // IMPORTANT: Copy this access_token and set it as LINKEDIN_ACCESS_TOKEN in Railway
    return NextResponse.json({
      message: 'Copy the access_token below and add it as LINKEDIN_ACCESS_TOKEN in Railway',
      access_token: data.access_token,
      expires_in: data.expires_in,
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    return NextResponse.json({ error: 'Failed to get token', details: err.message }, { status: 500 })
  }
}
