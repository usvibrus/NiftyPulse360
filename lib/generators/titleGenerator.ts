import { format } from 'date-fns'

function formatDate(date: Date): string {
  return format(date, 'dd MMM yyyy')
}

/**
 * Strip corporate suffixes that nobody types in search queries.
 * "Vodafone Idea Limited" -> "Vodafone Idea"
 * "Hindustan Aeronautics Limited" -> "Hindustan Aeronautics"
 * "Mahindra & Mahindra Ltd." -> "Mahindra & Mahindra"
 * Common short names also get mapped to even shorter forms users actually search.
 */
const SHORT_NAME_OVERRIDES: Record<string, string> = {
  'HCLTECH': 'HCL Tech',
  'TECHM': 'Tech Mahindra',
  'M&M': 'Mahindra & Mahindra',
  'MARUTI': 'Maruti Suzuki',
  'INDUSINDBK': 'IndusInd Bank',
  'POWERGRID': 'Power Grid',
  'COALINDIA': 'Coal India',
  'BHARTIARTL': 'Bharti Airtel',
  'HDFCBANK': 'HDFC Bank',
  'ICICIBANK': 'ICICI Bank',
  'KOTAKBANK': 'Kotak Mahindra Bank',
  'SBIN': 'State Bank of India',
  'AXISBANK': 'Axis Bank',
  'BANKBARODA': 'Bank of Baroda',
  'TATASTEEL': 'Tata Steel',
  'TATAMOTORS': 'Tata Motors',
  'TATACONSUM': 'Tata Consumer',
  'TATAPOWER': 'Tata Power',
  'TATACOMM': 'Tata Communications',
  'JSWENERGY': 'JSW Energy',
  'JSWSTEEL': 'JSW Steel',
  'ULTRACEMCO': 'UltraTech Cement',
  'BAJFINANCE': 'Bajaj Finance',
  'BAJAJ-AUTO': 'Bajaj Auto',
  'BAJAJFINSV': 'Bajaj Finserv',
  'HDFCAMC': 'HDFC AMC',
  'HDFCLIFE': 'HDFC Life',
  'SBILIFE': 'SBI Life',
  'ICICIPRULI': 'ICICI Prudential',
  'KALYANKJIL': 'Kalyan Jewellers',
  'OFSS': 'Oracle Financial Services',
  'PERSISTENT': 'Persistent Systems',
  'MOTHERSON': 'Samvardhana Motherson',
  'MANKIND': 'Mankind Pharma',
  'SOLARINDS': 'Solar Industries',
  'ZYDUSLIFE': 'Zydus Lifesciences',
  'DRREDDY': 'Dr Reddy',
  'BHEL': 'BHEL',
  'IDEA': 'Vodafone Idea',
  'HUDCO': 'HUDCO',
  'HAL': 'HAL',
  'MCX': 'MCX',
  'INDIGO': 'IndiGo',
  'COCHINSHIP': 'Cochin Shipyard',
  'CGPOWER': 'CG Power',
  'BIOCON': 'Biocon',
  'ASTRAL': 'Astral',
  'ABB': 'ABB India',
  'GAIL': 'GAIL',
  'NTPC': 'NTPC',
  'SAIL': 'SAIL',
  'WIPRO': 'Wipro',
  'BRITANNIA': 'Britannia',
  'GLENMARK': 'Glenmark Pharma',
  'CUMMINSIND': 'Cummins India',
  'HINDPETRO': 'HPCL',
  'HINDALCO': 'Hindalco',
  'TRENT': 'Trent',
  'POLICYBZR': 'Policybazaar',
  'SWIGGY': 'Swiggy',
  'GROWW': 'Groww',
  'LENSKART': 'Lenskart',
  'DIXON': 'Dixon Tech',
  'VOLTAS': 'Voltas',
  'LTM': 'LTIMindtree',
  'LODHA': 'Lodha',
  'HYUNDAI': 'Hyundai Motor',
  'SIEMENS': 'Siemens',
  'ETERNAL': 'Eternal',
  'PATANJALI': 'Patanjali Foods',
  'ADANIGREEN': 'Adani Green',
  'ADANIENSOL': 'Adani Energy Solutions',
  'ADANIPOWER': 'Adani Power',
  'ASHOKLEY': 'Ashok Leyland',
  'MAZDOCK': 'Mazagon Dock',
  'SUNPHARMA': 'Sun Pharma',
  'VEDL': 'Vedanta',
  'MARICO': 'Marico',
  'TMPV': 'Tata Motors PV',
}

function shortName(symbol: string, fullName: string): string {
  // 1. Symbol-based override wins (more user-friendly than corporate name)
  if (SHORT_NAME_OVERRIDES[symbol]) return SHORT_NAME_OVERRIDES[symbol]

  // 2. Otherwise strip common corporate suffixes
  return fullName
    .replace(/\s+(Limited|Ltd\.?|Industries|Corporation|Corp\.?|Pvt\.?|Pvt\.? Ltd\.?|Private Limited|Pharmaceuticals|Pharmaceutical|Industries Limited|India Limited|of India)\s*$/i, '')
    .trim()
}

/**
 * Pick a verb that matches the magnitude of the move.
 * Big moves get more attention-grabbing verbs that match user intent.
 */
function activeVerb(eventType: 'RISE' | 'FALL', pct: number): string {
  if (eventType === 'RISE') {
    if (pct >= 8) return 'Surges'
    if (pct >= 4) return 'Jumps'
    return 'Rises'
  } else {
    if (pct >= 8) return 'Plunges'
    if (pct >= 4) return 'Slides'
    return 'Falls'
  }
}

function formatPct(pct: number): string {
  // 1 decimal if under 10%, integer if over
  return pct >= 10 ? `${Math.round(pct)}%` : `${pct.toFixed(1)}%`
}

export function generateStockTitle(
  companyName: string,
  symbol: string,
  eventType: 'RISE' | 'FALL',
  changePercent: number,
  date: Date,
  options?: { newsTrigger?: string; volume?: number; avgVolume?: number; sector?: string }
) {
  const d = formatDate(date)
  const dShort = format(date, 'MMM yyyy')
  const verb = activeVerb(eventType, changePercent)
  const verbLower = eventType === 'RISE' ? 'rises' : 'falls'
  const pct = formatPct(changePercent)
  const display = shortName(symbol, companyName)

  // META TITLE — search-intent-matched, ~55-65 chars
  // Format: "[Name] Share Price [Verb] [Pct]% Today: Reasons & Analysis ([Date])"
  // Falls back to shorter format if too long.
  const longTitle = `${display} Share Price ${verb} ${pct} Today: Reasons & Analysis (${d})`
  const mediumTitle = `${display} Share Price ${verb} ${pct} Today: Reasons (${dShort})`
  const shortTitle = `${display} Share ${verb} ${pct} Today: Reasons (${dShort})`

  let metaTitle: string
  if (longTitle.length <= 70) metaTitle = longTitle
  else if (mediumTitle.length <= 70) metaTitle = mediumTitle
  else metaTitle = shortTitle

  // META DESCRIPTION — keeps the why & data, 140-160 chars
  let metaDesc = `${display} (${symbol}) share price ${verbLower} ${changePercent.toFixed(2)}% today on NSE.`
  if (options?.newsTrigger) {
    const trigger = options.newsTrigger.length > 70 ? options.newsTrigger.substring(0, 67) + '...' : options.newsTrigger
    metaDesc += ` ${trigger}.`
  } else {
    metaDesc += ` Find out the key reasons behind today's ${eventType === 'RISE' ? 'rally' : 'decline'}, news and analysis.`
  }
  if (options?.sector) metaDesc += ` ${options.sector}.`
  if (metaDesc.length > 160) metaDesc = metaDesc.substring(0, 157) + '...'

  // H1 (on-page heading) — slightly different from title to avoid duplicate-content signals
  const h1 = `Why Did ${display} (${symbol}) Share Price ${eventType === 'RISE' ? 'Rise' : 'Fall'} ${changePercent.toFixed(2)}% Today?`

  return { metaTitle, h1, metaDesc }
}

export function generateIndexTitle(indexName: string, eventType: 'RISE' | 'FALL', changePoints: number, date: Date) {
  const d = formatDate(date)
  const dShort = format(date, 'MMM yyyy')
  const verb = eventType === 'RISE' ? 'Rises' : 'Falls'
  const verbLower = eventType === 'RISE' ? 'rises' : 'falls'
  const pts = Math.round(changePoints)

  const longTitle = `${indexName} ${verb} ${pts} Points Today: Reasons & Analysis (${d})`
  const shortTitle = `${indexName} ${verb} ${pts} Points Today: Reasons (${dShort})`
  const metaTitle = longTitle.length <= 70 ? longTitle : shortTitle

  return {
    metaTitle,
    h1: `Why Did ${indexName} ${eventType === 'RISE' ? 'Rise' : 'Fall'} ${pts} Points Today?`,
    metaDesc: `${indexName} ${verbLower} ${pts} points today. Find out the reasons behind today's ${eventType === 'RISE' ? 'rally' : 'decline'} with latest news, FII/DII activity and sector analysis.`,
  }
}

export function generateMetalTitle(metal: string, eventType: 'RISE' | 'FALL', changePercent: number, date: Date) {
  const d = formatDate(date)
  const dShort = format(date, 'MMM yyyy')
  const verb = eventType === 'RISE' ? 'Rises' : 'Falls'
  const verbLower = eventType === 'RISE' ? 'rises' : 'falls'
  const metalName = metal === 'GOLD' ? 'Gold' : 'Silver'
  const pct = formatPct(changePercent)

  const longTitle = `${metalName} Price ${verb} ${pct} Today in India: Reasons (${d})`
  const shortTitle = `${metalName} Price ${verb} ${pct} Today: Reasons (${dShort})`
  const metaTitle = longTitle.length <= 70 ? longTitle : shortTitle

  return {
    metaTitle,
    h1: `Why Did ${metalName} Price ${eventType === 'RISE' ? 'Rise' : 'Fall'} ${changePercent.toFixed(1)}% Today In India?`,
    metaDesc: `${metalName} price ${verbLower} ${changePercent.toFixed(2)}% today in India. Check latest ${metalName.toLowerCase()} rate per gram, per tola and reasons behind today's price movement.`,
  }
}

export function generateCommodityTitle(commodity: string, eventType: 'RISE' | 'FALL', changePercent: number, date: Date) {
  const d = formatDate(date)
  const dShort = format(date, 'MMM yyyy')
  const verb = eventType === 'RISE' ? 'Rises' : 'Falls'
  const verbLower = eventType === 'RISE' ? 'rises' : 'falls'
  // "CRUDE_OIL" -> "Crude Oil" (lowercase first, otherwise the title-case regex is a no-op)
  const name = commodity.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  const pct = formatPct(changePercent)

  const longTitle = `${name} Price ${verb} ${pct} Today: Reasons & Analysis (${d})`
  const shortTitle = `${name} Price ${verb} ${pct} Today (${dShort})`
  const metaTitle = longTitle.length <= 70 ? longTitle : shortTitle

  return {
    metaTitle,
    h1: `Why Did ${name} Price ${eventType === 'RISE' ? 'Rise' : 'Fall'} ${changePercent.toFixed(1)}% Today?`,
    metaDesc: `${name} price ${verbLower} ${changePercent.toFixed(2)}% today. Find out the reasons behind today's ${name.toLowerCase()} price movement and impact on Indian markets.`,
  }
}

export function generateCurrencyTitle(pair: string, eventType: 'RISE' | 'FALL', changePercent: number, date: Date) {
  const d = formatDate(date)
  const dShort = format(date, 'MMM yyyy')
  const verb = eventType === 'RISE' ? 'Rises' : 'Falls'
  const verbLower = eventType === 'RISE' ? 'rises' : 'falls'
  const pairName = pair.replace('_', '/')
  const pct = formatPct(changePercent)

  const longTitle = `${pairName} Exchange Rate ${verb} ${pct} Today: Reasons (${d})`
  const shortTitle = `${pairName} ${verb} ${pct} Today: Reasons (${dShort})`
  const metaTitle = longTitle.length <= 70 ? longTitle : shortTitle

  return {
    metaTitle,
    h1: `Why Did ${pairName} ${eventType === 'RISE' ? 'Rise' : 'Fall'} ${changePercent.toFixed(1)}% Today?`,
    metaDesc: `${pairName} exchange rate ${verbLower} ${changePercent.toFixed(2)}% today. Check latest rate and reasons behind today's currency movement.`,
  }
}

// Error boundaries validated
