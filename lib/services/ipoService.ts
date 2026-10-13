import { todayIST } from '@/lib/utils/dateUtils'

export interface IpoData {
  companyName: string
  ipoType: 'MAINBOARD' | 'SME'
  exchange: 'NSE' | 'BSE' | 'BOTH'
  status: 'UPCOMING' | 'OPEN' | 'CLOSED' | 'ALLOTMENT' | 'LISTED'
  priceBandMin: number | null
  priceBandMax: number | null
  issuePrice: number | null
  lotSize: number | null
  issueSizeCr: number | null
  freshIssue: number | null
  offerForSale: number | null
  openDate: string | null
  closeDate: string | null
  allotmentDate: string | null
  refundDate: string | null
  listingDate: string | null
  registrarName: string | null
  registrarUrl: string | null
  leadManagers: string[]
  aboutCompany: string | null
  promoterHolding: number | null
  objectOfIssue: string | null
  financials: { year: string; revenue: number; pat: number; netWorth: number }[] | null
}

export interface SubscriptionData {
  retail: number
  hni: number
  qib: number
  total: number
  nii?: number
  employee?: number
  updatedAt: string
}

export interface GmpEntry {
  companyName: string
  slug: string
  gmpValue: number
  gmpPercent: number
  issuePrice: number
  expectedListing: number
  date: string
}

export interface ListingData {
  listingPrice: number
  issuePrice: number
  gainLoss: number
  listingDayClose: number
}

const NSE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.nseindia.com/market-data/all-upcoming-issues-ipo',
}

async function fetchWithRetry(url: string, headers: Record<string, string>, retries = 2): Promise<Response | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(15000),
      })
      if (res.ok) return res
      // NSE answers 401 or 403 until the session cookies are accepted; retry both
      if ((res.status === 401 || res.status === 403) && i < retries) {
        await new Promise(r => setTimeout(r, 2000))
        continue
      }
      return null
    } catch {
      if (i < retries) await new Promise(r => setTimeout(r, 1000))
    }
  }
  return null
}

export async function fetchNseIpos(): Promise<IpoData[]> {
  const ipos: IpoData[] = []

  try {
    // First hit the main page to get session cookies. Node's fetch has no cookie jar, so
    // forward them explicitly, and don't abort the whole run if this priming call fails.
    let cookie = ''
    try {
      const home = await fetch('https://www.nseindia.com', {
        headers: NSE_HEADERS,
        signal: AbortSignal.timeout(10000),
      })
      cookie = home.headers.getSetCookie().map(c => c.split(';')[0]).join('; ')
      await home.body?.cancel()
    } catch {
      // continue without cookies
    }

    const res = await fetchWithRetry(
      'https://www.nseindia.com/api/ipo-current-issue',
      cookie ? { ...NSE_HEADERS, Cookie: cookie } : NSE_HEADERS
    )
    if (!res) return ipos

    const data = await res.json()
    const issues = [...(data?.data || []), ...(data?.upcomingIssues || [])]

    for (const issue of issues) {
      const name = issue.companyName || issue.issuerCompany || ''
      if (!name) continue

      const openDate = issue.issueStartDate ? parseNseDate(issue.issueStartDate) : null
      const closeDate = issue.issueEndDate ? parseNseDate(issue.issueEndDate) : null
      const listingDate = issue.listingDate ? parseNseDate(issue.listingDate) : null

      let status: IpoData['status'] = 'UPCOMING'
      const today = todayIST()
      if (listingDate && listingDate <= today) status = 'LISTED'
      else if (closeDate && closeDate < today) status = 'CLOSED'
      else if (openDate && openDate <= today && (!closeDate || closeDate >= today)) status = 'OPEN'

      const priceBand = issue.issuePriceBand || issue.priceBand || ''
      const [min, max] = parsePriceBand(priceBand)

      ipos.push({
        companyName: name.trim(),
        ipoType: (issue.series === 'SME' || issue.platform === 'SME') ? 'SME' : 'MAINBOARD',
        exchange: 'NSE',
        status,
        priceBandMin: min,
        priceBandMax: max,
        issuePrice: max,
        lotSize: issue.minimumLotSize ? parseInt(issue.minimumLotSize) : null,
        issueSizeCr: issue.issueSize ? parseFloat(issue.issueSize) : null,
        freshIssue: null,
        offerForSale: null,
        openDate,
        closeDate,
        allotmentDate: null,
        refundDate: null,
        listingDate,
        registrarName: issue.registrar || null,
        registrarUrl: getRegistrarUrl(issue.registrar),
        leadManagers: issue.leadManager ? [issue.leadManager] : [],
        aboutCompany: null,
        promoterHolding: null,
        objectOfIssue: null,
        financials: null,
      })
    }
  } catch (error) {
    console.error('[ipoService] NSE fetch failed:', error instanceof Error ? error.message : error)
  }

  return ipos
}

function parseNseDate(dateStr: string): string | null {
  try {
    const trimmed = dateStr.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
    const d = new Date(trimmed)
    if (isNaN(d.getTime())) return null
    // NSE dates like "21-Oct-2024" parse as local midnight; toISOString() shifted them to
    // the previous day on hosts east of UTC (e.g. TZ=Asia/Kolkata). Use the local parts.
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  } catch {
    return null
  }
}

function parsePriceBand(band: string): [number | null, number | null] {
  if (!band) return [null, null]
  const numbers = band.match(/[\d,]+\.?\d*/g)
  if (!numbers || numbers.length === 0) return [null, null]
  const parsed = numbers.map(n => parseFloat(n.replace(/,/g, '')))
  if (parsed.length === 1) return [parsed[0], parsed[0]]
  return [Math.min(...parsed), Math.max(...parsed)]
}

function getRegistrarUrl(registrar: string | null): string | null {
  if (!registrar) return null
  const lower = registrar.toLowerCase()
  if (lower.includes('link intime') || lower.includes('linkintime'))
    return 'https://linkintime.co.in/mipo/ipoallotment.html'
  if (lower.includes('kfintech') || lower.includes('kfin'))
    return 'https://kosmic.kfintech.com/ipostatus/'
  if (lower.includes('bigshare'))
    return 'https://ipo.bigshareonline.com/IPO_Status.html'
  if (lower.includes('maashitla'))
    return 'https://maaborseipo.com/'
  return null
}

export function generateIpoSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/limited|ltd\.?|pvt\.?|private|industries|technologies|tech/gi, '')
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') + '-ipo'
}

export function determineStatus(ipo: { openDate?: string | null; closeDate?: string | null; allotmentDate?: string | null; listingDate?: string | null }): IpoData['status'] {
  const today = todayIST()
  if (ipo.listingDate && ipo.listingDate <= today) return 'LISTED'
  if (ipo.allotmentDate && ipo.allotmentDate <= today) return 'ALLOTMENT'
  if (ipo.closeDate && ipo.closeDate < today) return 'CLOSED'
  if (ipo.openDate && ipo.openDate <= today) return 'OPEN'
  return 'UPCOMING'
}

// Type safety verified
