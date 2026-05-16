import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const title = searchParams.get('title') || 'NiftyPulse360'
  const symbol = searchParams.get('symbol') || ''
  const change = searchParams.get('change') || ''
  const type = searchParams.get('type') || 'RISE'

  const isRise = type === 'RISE'
  const bgGradient = isRise ? 'linear-gradient(135deg, #0D1B2A 0%, #1B4332 100%)' : 'linear-gradient(135deg, #0D1B2A 0%, #4A1010 100%)'
  const changeColor = isRise ? '#4ADE80' : '#F87171'
  const arrow = isRise ? '▲' : '▼'

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: bgGradient, padding: '60px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#1565C0', borderRadius: '12px', padding: '8px 16px', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>NiftyPulse360</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ color: 'white', fontSize: '44px', fontWeight: 'bold', lineHeight: 1.2 }}>{title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {symbol && <div style={{ color: '#94A3B8', fontSize: '28px', fontWeight: '600' }}>{symbol}</div>}
            {change && <div style={{ color: changeColor, fontSize: '36px', fontWeight: 'bold' }}>{arrow} {change}</div>}
          </div>
        </div>
        <div style={{ color: '#64748B', fontSize: '20px' }}>niftypulse360.com • India&apos;s Market Intelligence</div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
