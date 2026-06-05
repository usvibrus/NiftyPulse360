import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/utils/cronAuth'
import { prisma } from '@/lib/db/prisma'
import { fetchNseIpos, generateIpoSlug, determineStatus } from '@/lib/services/ipoService'
import { scrapeGmpData, matchGmpToIpo } from '@/lib/services/ipoGmpService'
import { generateIpoTitle, generateIpoFaq, generateIpoPageContent } from '@/lib/generators/ipoContentGenerator'
import { pingNewUrl } from '@/lib/seo/indexingService'
import { todayIST } from '@/lib/utils/dateUtils'

export async function POST(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stats = { discovered: 0, gmpUpdated: 0, statusUpdated: 0, listed: 0, errors: 0 }

  try {
    // PHASE 1: Discover new IPOs from NSE
    const nseIpos = await fetchNseIpos()
    console.log(`[cron/ipo] Found ${nseIpos.length} IPOs from NSE`)

    for (const ipo of nseIpos) {
      try {
        const slug = generateIpoSlug(ipo.companyName)
        const existing = await prisma.ipoEvent.findUnique({ where: { slug } })
        if (existing) continue

        const { metaTitle, metaDesc } = generateIpoTitle(ipo.companyName, ipo.status)
        const keywords = [
          `${ipo.companyName} IPO`,
          `${ipo.companyName} IPO GMP`,
          `${ipo.companyName} IPO subscription status`,
          `${ipo.companyName} IPO listing date`,
          `${ipo.companyName} IPO price band`,
          ipo.ipoType === 'SME' ? 'SME IPO 2026' : 'IPO 2026',
        ]

        const faqContent = generateIpoFaq({
          companyName: ipo.companyName,
          ipoType: ipo.ipoType,
          exchange: ipo.exchange,
          status: ipo.status,
          priceBandMin: ipo.priceBandMin,
          priceBandMax: ipo.priceBandMax,
          lotSize: ipo.lotSize,
          issueSizeCr: ipo.issueSizeCr,
          openDate: ipo.openDate ? new Date(ipo.openDate) : null,
          closeDate: ipo.closeDate ? new Date(ipo.closeDate) : null,
          allotmentDate: ipo.allotmentDate ? new Date(ipo.allotmentDate) : null,
          listingDate: ipo.listingDate ? new Date(ipo.listingDate) : null,
          gmpValue: null,
          gmpPercent: null,
          subscriptionData: null,
          aboutCompany: ipo.aboutCompany,
          financials: ipo.financials,
          promoterHolding: ipo.promoterHolding,
          registrarName: ipo.registrarName,
          registrarUrl: ipo.registrarUrl,
          leadManagers: ipo.leadManagers,
          objectOfIssue: ipo.objectOfIssue,
          aiAnalysis: null,
          faqContent: null,
        })

        const pageContent = generateIpoPageContent({
          companyName: ipo.companyName,
          ipoType: ipo.ipoType,
          exchange: ipo.exchange,
          status: ipo.status,
          priceBandMin: ipo.priceBandMin,
          priceBandMax: ipo.priceBandMax,
          lotSize: ipo.lotSize,
          issueSizeCr: ipo.issueSizeCr,
          openDate: ipo.openDate ? new Date(ipo.openDate) : null,
          closeDate: ipo.closeDate ? new Date(ipo.closeDate) : null,
          allotmentDate: ipo.allotmentDate ? new Date(ipo.allotmentDate) : null,
          listingDate: ipo.listingDate ? new Date(ipo.listingDate) : null,
          gmpValue: null,
          gmpPercent: null,
          subscriptionData: null,
          aboutCompany: ipo.aboutCompany,
          financials: ipo.financials,
          promoterHolding: ipo.promoterHolding,
          registrarName: ipo.registrarName,
          registrarUrl: ipo.registrarUrl,
          leadManagers: ipo.leadManagers,
          objectOfIssue: ipo.objectOfIssue,
          aiAnalysis: null,
          faqContent: faqContent,
        })

        await prisma.ipoEvent.create({
          data: {
            slug,
            companyName: ipo.companyName,
            ipoType: ipo.ipoType,
            exchange: ipo.exchange,
            status: ipo.status,
            priceBandMin: ipo.priceBandMin,
            priceBandMax: ipo.priceBandMax,
            issuePrice: ipo.issuePrice,
            lotSize: ipo.lotSize,
            issueSizeCr: ipo.issueSizeCr,
            openDate: ipo.openDate ? new Date(ipo.openDate) : null,
            closeDate: ipo.closeDate ? new Date(ipo.closeDate) : null,
            allotmentDate: ipo.allotmentDate ? new Date(ipo.allotmentDate) : null,
            listingDate: ipo.listingDate ? new Date(ipo.listingDate) : null,
            registrarName: ipo.registrarName,
            registrarUrl: ipo.registrarUrl,
            leadManagers: ipo.leadManagers,
            aboutCompany: ipo.aboutCompany,
            promoterHolding: ipo.promoterHolding,
            objectOfIssue: ipo.objectOfIssue,
            faqContent: faqContent as unknown as object,
            pageContent,
            metaTitle,
            metaDesc,
            keywords,
          },
        })

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
        pingNewUrl(`${siteUrl}/ipo/${slug}`).catch(() => {})
        stats.discovered++
      } catch (error) {
        console.error(`[cron/ipo] Failed for ${ipo.companyName}:`, error)
        stats.errors++
      }
    }

    // PHASE 2: Update GMP for all active IPOs
    const gmpEntries = await scrapeGmpData()
    if (gmpEntries.length > 0) {
      const activeIpos = await prisma.ipoEvent.findMany({
        where: { status: { in: ['UPCOMING', 'OPEN', 'CLOSED', 'ALLOTMENT'] } },
        select: { id: true, companyName: true, priceBandMax: true, gmpHistory: true },
      })

      for (const ipo of activeIpos) {
        const match = matchGmpToIpo(gmpEntries, ipo.companyName)
        if (!match) continue

        const gmpPercent = match.issuePrice > 0 ? (match.gmpValue / match.issuePrice) * 100 : null
        const history = (ipo.gmpHistory as { date: string; value: number }[] | null) || []
        history.push({ date: todayIST(), value: match.gmpValue })
        // Keep last 30 entries
        const trimmedHistory = history.slice(-30)

        await prisma.ipoEvent.update({
          where: { id: ipo.id },
          data: {
            gmpValue: match.gmpValue,
            gmpPercent,
            gmpHistory: trimmedHistory as unknown as object,
            gmpUpdatedAt: new Date(),
          },
        })
        stats.gmpUpdated++
      }
    }

    // PHASE 3: Update statuses based on dates
    const allActive = await prisma.ipoEvent.findMany({
      where: { status: { not: 'LISTED' } },
      select: { id: true, status: true, openDate: true, closeDate: true, allotmentDate: true, listingDate: true },
    })

    for (const ipo of allActive) {
      const newStatus = determineStatus({
        openDate: ipo.openDate?.toISOString().split('T')[0] || null,
        closeDate: ipo.closeDate?.toISOString().split('T')[0] || null,
        allotmentDate: ipo.allotmentDate?.toISOString().split('T')[0] || null,
        listingDate: ipo.listingDate?.toISOString().split('T')[0] || null,
      })

      if (newStatus !== ipo.status) {
        await prisma.ipoEvent.update({
          where: { id: ipo.id },
          data: { status: newStatus },
        })
        stats.statusUpdated++
      }
    }

    console.log(`[cron/ipo] Done: ${stats.discovered} new, ${stats.gmpUpdated} GMP updated, ${stats.statusUpdated} status changed`)
  } catch (error) {
    console.error('[cron/ipo] Fatal error:', error)
    return NextResponse.json({ success: false, error: 'Internal error', stats }, { status: 500 })
  }

  return NextResponse.json({ success: true, ...stats })
}
