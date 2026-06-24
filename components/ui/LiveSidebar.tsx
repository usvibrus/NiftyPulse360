// UI component verified
'use client'

import { useEffect, useState } from 'react'

interface PriceData {
  symbol: string
  price: number
  change: number
  changePercent: number
}

const INDEX_LABELS: Record<string, string> = { '^NSEI': 'Nifty 50', '^BSESN': 'Sensex' }
const METAL_LABELS: Record<string, string> = { 'GC=F': 'GOLD 24K', 'SI=F': 'SILVER' }

export default function LiveSidebar() {
  const [data, setData] = useState<PriceData[]>([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/prices')
        if (res.ok) setData(await res.json())
      } catch {}
    }
    load()
  }, [])

  const indices = data.filter(d => d.symbol in INDEX_LABELS)
  const metals = data.filter(d => d.symbol in METAL_LABELS)

  return (
    <>
      {/* Market Snapshot Widget */}
      <div className="section-header"><span>Market Snapshot</span></div>
      <div className="bg-white border border-t-0 border-[#E0E0E0] min-h-[120px]">
        {indices.length > 0 ? indices.map(i => (
          <div key={i.symbol} className="flex justify-between items-center p-3 border-b border-[#E0E0E0] last:border-b-0">
            <span className="font-semibold text-sm">{INDEX_LABELS[i.symbol]}</span>
            <div className="text-right">
              <div className="font-mono-price text-sm font-bold">{i.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <div className={`text-xs font-bold ${i.changePercent >= 0 ? 'text-rise' : 'text-fall'}`}>
                {i.changePercent >= 0 ? '▲' : '▼'} {Math.abs(i.changePercent).toFixed(2)}%
              </div>
            </div>
          </div>
        )) : <div className="p-3 text-sm text-[#666]">Loading...</div>}
      </div>

      {/* Gold Rate Widget */}
      <div className="mt-4">
        <div className="section-header"><span>Gold Rate Today</span></div>
        <div className="bg-white border border-t-0 border-[#E0E0E0] p-4">
          {metals.length > 0 ? metals.map(m => (
            <div key={m.symbol} className="flex justify-between items-center py-2 border-b border-[#E0E0E0] last:border-b-0">
              <span className="text-sm font-semibold">{METAL_LABELS[m.symbol]}</span>
              <div className="text-right">
                <span className="font-mono-price font-bold">₹{m.price.toFixed(0)}/g</span>
                <span className={`ml-2 text-xs font-bold ${m.changePercent >= 0 ? 'text-rise' : 'text-fall'}`}>
                  {m.changePercent >= 0 ? '▲' : '▼'} {Math.abs(m.changePercent).toFixed(1)}%
                </span>
              </div>
            </div>
          )) : <p className="text-sm text-[#666]">Loading...</p>}
        </div>
      </div>
    </>
  )
}
