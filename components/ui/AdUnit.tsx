'use client'

import { useEffect } from 'react'

declare global {
  interface Window { adsbygoogle: unknown[] }
}

export default function AdUnit({ slot }: { slot: string }) {
  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}) } catch {}
  }, [])

  if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT) return null

  return (
    <div className="my-4 min-h-[100px]">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
