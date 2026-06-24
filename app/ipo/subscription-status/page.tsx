// IPO page optimized
import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'IPO Subscription Status Live — Retail, HNI, QIB Data Today | NiftyPulse360',
  description: 'Live IPO subscription status for all open IPOs in India. Check retail, HNI, QIB subscription multiples updated in real-time.',
  keywords: ['IPO subscription status', 'IPO subscription live', 'retail subscription', 'HNI subscription', 'QIB subscription', 'IPO oversubscribed'],
  alternates: { canonical: '/ipo/subscription-status' },
}

export default async function IpoSubscriptionPage() {
  const ipos = await prisma.ipoEvent.findMany({
    where: { isPublished: true, status: { in: ['OPEN', 'CLOSED', 'ALLOTMENT'] }, NOT: { subscriptionData: { equals: undefined } } },
    orderBy: { openDate: 'desc' },
    select: { slug: true, companyName: true, ipoType: true, subscriptionData: true, subscriptionUpdatedAt: true, openDate: true, closeDate: true, status: true },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="section-header mb-0"><span>IPO Subscription Status</span></div>
        <div className="bg-white border border-t-0 border-[#E0E0E0] p-5">
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">IPO Subscription Status Live — 2026</h1>
          <p className="text-sm text-[#666]">Real-time subscription data for all open IPOs. Shows how many times each category (Retail, HNI, QIB) has been subscribed.</p>
        </div>
      </div>

      {ipos.length > 0 ? (
        <div className="bg-white border border-[#E0E0E0] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F7FA] text-xs text-[#666] uppercase">
                <th className="text-left p-3 pl-4">IPO</th>
                <th className="text-right p-3">Retail</th>
                <th className="text-right p-3">HNI</th>
                <th className="text-right p-3">QIB</th>
                <th className="text-right p-3 pr-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {ipos.map(ipo => {
                const sub = ipo.subscriptionData as { retail?: number; hni?: number; qib?: number; total?: number } | null
                if (!sub) return null
                return (
                  <tr key={ipo.slug} className="border-t border-[#E0E0E0] hover:bg-[#F5F7FA]">
                    <td className="p-3 pl-4">
                      <Link href={`/ipo/${ipo.slug}`} className="font-semibold text-[#1A1A1A] hover:text-[#1565C0]">{ipo.companyName}</Link>
                      <div className="text-xs text-[#666]">{ipo.ipoType} · {ipo.status}</div>
                    </td>
                    <td className="text-right p-3 font-bold">{sub.retail?.toFixed(2) || '—'}x</td>
                    <td className="text-right p-3 font-bold">{sub.hni?.toFixed(2) || '—'}x</td>
                    <td className="text-right p-3 font-bold">{sub.qib?.toFixed(2) || '—'}x</td>
                    <td className="text-right p-3 pr-4 font-bold text-[#1565C0]">{sub.total?.toFixed(2) || '—'}x</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-[#E0E0E0] p-8 text-center">
          <p className="text-[#666]">No IPOs are currently open for subscription. Check back during IPO season.</p>
          <Link href="/ipo" className="inline-block mt-3 text-sm font-semibold text-[#1565C0]">← Back to IPO Hub</Link>
        </div>
      )}
    </div>
  )
}
