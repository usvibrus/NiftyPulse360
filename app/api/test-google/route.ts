import { NextResponse } from 'next/server'
import { getGoogleAccessToken } from '@/lib/services/googleAuthLite'

export async function GET() {
  const email = process.env.GOOGLE_INDEXING_SA_EMAIL
  const privateKey = process.env.GOOGLE_INDEXING_SA_PRIVATE_KEY

  if (!email || !privateKey) {
    return NextResponse.json({ error: 'Service account credentials not configured' }, { status: 500 })
  }

  try {
    // Test 1: Search Console - can we list sites?
    const scToken = await getGoogleAccessToken(email, privateKey, 'https://www.googleapis.com/auth/webmasters.readonly')
    const sitesRes = await fetch('https://searchconsole.googleapis.com/webmasters/v1/sites', {
      headers: { Authorization: `Bearer ${scToken}` },
      signal: AbortSignal.timeout(10000),
    })
    const sitesData = await sitesRes.json()
    const siteEntries = sitesData.siteEntry || []

    // Test 2: Indexing API - verify auth works
    const indexToken = await getGoogleAccessToken(email, privateKey, 'https://www.googleapis.com/auth/indexing')

    return NextResponse.json({
      success: true,
      serviceAccountEmail: email,
      searchConsole: {
        sitesAccessible: siteEntries.length,
        sites: siteEntries,
      },
      indexingApiAuth: indexToken ? 'OK' : 'FAILED',
      nextSteps: siteEntries.length > 0
        ? 'Service account has access — Indexing API should work now'
        : `Service account is NOT yet added as owner. Add ${email} as Owner in Search Console.`,
    })
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { data?: unknown } }
    return NextResponse.json({
      success: false,
      error: err.message,
      details: err.response?.data,
    }, { status: 500 })
  }
}
