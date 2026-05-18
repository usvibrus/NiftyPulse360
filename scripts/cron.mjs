const BASE = process.env.CRON_URL || 'https://niftypulse360-production.up.railway.app'
const SECRET = process.env.CRON_SECRET

const endpoints = ['/api/cron/stocks', '/api/cron/indices', '/api/cron/gold', '/api/cron/commodities']

async function run() {
  for (const ep of endpoints) {
    try {
      const res = await fetch(`${BASE}${ep}`, { method: 'POST', headers: { Authorization: `Bearer ${SECRET}` } })
      console.log(`${ep}: ${res.status}`)
    } catch (e) {
      console.error(`${ep}: FAILED`, e.message)
    }
  }
}

run()
