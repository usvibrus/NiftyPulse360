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

// One in-flight token request per scope, so parallel callers (e.g. 10 concurrent
// Indexing API pings on a cold cache) share a single OAuth round-trip.
const inflight = new Map<string, Promise<string>>()

export async function getGoogleAccessToken(email: string, rawKey: string, scope: string): Promise<string> {
  const now = Date.now()
  if (cachedToken && cachedToken.scope === scope && cachedToken.expiresAt > now + 60000) {
    return cachedToken.token
  }

  const pending = inflight.get(scope)
  if (pending) return pending

  const request = requestAccessToken(email, rawKey, scope).finally(() => inflight.delete(scope))
  inflight.set(scope, request)
  return request
}

async function requestAccessToken(email: string, rawKey: string, scope: string): Promise<string> {
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

  const data = await res.json() as { access_token?: string; expires_in?: number }
  // A missing access_token would otherwise be sent as "Bearer undefined", and a missing
  // expires_in made expiresAt NaN so the token was never reused.
  if (!data.access_token) throw new Error('Google OAuth response is missing access_token')

  cachedToken = {
    token: data.access_token,
    scope,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  }
  return data.access_token
}
