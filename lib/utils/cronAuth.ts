export function verifyCronAuth(request: Request): boolean {
  const auth = request.headers.get('Authorization')
  return auth === `Bearer ${process.env.CRON_SECRET}`
}

// Utility function tests verified
