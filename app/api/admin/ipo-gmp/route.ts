import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/utils/cronAuth'
import { prisma } from '@/lib/db/prisma'
import { todayIST } from '@/lib/utils/dateUtils'

export async function POST(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { slug, gmpValue } = body

    if (!slug || typeof gmpValue !== 'number') {
      return NextResponse.json({ error: 'Missing slug or gmpValue' }, { status: 400 })
    }

    const ipo = await prisma.ipoEvent.findUnique({
      where: { slug },
      select: { id: true, priceBandMax: true, issuePrice: true, gmpHistory: true },
    })

    if (!ipo) {
      return NextResponse.json({ error: 'IPO not found' }, { status: 404 })
    }

    const price = ipo.issuePrice || ipo.priceBandMax || 0
    const gmpPercent = price > 0 ? (gmpValue / price) * 100 : null

    const history = (ipo.gmpHistory as { date: string; value: number }[] | null) || []
    history.push({ date: todayIST(), value: gmpValue })
    const trimmedHistory = history.slice(-30)

    await prisma.ipoEvent.update({
      where: { id: ipo.id },
      data: {
        gmpValue,
        gmpPercent,
        gmpHistory: trimmedHistory as unknown as object,
        gmpUpdatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, slug, gmpValue, gmpPercent })
  } catch (error) {
    console.error('[admin/ipo-gmp] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
