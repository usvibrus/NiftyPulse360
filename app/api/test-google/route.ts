import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET() {
  const email = process.env.GOOGLE_INDEXING_SA_EMAIL
  const privateKey = process.env.GOOGLE_INDEXING_SA_PRIVATE_KEY

  if (!email || !privateKey) {
    return NextResponse.json({ error: 'Service account credentials not configured' }, { status: 500 })
  }

  try {
    // Test 1: Search Console - can we list sites?
    const scAuth = new google.auth.JWT({
      email,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    })
    const searchConsole = google.searchconsole({ version: 'v1', auth: scAuth })
    const sitesResponse = await searchConsole.sites.list()

    // Test 2: Indexing API - try a dry test (won't actually publish)
    const indexAuth = new google.auth.JWT({
      email,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/indexing'],
    })
    await indexAuth.authorize()

    return NextResponse.json({
      success: true,
      serviceAccountEmail: email,
      searchConsole: {
        sitesAccessible: sitesResponse.data.siteEntry?.length || 0,
        sites: sitesResponse.data.siteEntry || [],
      },
      indexingApiAuth: 'OK',
      nextSteps: sitesResponse.data.siteEntry && sitesResponse.data.siteEntry.length > 0
        ? '✅ Service account has access — Indexing API should work now'
        : `❌ Service account is NOT yet added as owner. Add ${email} as Owner in Search Console.`,
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
