import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  try {
    const res = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from('1571383:6f4603d2e23455fed4fa3dc05fbeb7aa988bdb63').toString('base64')}`,
      },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent('https://niftypulse360.com/pinterest/callback')}`,
      signal: AbortSignal.timeout(15000),
    })

    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed', details: data }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Copy access_token and add as PINTEREST_ACCESS_TOKEN in Railway',
      access_token: data.access_token,
      expires_in: data.expires_in,
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    return NextResponse.json({ error: 'Failed', details: err.message }, { status: 500 })
  }
}
