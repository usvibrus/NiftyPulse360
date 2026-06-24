/**
 * Sector universe maps for SEO listing pages.
 * Each sector has its top constituent NSE stocks.
 * Used by /sectors/* SEO listing pages — independent of existing pageGenerator logic.
 */

export interface SectorUniverse {
  slug: string
  name: string
  description: string
  symbols: string[]
}

export const SECTOR_UNIVERSES: SectorUniverse[] = [
  {
    slug: 'nifty-it-stocks-today',
    name: 'Nifty IT',
    description: 'Top NSE-listed Indian IT services and software companies. Live performance for today.',
    symbols: [
      'TCS', 'INFY', 'HCLTECH', 'WIPRO', 'TECHM',
      'LTIM', 'PERSISTENT', 'MPHASIS', 'COFORGE', 'OFSS',
      'LTTS', 'KPITTECH', 'TATAELXSI',
    ],
  },
  {
    slug: 'nifty-pharma-stocks-today',
    name: 'Nifty Pharma',
    description: 'Top NSE-listed Indian pharmaceutical and healthcare companies. Live performance for today.',
    symbols: [
      'SUNPHARMA', 'CIPLA', 'DRREDDY', 'DIVISLAB', 'APOLLOHOSP',
      'LUPIN', 'TORNTPHARM', 'AUROPHARMA', 'ZYDUSLIFE', 'BIOCON',
      'ALKEM', 'GLENMARK', 'IPCALAB', 'LAURUSLABS',
    ],
  },
  {
    slug: 'nifty-auto-stocks-today',
    name: 'Nifty Auto',
    description: 'Top NSE-listed Indian automobile, two-wheeler and auto component companies. Live performance for today.',
    symbols: [
      'MARUTI', 'TATAMOTORS', 'M&M', 'BAJAJ-AUTO', 'EICHERMOT',
      'HEROMOTOCO', 'TVSMOTOR', 'ASHOKLEY', 'BOSCHLTD', 'MOTHERSON',
      'BALKRISIND', 'MRF', 'APOLLOTYRE',
    ],
  },
  {
    slug: 'nifty-realty-stocks-today',
    name: 'Nifty Realty',
    description: 'Top NSE-listed Indian real estate developers and realty companies. Live performance for today.',
    symbols: [
      'DLF', 'GODREJPROP', 'OBEROIRLTY', 'PRESTIGE', 'BRIGADE',
      'PHOENIXLTD', 'LODHA', 'SOBHA', 'MAHLIFE', 'SUNTECK',
    ],
  },
  {
    slug: 'nifty-ev-stocks-today',
    name: 'Nifty EV & New-Energy',
    description: 'NSE-listed Indian electric vehicle, battery and clean-energy companies. Live performance for today.',
    symbols: [
      'TATAMOTORS', 'M&M', 'TVSMOTOR', 'BAJAJ-AUTO', 'OLECTRA',
      'EXIDEIND', 'ARE&M', 'IEX', 'TATAPOWER', 'ADANIGREEN',
      'SUZLON', 'INOXWIND', 'BHEL', 'WAAREEENER',
    ],
  },
]

export function getSectorBySlug(slug: string): SectorUniverse | undefined {
  return SECTOR_UNIVERSES.find(s => s.slug === slug)
}

// Sector universe data verified
