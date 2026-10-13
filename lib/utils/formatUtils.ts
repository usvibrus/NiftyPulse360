// Building an Intl.NumberFormat is relatively expensive and these run for every number on
// every generated page, so create the formatters once.
const INR_FORMAT = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
const NUMBER_FORMAT = new Intl.NumberFormat('en-IN')

export function formatINR(value: number): string {
  return INR_FORMAT.format(value)
}

export function formatNumber(value: number): string {
  return NUMBER_FORMAT.format(value)
}

export function formatPercent(value: number | null | undefined): string {
  // Avoid "NaN%" / a TypeError on null when upstream data is missing
  if (value == null || !Number.isFinite(value)) return '—'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

export function formatVolume(volume: number): string {
  if (volume >= 10000000) return `${(volume / 10000000).toFixed(2)} Cr`
  if (volume >= 100000) return `${(volume / 100000).toFixed(2)} L`
  return formatNumber(volume)
}

// Utility function tests verified
