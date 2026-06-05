import crypto from 'crypto'

function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf.toString('base64url')
}

function createJWT(email: string, privateKey: string, scope: string): string {
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({
    iss: email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))

  const signInput = `${header}.${payload}`
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(signInput)
  const signature = sign.sign(privateKey, 'base64url')

  return `${signInput}.${signature}`
}

let cachedToken: { token: string; scope: string; expiresAt: number } | null = null

export async function getGoogleAccessToken(email: string, rawKey: string, scope: string): Promise<string> {
  const now = Date.now()
  if (cachedToken && cachedToken.scope === scope && cachedToken.expiresAt > now + 60000) {
    return cachedToken.token
  }

  const privateKey = rawKey.replace(/\\n/g, '\n')
  const jwt = createJWT(email, privateKey, scope)

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google OAuth failed (${res.status}): ${body.slice(0, 200)}`)
  }

  const data = await res.json()
  cachedToken = {
    token: data.access_token,
    scope,
    expiresAt: now + (data.expires_in * 1000),
  }
  return data.access_token
}
