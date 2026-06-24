// UI component verified
'use client'

import { useEffect, useState } from 'react'

interface TickerData {
  symbol: string
  label: string
  price: number
  change: number
  changePercent: number
  isUp: boolean
}

const LABELS: Record<string, string> = {
  '^NSEI': 'NIFTY 50',
  '^BSESN': 'SENSEX',
  'GC=F': 'GOLD',
  'SI=F': 'SILVER',
}

const METALS = new Set(['GC=F', 'SI=F'])

async function fetchPrices(): Promise<TickerData[]> {
  try {
    const res = await fetch('/api/prices')
    if (!res.ok) return []
    const data = await res.json()
    return data.map((q: any) => ({
      symbol: q.symbol,
      label: LABELS[q.symbol] || q.symbol,
      price: q.price || 0,
      change: q.change || 0,
      changePercent: q.changePercent || 0,
      isUp: (q.change || 0) >= 0,
    }))
  } catch {
    return []
  }
}

function formatPrice(value: number, isMetal: boolean): string {
  if (value <= 0) return '—'
  const formatted = value > 10000
    ? value.toLocaleString('en-IN', { maximumFractionDigits: 0 })
    : value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${isMetal ? '₹' : ''}${formatted}${isMetal ? '/g' : ''}`
}

// Fetches once on mount. Server caches for 8 hours.
// Source data refreshes ~3 times/day via the cron job.
export default function LiveTicker() {
  const [data, setData] = useState<TickerData[]>([])

  useEffect(() => {
    fetchPrices().then(setData)
  }, [])

  if (data.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-[#E0E0E0] rounded-md p-4 animate-pulse">
            <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
            <div className="h-6 w-24 bg-gray-200 rounded mb-1" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {data.map(item => {
        const isMetal = METALS.has(item.symbol)
        return (
          <div key={item.symbol} className="bg-white border border-[#E0E0E0] rounded-md p-4">
            <div className="text-xs text-[#666] font-semibold uppercase">{item.label}</div>
            <div className="font-mono-price text-xl font-bold text-[#1A1A1A] mt-1">
              {formatPrice(item.price, isMetal)}
            </div>
            <div className={`text-sm font-bold mt-1 ${item.isUp ? 'text-rise' : 'text-fall'}`}>
              {item.isUp ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)} ({Math.abs(item.changePercent).toFixed(2)}%)
            </div>
          </div>
        )
      })}
    </div>
  )
}
