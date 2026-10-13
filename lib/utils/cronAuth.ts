import { timingSafeEqual } from 'crypto'

/**
 * Verifies the `Authorization: Bearer <CRON_SECRET>` header used by cron/admin routes.
 *
 * Fails closed when CRON_SECRET is not configured (otherwise the expected value would be
 * the literal "Bearer undefined"), and compares in constant time.
 */
export function verifyCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const actual = Buffer.from(request.headers.get('Authorization') ?? '')
  const expected = Buffer.from(`Bearer ${secret}`)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
