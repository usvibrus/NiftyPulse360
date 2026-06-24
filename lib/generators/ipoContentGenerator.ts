import { format } from 'date-fns'

interface IpoPageData {
  companyName: string
  ipoType: string
  exchange: string
  status: string
  priceBandMin: number | null
  priceBandMax: number | null
  lotSize: number | null
  issueSizeCr: number | null
  openDate: Date | null
  closeDate: Date | null
  allotmentDate: Date | null
  listingDate: Date | null
  gmpValue: number | null
  gmpPercent: number | null
  subscriptionData: { retail?: number; hni?: number; qib?: number; total?: number } | null
  aboutCompany: string | null
  financials: { year: string; revenue: number; pat: number; netWorth: number }[] | null
  promoterHolding: number | null
  registrarName: string | null
  registrarUrl: string | null
  leadManagers: string[]
  objectOfIssue: string | null
  aiAnalysis: string | null
  faqContent: { question: string; answer: string }[] | null
}

function formatDate(date: Date | null): string {
  if (!date) return 'TBA'
  return format(date, 'dd MMM yyyy')
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

export function generateIpoPageContent(ipo: IpoPageData): string {
  const sections: string[] = []

  // Section 1: Key Details Table
  const expectedListing = ipo.priceBandMax && ipo.gmpValue
    ? `₹${(ipo.priceBandMax + ipo.gmpValue).toFixed(0)}`
    : '—'

  sections.push(`
<section class="ipo-details">
  <h2>${ipo.companyName} IPO Details</h2>
  <table class="ipo-table">
    <tr><td><strong>IPO Type</strong></td><td>${ipo.ipoType === 'SME' ? 'SME IPO' : 'Mainboard IPO'}</td></tr>
    <tr><td><strong>Exchange</strong></td><td>${ipo.exchange}</td></tr>
    <tr><td><strong>Price Band</strong></td><td>${ipo.priceBandMin && ipo.priceBandMax ? `₹${ipo.priceBandMin} to ₹${ipo.priceBandMax} per share` : 'TBA'}</td></tr>
    <tr><td><strong>Lot Size</strong></td><td>${ipo.lotSize ? `${ipo.lotSize} shares` : 'TBA'}</td></tr>
    <tr><td><strong>Issue Size</strong></td><td>${ipo.issueSizeCr ? `₹${ipo.issueSizeCr.toFixed(2)} Cr` : 'TBA'}</td></tr>
    <tr><td><strong>Min Investment</strong></td><td>${ipo.lotSize && ipo.priceBandMax ? formatCurrency(ipo.lotSize * ipo.priceBandMax) : 'TBA'}</td></tr>
    <tr><td><strong>IPO Open Date</strong></td><td>${formatDate(ipo.openDate)}</td></tr>
    <tr><td><strong>IPO Close Date</strong></td><td>${formatDate(ipo.closeDate)}</td></tr>
    <tr><td><strong>Allotment Date</strong></td><td>${formatDate(ipo.allotmentDate)}</td></tr>
    <tr><td><strong>Listing Date</strong></td><td>${formatDate(ipo.listingDate)}</td></tr>
    <tr><td><strong>Registrar</strong></td><td>${ipo.registrarName || 'TBA'}</td></tr>
  </table>
</section>`)

  // Section 2: GMP
  if (ipo.gmpValue !== null) {
    const gmpSign = ipo.gmpValue >= 0 ? '+' : ''
    sections.push(`
<section class="ipo-gmp">
  <h2>${ipo.companyName} IPO GMP Today</h2>
  <p>The current Grey Market Premium (GMP) for ${ipo.companyName} IPO is <strong>${gmpSign}₹${ipo.gmpValue}</strong>${ipo.gmpPercent ? ` (${gmpSign}${ipo.gmpPercent.toFixed(1)}%)` : ''}.</p>
  <table class="ipo-table">
    <tr><td><strong>Issue Price</strong></td><td>${ipo.priceBandMax ? formatCurrency(ipo.priceBandMax) : 'TBA'}</td></tr>
    <tr><td><strong>GMP</strong></td><td>${gmpSign}₹${ipo.gmpValue}</td></tr>
    <tr><td><strong>Expected Listing Price</strong></td><td>${expectedListing}</td></tr>
  </table>
  <p><em>Note: GMP is unofficial and based on grey market activity. Actual listing price may differ.</em></p>
</section>`)
  }

  // Section 3: Subscription Status
  if (ipo.subscriptionData && ipo.subscriptionData.total && ipo.subscriptionData.total > 0) {
    const sub = ipo.subscriptionData as { retail?: number; hni?: number; qib?: number; total: number }
    sections.push(`
<section class="ipo-subscription">
  <h2>${ipo.companyName} IPO Subscription Status</h2>
  <table class="ipo-table">
    <tr><th>Category</th><th>Subscription (x times)</th></tr>
    ${sub.retail ? `<tr><td>Retail Individual</td><td>${sub.retail.toFixed(2)}x</td></tr>` : ''}
    ${sub.hni ? `<tr><td>HNI / NII</td><td>${sub.hni.toFixed(2)}x</td></tr>` : ''}
    ${sub.qib ? `<tr><td>QIB</td><td>${sub.qib.toFixed(2)}x</td></tr>` : ''}
    <tr><td><strong>Total</strong></td><td><strong>${sub.total.toFixed(2)}x</strong></td></tr>
  </table>
</section>`)
  }

  // Section 4: About Company
  if (ipo.aboutCompany) {
    sections.push(`
<section class="ipo-about">
  <h2>About ${ipo.companyName}</h2>
  <p>${ipo.aboutCompany}</p>
</section>`)
  }

  // Section 5: AI Analysis
  if (ipo.aiAnalysis) {
    sections.push(`
<section class="ipo-analysis">
  <h2>${ipo.companyName} IPO Review</h2>
  <p>${ipo.aiAnalysis}</p>
</section>`)
  }

  // Section 6: Financials
  if (ipo.financials && ipo.financials.length > 0) {
    const rows = ipo.financials.map(f =>
      `<tr><td>${f.year}</td><td>₹${f.revenue.toFixed(2)} Cr</td><td>₹${f.pat.toFixed(2)} Cr</td><td>₹${f.netWorth.toFixed(2)} Cr</td></tr>`
    ).join('\n')

    sections.push(`
<section class="ipo-financials">
  <h2>${ipo.companyName} Financial Performance</h2>
  <table class="ipo-table">
    <tr><th>Year</th><th>Revenue</th><th>PAT</th><th>Net Worth</th></tr>
    ${rows}
  </table>
  ${ipo.promoterHolding ? `<p><strong>Promoter Holding:</strong> ${ipo.promoterHolding.toFixed(2)}%</p>` : ''}
</section>`)
  }

  // Section 7: Object of Issue
  if (ipo.objectOfIssue) {
    sections.push(`
<section class="ipo-objects">
  <h2>Objects of the Issue</h2>
  <p>${ipo.objectOfIssue}</p>
</section>`)
  }

  // Section 8: Allotment Check
  if (ipo.registrarName && ipo.registrarUrl) {
    sections.push(`
<section class="ipo-allotment">
  <h2>Check ${ipo.companyName} IPO Allotment Status</h2>
  <p>You can check your ${ipo.companyName} IPO allotment status on the registrar website (${ipo.registrarName}).</p>
  <p><a href="${ipo.registrarUrl}" target="_blank" rel="noopener noreferrer" class="allotment-btn">Check Allotment Status on ${ipo.registrarName} →</a></p>
  <p><em>You will need your PAN number, Application Number, or Demat Account Number to check the status.</em></p>
</section>`)
  }

  // Section 9: Lead Managers
  if (ipo.leadManagers.length > 0) {
    sections.push(`
<section class="ipo-managers">
  <h2>Lead Managers</h2>
  <p>${ipo.leadManagers.join(', ')}</p>
</section>`)
  }

  // Section 10: FAQ
  if (ipo.faqContent && ipo.faqContent.length > 0) {
    const faqHtml = ipo.faqContent.map(f => `
  <div class="faq-item">
    <h3>${f.question}</h3>
    <p>${f.answer}</p>
  </div>`).join('')

    sections.push(`
<section class="ipo-faq">
  <h2>${ipo.companyName} IPO FAQs</h2>
  ${faqHtml}
</section>`)
  }

  // Disclaimer
  sections.push(`
<section class="disclaimer">
  <p><em>Disclaimer: This page is for informational purposes only and does not constitute investment advice. IPO investments carry market risks. Please read the Red Herring Prospectus (RHP) before investing. GMP data is unofficial and sourced from grey market activity. NiftyPulse360 is not responsible for any investment decisions made based on this information.</em></p>
</section>`)

  return sections.join('\n')
}

export function generateIpoListingContent(ipo: { companyName: string; issuePrice: number; listingPrice: number; listingGainLoss: number; listingDayClose: number; listingDate: Date | null }): string {
  const gainOrLoss = ipo.listingGainLoss >= 0 ? 'gain' : 'loss'
  const verb = ipo.listingGainLoss >= 0 ? 'listed at a premium' : 'listed at a discount'

  return `
<section class="listing-result">
  <h2>${ipo.companyName} IPO Listing Price & Performance</h2>
  <p><strong>${ipo.companyName}</strong> ${verb} of <strong>${ipo.listingGainLoss >= 0 ? '+' : ''}${ipo.listingGainLoss.toFixed(2)}%</strong> on its listing day${ipo.listingDate ? ` (${formatDate(ipo.listingDate)})` : ''}.</p>
  <table class="ipo-table">
    <tr><td><strong>Issue Price</strong></td><td>${formatCurrency(ipo.issuePrice)}</td></tr>
    <tr><td><strong>Listing Price</strong></td><td>${formatCurrency(ipo.listingPrice)}</td></tr>
    <tr><td><strong>Listing ${gainOrLoss}</strong></td><td>${ipo.listingGainLoss >= 0 ? '+' : ''}${ipo.listingGainLoss.toFixed(2)}%</td></tr>
    <tr><td><strong>Day Close</strong></td><td>${formatCurrency(ipo.listingDayClose)}</td></tr>
  </table>
</section>

<section class="listing-takeaway">
  <h2>Key Takeaway</h2>
  <p>Investors who applied at the issue price of ${formatCurrency(ipo.issuePrice)} ${ipo.listingGainLoss >= 0 ? 'earned a profit' : 'incurred a loss'} of ${formatCurrency(Math.abs(ipo.listingPrice - ipo.issuePrice))} per share on listing day. The stock closed at ${formatCurrency(ipo.listingDayClose)} on listing day.</p>
</section>`
}

export function generateIpoTitle(companyName: string, status: string, gmpValue?: number | null): { metaTitle: string; metaDesc: string } {
  const year = new Date().getFullYear()
  const shortName = companyName.replace(/\s*(Limited|Ltd\.?|Pvt\.?|Private|Industries)\s*/gi, '').trim()

  let metaTitle: string
  let metaDesc: string

  switch (status) {
    case 'UPCOMING':
      metaTitle = `${shortName} IPO ${year} — GMP, Price Band, Dates & Details`
      metaDesc = `${shortName} IPO details: price band, lot size, opening/closing dates, GMP, and how to apply. Get complete information about this upcoming IPO.`
      break
    case 'OPEN':
      metaTitle = `${shortName} IPO GMP Today, Subscription Status & Details ${year}`
      metaDesc = `${shortName} IPO is open for subscription. Check live GMP${gmpValue ? ` (₹${gmpValue})` : ''}, subscription status, price band, lot size, and apply online.`
      break
    case 'LISTED':
      metaTitle = `${shortName} IPO Listing Price & Gains — Result ${year}`
      metaDesc = `${shortName} IPO listing results: listing price, day close, gains/loss, and performance analysis.`
      break
    default:
      metaTitle = `${shortName} IPO ${year} — GMP, Dates, Price Band & Review`
      metaDesc = `Complete details of ${shortName} IPO: GMP today, subscription status, price band, lot size, dates, and review.`
  }

  if (metaTitle.length > 65) metaTitle = `${shortName} IPO — GMP, Price Band & Dates ${year}`
  if (metaTitle.length > 65) metaTitle = `${shortName} IPO GMP & Details ${year}`

  return { metaTitle, metaDesc: metaDesc.slice(0, 160) }
}

export function generateIpoListingTitle(companyName: string, gainLoss: number): { metaTitle: string; metaDesc: string } {
  const shortName = companyName.replace(/\s*(Limited|Ltd\.?|Pvt\.?|Private|Industries)\s*/gi, '').trim()
  const year = new Date().getFullYear()
  const verb = gainLoss >= 0 ? `+${gainLoss.toFixed(0)}% Premium` : `${gainLoss.toFixed(0)}% Discount`

  return {
    metaTitle: `${shortName} IPO Listed at ${verb} — Listing Price & Result ${year}`,
    metaDesc: `${shortName} IPO listing result: listed at ${verb}. Check listing price, day close, and returns for investors who applied.`,
  }
}

export function generateIpoFaq(ipo: IpoPageData): { question: string; answer: string }[] {
  const name = ipo.companyName
  const faq: { question: string; answer: string }[] = []

  faq.push({
    question: `What is ${name} IPO GMP today?`,
    answer: ipo.gmpValue !== null
      ? `The current Grey Market Premium (GMP) for ${name} IPO is ₹${ipo.gmpValue}${ipo.priceBandMax ? `, indicating an expected listing price of ₹${(ipo.priceBandMax + ipo.gmpValue).toFixed(0)}` : ''}.`
      : `GMP data for ${name} IPO is not yet available. GMP typically starts appearing 1-2 days before the IPO opens.`,
  })

  faq.push({
    question: `What is ${name} IPO price band and lot size?`,
    answer: `${name} IPO price band is ${ipo.priceBandMin && ipo.priceBandMax ? `₹${ipo.priceBandMin} to ₹${ipo.priceBandMax} per share` : 'yet to be announced'}. The minimum lot size is ${ipo.lotSize ? `${ipo.lotSize} shares` : 'TBA'}${ipo.lotSize && ipo.priceBandMax ? `, requiring a minimum investment of ₹${(ipo.lotSize * ipo.priceBandMax).toLocaleString('en-IN')}` : ''}.`,
  })

  faq.push({
    question: `When is ${name} IPO listing date?`,
    answer: ipo.listingDate
      ? `${name} IPO is expected to list on ${formatDate(ipo.listingDate)} on ${ipo.exchange}.`
      : `The listing date for ${name} IPO has not been announced yet. It is typically 6 trading days after the close date.`,
  })

  faq.push({
    question: `How to check ${name} IPO allotment status?`,
    answer: ipo.registrarName
      ? `You can check ${name} IPO allotment status on ${ipo.registrarName}'s website using your PAN number, Application Number, or Demat Account Number.`
      : `Check your allotment status on the IPO registrar's website using your PAN, Application Number, or DP Client ID.`,
  })

  faq.push({
    question: `${name} IPO subscription status — is it oversubscribed?`,
    answer: ipo.subscriptionData?.total
      ? `${name} IPO has been subscribed ${ipo.subscriptionData.total.toFixed(2)}x overall. Retail: ${ipo.subscriptionData.retail?.toFixed(2) || '—'}x, HNI: ${ipo.subscriptionData.hni?.toFixed(2) || '—'}x, QIB: ${ipo.subscriptionData.qib?.toFixed(2) || '—'}x.`
      : `Subscription data for ${name} IPO will be available once the IPO opens for bidding.`,
  })

  faq.push({
    question: `Should I apply for ${name} IPO?`,
    answer: `Investment decisions should be based on your own research and risk appetite. Please read the Red Herring Prospectus (RHP) for complete details about the company's financials, risks, and business model. This is not financial advice.`,
  })

  faq.push({
    question: `What is ${name} IPO issue size?`,
    answer: ipo.issueSizeCr
      ? `${name} IPO has a total issue size of ₹${ipo.issueSizeCr.toFixed(2)} crores.`
      : `The issue size for ${name} IPO has not been finalized yet.`,
  })

  faq.push({
    question: `Who is the registrar for ${name} IPO?`,
    answer: ipo.registrarName
      ? `The registrar for ${name} IPO is ${ipo.registrarName}. You can check allotment status and refund details on their website.`
      : `The registrar for ${name} IPO has not been announced yet.`,
  })

  faq.push({
    question: `What is the expected listing price of ${name} IPO?`,
    answer: ipo.gmpValue !== null && ipo.priceBandMax
      ? `Based on current GMP of ₹${ipo.gmpValue}, ${name} IPO is expected to list around ₹${(ipo.priceBandMax + ipo.gmpValue).toFixed(0)}, a ${ipo.gmpPercent ? ipo.gmpPercent.toFixed(1) : ((ipo.gmpValue / ipo.priceBandMax) * 100).toFixed(1)}% premium over the issue price.`
      : `The expected listing price depends on grey market premium, which fluctuates daily. Check back closer to the listing date for GMP updates.`,
  })

  faq.push({
    question: `Is ${name} IPO Mainboard or SME?`,
    answer: `${name} is a ${ipo.ipoType === 'SME' ? 'SME IPO listed on the SME platform of ' + ipo.exchange : 'Mainboard IPO listed on ' + ipo.exchange}. ${ipo.ipoType === 'SME' ? 'SME IPOs have a smaller issue size and are meant for small and medium enterprises.' : ''}`,
  })

  return faq
}

// Error boundaries validated
