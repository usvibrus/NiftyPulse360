import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/utils/cronAuth'
import { prisma } from '@/lib/db/prisma'
import { aggregateMarketWrap, generateMarketWrapContent, generateMarketWrapTitle } from '@/lib/generators/marketWrapGenerator'
import { pingNewUrl } from '@/lib/seo/indexingService'
import { nowIST } from '@/lib/utils/dateUtils'
import { format } from 'date-fns'

export async function POST(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = nowIST()
    const dateStr = format(today, 'yyyy-MM-dd')
    const slug = `market-wrap-${dateStr}`

    const existing = await prisma.marketWrap.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ success: true, message: 'Already exists', slug })
    }

    const data = await aggregateMarketWrap(today)

    if (data.topGainers.length === 0 && data.topLosers.length === 0) {
      return NextResponse.json({ success: true, message: 'No stock data for today yet' })
    }

    const pageContent = generateMarketWrapContent(data)
    const { metaTitle, metaDesc } = generateMarketWrapTitle(today, data.niftyClose, data.niftyChangePct)
    const keywords = ['stock market today', `market wrap ${dateStr}`, 'nifty today', 'sensex today', 'top gainers today', 'top losers today']

    await prisma.marketWrap.create({
      data: {
        slug,
        wrapDate: today,
        niftyClose: data.niftyClose,
        niftyChange: data.niftyChange,
        niftyChangePct: data.niftyChangePct,
        sensexClose: data.sensexClose,
        sensexChange: data.sensexChange,
        sensexChangePct: data.sensexChangePct,
        bankNiftyClose: data.bankNiftyClose,
        bankNiftyChange: data.bankNiftyChange,
        topGainers: data.topGainers as unknown as object,
        topLosers: data.topLosers as unknown as object,
        sectorSummary: data.sectorSummary as unknown as object,
        pageContent,
        metaTitle,
        metaDesc,
        keywords,
      },
    })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
    pingNewUrl(`${siteUrl}/market-wrap/${dateStr}`).catch(() => {})

    return NextResponse.json({ success: true, slug })
  } catch (error) {
    console.error('[cron/market-wrap] Error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
