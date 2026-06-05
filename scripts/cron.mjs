const BASE = process.env.CRON_URL || 'https://niftypulse360-production.up.railway.app'
const SECRET = process.env.CRON_SECRET

// Get current IST time
const nowUTC = new Date()
const istOffsetMs = (5 * 60 + 30) * 60 * 1000
const istDate = new Date(nowUTC.getTime() + istOffsetMs)
const istHour = istDate.getUTCHours()
const istMinute = istDate.getUTCMinutes()
const istDay = istDate.getUTCDay() // 0=Sun, 6=Sat

console.log(`[cron] IST time: ${istHour}:${String(istMinute).padStart(2, '0')} (day: ${istDay})`)

// Skip weekends entirely — market is closed, no data to fetch, let the service sleep
if (istDay === 0 || istDay === 6) {
  console.log('[cron] Weekend — skipping all endpoints to save resources')
  process.exit(0)
}

const endpoints = []

// Stock market data (during market hours 9-16 IST)
if (istHour >= 9 && istHour <= 16) {
  endpoints.push('/api/cron/stocks', '/api/cron/indices', '/api/cron/gold', '/api/cron/commodities')
  endpoints.push('/api/cron/ipo')
}

// Pre-market: 7-8 AM IST window (before market opens at 9:15)
if (istHour >= 7 && istHour <= 8) {
  endpoints.push('/api/cron/pre-market')
}

// Market wrap: 16-17 IST window (after market closes at 3:30 PM)
if (istHour >= 16 && istHour <= 17) {
  endpoints.push('/api/cron/market-wrap')
}

// IPO GMP updates: run once in the evening (19-20 IST) on weekdays
if (istHour >= 19 && istHour <= 20) {
  endpoints.push('/api/cron/ipo')
}

// Off-hours: nothing to do — let the service scale to zero
if (endpoints.length === 0) {
  console.log('[cron] Off-hours — no endpoints to run')
  process.exit(0)
}

async function run() {
  console.log(`[cron] Running ${endpoints.length} endpoints: ${endpoints.join(', ')}`)
  for (const ep of endpoints) {
    try {
      const res = await fetch(`${BASE}${ep}`, { method: 'POST', headers: { Authorization: `Bearer ${SECRET}` } })
      const body = await res.text().catch(() => '')
      console.log(`${ep}: ${res.status} ${body.slice(0, 200)}`)
    } catch (e) {
      console.error(`${ep}: FAILED`, e.message)
    }
  }
}

run()
