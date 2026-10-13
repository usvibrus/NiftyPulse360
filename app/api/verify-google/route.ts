import { NextResponse } from 'next/server'
import { getGoogleAccessToken } from '@/lib/services/googleAuthLite'
import { verifyCronAuth } from '@/lib/utils/cronAuth'

// Step 1: GET — get a verification token to add to DNS
// Step 2: POST — verify ownership after DNS record is added
// Both steps act on the site's Google account, so they require Bearer CRON_SECRET.

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const action = url.searchParams.get('action') || 'token'

  const email = process.env.GOOGLE_INDEXING_SA_EMAIL
  const privateKey = process.env.GOOGLE_INDEXING_SA_PRIVATE_KEY
  if (!email || !privateKey) return NextResponse.json({ error: 'No credentials' }, { status: 500 })

  try {
    const token = await getGoogleAccessToken(email, privateKey, 'https://www.googleapis.com/auth/siteverification')
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

    if (action === 'token') {
      const res = await fetch('https://www.googleapis.com/siteVerification/v1/token', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          site: { type: 'INET_DOMAIN', identifier: 'niftypulse360.com' },
          verificationMethod: 'DNS_TXT',
        }),
        signal: AbortSignal.timeout(10000),
      })
      const data = await res.json()

      return NextResponse.json({
        message: 'Add this TXT record to your DNS, wait 5 mins, then call POST on this same endpoint',
        dnsRecord: {
          type: 'TXT',
          host: '@ (or niftypulse360.com)',
          value: data.token,
        },
        nextStep: 'POST https://niftypulse360.com/api/verify-google to complete verification',
      })
    }

    if (action === 'list') {
      const res = await fetch('https://www.googleapis.com/siteVerification/v1/webResource', {
        headers,
        signal: AbortSignal.timeout(10000),
      })
      const data = await res.json()
      return NextResponse.json({ verified: data.items || [] })
    }

    return NextResponse.json({ error: 'Unknown action. Use ?action=token or ?action=list' }, { status: 400 })
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { data?: unknown } }
    return NextResponse.json({ error: err.message, details: err.response?.data }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const email = process.env.GOOGLE_INDEXING_SA_EMAIL
  const privateKey = process.env.GOOGLE_INDEXING_SA_PRIVATE_KEY
  if (!email || !privateKey) return NextResponse.json({ error: 'No credentials' }, { status: 500 })

  try {
    const token = await getGoogleAccessToken(email, privateKey, 'https://www.googleapis.com/auth/siteverification')
    const res = await fetch('https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=DNS_TXT', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site: { type: 'INET_DOMAIN', identifier: 'niftypulse360.com' },
      }),
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({
        error: data.error?.message || 'Verification failed',
        details: data,
        hint: 'Make sure you added the DNS TXT record from GET ?action=token and waited 5 mins',
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Service account is now a verified owner!',
      details: data,
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
