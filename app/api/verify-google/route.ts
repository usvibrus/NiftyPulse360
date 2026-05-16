import { NextResponse } from 'next/server'
import { google } from 'googleapis'

// Step 1: GET — get a verification token to add to DNS
// Step 2: POST — verify ownership after DNS record is added
//
// Usage:
// 1. GET https://niftypulse360.com/api/verify-google?action=token
//    Returns a TXT record value to add to your DNS
// 2. Add the TXT record to your DNS (Cloudflare, etc.)
// 3. Wait 5 mins for DNS propagation
// 4. POST https://niftypulse360.com/api/verify-google
//    Verifies ownership

export async function GET(request: Request) {
  const url = new URL(request.url)
  const action = url.searchParams.get('action') || 'token'
  const site = 'https://niftypulse360.com/'

  const email = process.env.GOOGLE_INDEXING_SA_EMAIL
  const privateKey = process.env.GOOGLE_INDEXING_SA_PRIVATE_KEY
  if (!email || !privateKey) return NextResponse.json({ error: 'No credentials' }, { status: 500 })

  const auth = new google.auth.JWT({
    email,
    key: privateKey.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/siteverification'],
  })
  const verification = google.siteVerification({ version: 'v1', auth })

  try {
    if (action === 'token') {
      // Request a verification token via DNS TXT method
      const tokenRes = await verification.webResource.getToken({
        requestBody: {
          site: { type: 'INET_DOMAIN', identifier: 'niftypulse360.com' },
          verificationMethod: 'DNS_TXT',
        },
      })

      return NextResponse.json({
        message: 'Add this TXT record to your DNS, wait 5 mins, then call POST on this same endpoint',
        dnsRecord: {
          type: 'TXT',
          host: '@ (or niftypulse360.com)',
          value: tokenRes.data.token,
        },
        nextStep: 'POST https://niftypulse360.com/api/verify-google to complete verification',
      })
    }

    if (action === 'list') {
      const list = await verification.webResource.list()
      return NextResponse.json({ verified: list.data.items || [] })
    }

    return NextResponse.json({ error: 'Unknown action. Use ?action=token or ?action=list' }, { status: 400 })
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { data?: unknown } }
    return NextResponse.json({ error: err.message, details: err.response?.data }, { status: 500 })
  }
}

export async function POST() {
  const email = process.env.GOOGLE_INDEXING_SA_EMAIL
  const privateKey = process.env.GOOGLE_INDEXING_SA_PRIVATE_KEY
  if (!email || !privateKey) return NextResponse.json({ error: 'No credentials' }, { status: 500 })

  const auth = new google.auth.JWT({
    email,
    key: privateKey.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/siteverification'],
  })
  const verification = google.siteVerification({ version: 'v1', auth })

  try {
    const result = await verification.webResource.insert({
      verificationMethod: 'DNS_TXT',
      requestBody: {
        site: { type: 'INET_DOMAIN', identifier: 'niftypulse360.com' },
      },
    })
    return NextResponse.json({
      success: true,
      message: 'Service account is now a verified owner!',
      details: result.data,
    })
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { data?: unknown } }
    return NextResponse.json({
      error: err.message,
      details: err.response?.data,
      hint: 'Make sure you added the DNS TXT record from GET ?action=token and waited 5 mins',
    }, { status: 500 })
  }
}
