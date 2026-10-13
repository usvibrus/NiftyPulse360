import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SEED_IPOS = [
  {
    companyName: 'CMR Green Technologies Limited',
    slug: 'cmr-green-technologies-ipo',
    ipoType: 'MAINBOARD',
    exchange: 'BOTH',
    status: 'OPEN',
    priceBandMin: 182,
    priceBandMax: 192,
    lotSize: 78,
    issueSizeCr: 630.88,
    openDate: new Date('2026-06-03'),
    closeDate: new Date('2026-06-05'),
    allotmentDate: new Date('2026-06-08'),
    listingDate: new Date('2026-06-10'),
    registrarName: 'Link Intime',
    registrarUrl: 'https://linkintime.co.in/mipo/ipoallotment.html',
    leadManagers: ['Axis Capital', 'ICICI Securities'],
    gmpValue: 45,
    aboutCompany: 'CMR Green Technologies Limited is a leading recycler of non-ferrous metals and manufacturer of secondary aluminium and zinc die-casting alloys in India. Founded in 2006, the company operates 13 recycling units and serves major OEMs including Honda, Bajaj, Hero, Royal Enfield, and Yamaha. They employ over 760 permanent employees.',
  },
  {
    companyName: 'Q-Line Biotech Limited',
    slug: 'q-line-biotech-ipo',
    ipoType: 'SME',
    exchange: 'BSE',
    status: 'OPEN',
    priceBandMin: 91,
    priceBandMax: 96,
    lotSize: 1200,
    issueSizeCr: 27.45,
    openDate: new Date('2026-06-04'),
    closeDate: new Date('2026-06-06'),
    allotmentDate: new Date('2026-06-09'),
    listingDate: new Date('2026-06-11'),
    registrarName: 'BigShare Services',
    registrarUrl: 'https://ipo.bigshareonline.com/IPO_Status.html',
    leadManagers: ['Hem Securities'],
    gmpValue: 20,
    aboutCompany: 'Q-Line Biotech Limited is an Indian pharmaceutical company engaged in manufacturing and marketing of pharmaceutical formulations. The company produces tablets, capsules, and liquid orals across therapeutic segments.',
  },
  {
    companyName: 'Aegis Vopak Terminals Limited',
    slug: 'aegis-vopak-terminals-ipo',
    ipoType: 'MAINBOARD',
    exchange: 'BOTH',
    status: 'UPCOMING',
    priceBandMin: 230,
    priceBandMax: 250,
    lotSize: 60,
    issueSizeCr: 2800,
    openDate: new Date('2026-06-10'),
    closeDate: new Date('2026-06-12'),
    allotmentDate: new Date('2026-06-15'),
    listingDate: new Date('2026-06-17'),
    registrarName: 'KFintech',
    registrarUrl: 'https://kosmic.kfintech.com/ipostatus/',
    leadManagers: ['Kotak Mahindra Capital', 'Morgan Stanley'],
    gmpValue: 35,
    aboutCompany: 'Aegis Vopak Terminals is a joint venture between Aegis Logistics and Royal Vopak, operating bulk liquid storage terminals across India. They provide storage and handling services for chemicals, petroleum products, and LPG.',
  },
  {
    companyName: 'Prostarm Info Systems Limited',
    slug: 'prostarm-info-systems-ipo',
    ipoType: 'SME',
    exchange: 'NSE',
    status: 'UPCOMING',
    priceBandMin: 140,
    priceBandMax: 148,
    lotSize: 100,
    issueSizeCr: 52.8,
    openDate: new Date('2026-06-12'),
    closeDate: new Date('2026-06-16'),
    allotmentDate: new Date('2026-06-17'),
    listingDate: new Date('2026-06-19'),
    registrarName: 'Link Intime',
    registrarUrl: 'https://linkintime.co.in/mipo/ipoallotment.html',
    leadManagers: ['Pantomath Capital'],
    gmpValue: 15,
    aboutCompany: 'Prostarm Info Systems is an Indian power electronics company that designs, manufactures, and sells UPS systems, stabilizers, and power conditioning equipment.',
  },
  {
    companyName: 'Mankind Pharma Limited',
    slug: 'mankind-pharma-ipo-listing',
    ipoType: 'MAINBOARD',
    exchange: 'BOTH',
    status: 'LISTED',
    priceBandMin: 1026,
    priceBandMax: 1080,
    issuePrice: 1080,
    lotSize: 13,
    issueSizeCr: 4326,
    openDate: new Date('2026-05-20'),
    closeDate: new Date('2026-05-22'),
    allotmentDate: new Date('2026-05-25'),
    listingDate: new Date('2026-05-28'),
    listingPrice: 1300,
    listingGainLoss: 20.37,
    listingDayClose: 1275,
    registrarName: 'KFintech',
    registrarUrl: 'https://kosmic.kfintech.com/ipostatus/',
    leadManagers: ['Goldman Sachs', 'Axis Capital', 'BofA Securities'],
    gmpValue: 180,
    aboutCompany: 'Mankind Pharma is one of India\'s largest pharmaceutical companies by revenue and profit. It manufactures and sells branded and generic pharmaceutical formulations across acute and chronic therapeutic segments.',
  },
  {
    companyName: 'Cello World Limited',
    slug: 'cello-world-ipo-listing',
    ipoType: 'MAINBOARD',
    exchange: 'BOTH',
    status: 'LISTED',
    priceBandMin: 617,
    priceBandMax: 648,
    issuePrice: 648,
    lotSize: 23,
    issueSizeCr: 1900,
    openDate: new Date('2026-05-25'),
    closeDate: new Date('2026-05-27'),
    allotmentDate: new Date('2026-05-30'),
    listingDate: new Date('2026-06-02'),
    listingPrice: 780,
    listingGainLoss: 20.37,
    listingDayClose: 755,
    registrarName: 'Link Intime',
    registrarUrl: 'https://linkintime.co.in/mipo/ipoallotment.html',
    leadManagers: ['JM Financial', 'IIFL Securities'],
    gmpValue: 120,
    aboutCompany: 'Cello World is a leading Indian consumer products company known for its plasticware, writing instruments, and houseware products. The brand Cello is a household name in India.',
  },
]

async function main() {
  console.log('Seeding IPO data...')

  for (const ipo of SEED_IPOS) {
    const existing = await prisma.ipoEvent.findUnique({ where: { slug: ipo.slug } })
    if (existing) {
      console.log(`  Skipping ${ipo.companyName} (exists)`)
      continue
    }

    const year = new Date().getFullYear()
    const shortName = ipo.companyName.replace(/\s*(Limited|Ltd\.?)\s*/gi, '').trim()
    const metaTitle = `${shortName} IPO GMP Today, Price Band, Dates ${year}`
    const metaDesc = `${shortName} IPO: price band ₹${ipo.priceBandMin}-₹${ipo.priceBandMax}, lot size ${ipo.lotSize} shares, GMP ₹${ipo.gmpValue}. Get dates, subscription status, and allotment details.`
    const keywords = [
      `${ipo.companyName} IPO`,
      `${shortName} IPO GMP`,
      `${shortName} IPO subscription status`,
      `${shortName} IPO listing date`,
      ipo.ipoType === 'SME' ? 'SME IPO 2026' : 'IPO 2026',
    ]

    const gmpPercent = ipo.priceBandMax ? (ipo.gmpValue / ipo.priceBandMax) * 100 : null

    await prisma.ipoEvent.create({
      data: {
        slug: ipo.slug,
        companyName: ipo.companyName,
        ipoType: ipo.ipoType,
        exchange: ipo.exchange,
        status: ipo.status,
        priceBandMin: ipo.priceBandMin,
        priceBandMax: ipo.priceBandMax,
        issuePrice: (ipo as { issuePrice?: number }).issuePrice || ipo.priceBandMax,
        lotSize: ipo.lotSize,
        issueSizeCr: ipo.issueSizeCr,
        openDate: ipo.openDate,
        closeDate: ipo.closeDate,
        allotmentDate: ipo.allotmentDate,
        listingDate: ipo.listingDate,
        listingPrice: (ipo as { listingPrice?: number }).listingPrice || null,
        listingGainLoss: (ipo as { listingGainLoss?: number }).listingGainLoss || null,
        listingDayClose: (ipo as { listingDayClose?: number }).listingDayClose || null,
        registrarName: ipo.registrarName,
        registrarUrl: ipo.registrarUrl,
        leadManagers: ipo.leadManagers,
        gmpValue: ipo.gmpValue,
        gmpPercent,
        gmpHistory: [{ date: new Date().toISOString().split('T')[0], value: ipo.gmpValue }],
        gmpUpdatedAt: new Date(),
        aboutCompany: ipo.aboutCompany,
        metaTitle,
        metaDesc,
        keywords,
      },
    })
    console.log(`  Created: ${ipo.companyName}`)
  }

  console.log('Done seeding IPOs!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
