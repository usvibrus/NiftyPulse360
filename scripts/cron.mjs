const BASE = process.env.CRON_URL || 'https://niftypulse360-production.up.railway.app'
const SECRET = process.env.CRON_SECRET

// Get current IST hour
const nowUTC = new Date()
const istHour = (nowUTC.getUTCHours() + 5) % 24 + (nowUTC.getUTCMinutes() + 30 >= 60 ? 1 : 0)
const istMinute = (nowUTC.getUTCMinutes() + 30) % 60

console.log(`[cron] IST time: ${istHour}:${String(istMinute).padStart(2, '0')}`)

// Always run: stock market data (during market hours 9-16 IST)
const endpoints = []

if (istHour >= 9 && istHour <= 16) {
  endpoints.push('/api/cron/stocks', '/api/cron/indices', '/api/cron/gold', '/api/cron/commodities')
}

// IPO cron: every run during 9-16 IST (same as stocks)
if (istHour >= 9 && istHour <= 16) {
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

// Fallback: if no endpoints matched (off-hours), still run IPO for GMP updates
if (endpoints.length === 0) {
  endpoints.push('/api/cron/ipo')
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
