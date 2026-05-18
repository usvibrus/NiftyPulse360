'use client'

import { useEffect, useState, useRef } from 'react'

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

function isMarketHours() {
  const now = new Date()
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const day = ist.getDay()
  const h = ist.getHours()
  const m = ist.getMinutes()
  const time = h * 60 + m
  return day >= 1 && day <= 5 && time >= 540 && time <= 960
}

function PriceCell({ current, prev, isUp, symbol }: { current: number; prev: number; isUp: boolean; symbol: string }) {
  const [flash, setFlash] = useState('')

  useEffect(() => {
    if (prev === 0 || current === prev) return
    setFlash(current > prev ? 'flash-green' : 'flash-red')
    const t = setTimeout(() => setFlash(''), 700)
    return () => clearTimeout(t)
  }, [current, prev])

  const isMetal = METALS.has(symbol)
  const formatted = current > 10000
    ? current.toLocaleString('en-IN', { maximumFractionDigits: 0 })
    : current.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className={`font-mono-price text-xl font-bold text-[#1A1A1A] mt-1 transition-colors duration-300 ${flash}`}>
      {current > 0 ? `${isMetal ? '₹' : ''}${formatted}${isMetal ? '/g' : ''}` : '—'}
    </div>
  )
}

export default function LiveTicker() {
  const [data, setData] = useState<TickerData[]>([])
  const prevData = useRef<TickerData[]>([])
  const [live, setLive] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout

    async function tick() {
      const prices = await fetchPrices()
      if (prices.length > 0) {
        setData(prev => {
          prevData.current = prev.length > 0 ? prev : prices
          return prices
        })
        setLive(true)
      }
    }

    tick()
    const delay = isMarketHours() ? 30000 : 300000
    interval = setInterval(tick, delay)

    return () => clearInterval(interval)
  }, [])

  if (data.length === 0) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {data.map((item, i) => {
        const prev = prevData.current[i]?.price || 0
        return (
          <div key={item.symbol} className="bg-white border border-[#E0E0E0] rounded-md p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="text-xs text-[#666] font-semibold uppercase">{item.label}</div>
              {live && isMarketHours() && (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-green-600 font-medium">LIVE</span>
                </span>
              )}
            </div>
            <PriceCell current={item.price} prev={prev} isUp={item.isUp} symbol={item.symbol} />
            <div className={`text-sm font-bold mt-1 ${item.isUp ? 'text-rise' : 'text-fall'}`}>
              {item.isUp ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)} ({Math.abs(item.changePercent).toFixed(2)}%)
            </div>
          </div>
        )
      })}

      <style jsx>{`
        .flash-green { color: #16a34a !important; }
        .flash-red { color: #dc2626 !important; }
      `}</style>
    </div>
  )
}
