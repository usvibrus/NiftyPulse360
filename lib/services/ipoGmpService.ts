export interface GmpScrapedEntry {
  companyName: string
  gmpValue: number
  issuePrice: number
  ipoType: 'MAINBOARD' | 'SME'
}

export async function scrapeGmpData(): Promise<GmpScrapedEntry[]> {
  const entries: GmpScrapedEntry[] = []

  try {
    const res = await fetch('https://ipowatch.in/ipo-grey-market-premium-latest-ipo-gmp/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      console.warn(`[ipoGmpService] Scrape failed: ${res.status}`)
      return entries
    }

    const html = await res.text()
    // Parse GMP table rows — pattern: <tr><td>Company</td><td>₹Price</td><td>₹GMP</td>...</tr>
    const tableMatches = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi) || []

    for (const table of tableMatches) {
      const rows = table.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || []

      for (const row of rows.slice(1)) { // skip header
        const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || []
        if (cells.length < 3) continue

        const nameRaw = cells[0]!.replace(/<[^>]+>/g, '').trim()
        const priceRaw = cells[1]!.replace(/<[^>]+>/g, '').replace(/[₹,\s]/g, '').trim()
        const gmpRaw = cells[2]!.replace(/<[^>]+>/g, '').replace(/[₹,\s]/g, '').trim()

        const issuePrice = parseFloat(priceRaw)
        const gmpValue = parseFloat(gmpRaw)

        if (!nameRaw || isNaN(issuePrice) || isNaN(gmpValue)) continue
        if (issuePrice <= 0) continue

        const isSme = nameRaw.toLowerCase().includes('sme') ||
          (cells.length > 4 && cells[4]?.toLowerCase().includes('sme'))

        entries.push({
          companyName: nameRaw.replace(/\s*\(.*?\)\s*/g, '').trim(),
          gmpValue,
          issuePrice,
          ipoType: isSme ? 'SME' : 'MAINBOARD',
        })
      }
    }
  } catch (error) {
    console.error('[ipoGmpService] Scrape error:', error instanceof Error ? error.message : error)
  }

  // Fallback: try alternative source
  if (entries.length === 0) {
    return scrapeGmpFallback()
  }

  return entries
}

async function scrapeGmpFallback(): Promise<GmpScrapedEntry[]> {
  const entries: GmpScrapedEntry[] = []

  try {
    const res = await fetch('https://www.investorgain.com/report/live-ipo-gmp/331/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) return entries

    const html = await res.text()
    // InvestorGain uses a table with columns: IPO | Price | GMP | Est Listing | ...
    const rows = html.match(/<tr[^>]*class="[^"]*"[^>]*>[\s\S]*?<\/tr>/gi) || []

    for (const row of rows) {
      const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || []
      if (cells.length < 4) continue

      const name = cells[0]!.replace(/<[^>]+>/g, '').trim()
      const price = parseFloat(cells[1]!.replace(/<[^>]+>/g, '').replace(/[₹,\s]/g, ''))
      const gmp = parseFloat(cells[2]!.replace(/<[^>]+>/g, '').replace(/[₹,+\s]/g, ''))

      if (!name || isNaN(price) || isNaN(gmp) || price <= 0) continue

      entries.push({
        companyName: name,
        gmpValue: gmp,
        issuePrice: price,
        ipoType: 'MAINBOARD',
      })
    }
  } catch (error) {
    console.error('[ipoGmpService] Fallback scrape error:', error instanceof Error ? error.message : error)
  }

  return entries
}

export function matchGmpToIpo(gmpEntries: GmpScrapedEntry[], ipoName: string): GmpScrapedEntry | null {
  const normalizedIpo = ipoName.toLowerCase().replace(/limited|ltd|pvt|private|industries|technologies/gi, '').trim()
  const firstWord = normalizedIpo.split(/\s+/)[0]

  for (const entry of gmpEntries) {
    const normalizedEntry = entry.companyName.toLowerCase().replace(/limited|ltd|pvt|private|industries|technologies/gi, '').trim()
    if (normalizedEntry.includes(normalizedIpo) || normalizedIpo.includes(normalizedEntry)) return entry
    if (normalizedEntry.startsWith(firstWord) && firstWord.length >= 4) return entry
  }

  return null
}
