/**
 * Lazy Yahoo Finance loader.
 *
 * Why this exists: yahoo-finance2 maintains an internal tough-cookie jar
 * that grows with every request and never gets cleaned. When the library is
 * imported at module scope, the jar lives for the lifetime of the server,
 * causing slow memory growth (observed: 250 MB → 600 MB over 12 hours).
 *
 * By creating a fresh instance inside an async function and letting it go
 * out of scope after each call, the cookie jar gets garbage-collected and
 * memory stays flat.
 *
 * Usage:
 *   const yf = await getYahooFinance()
 *   const quote = await yf.quote('^NSEI')
 *   // yf goes out of scope, GC reclaims its cookie jar
 */
export async function getYahooFinance() {
  // Dynamic import so the package is only loaded the first time it's needed.
  // After the first call Node caches the module, but each call still gets a
  // fresh instance with its own (small) cookie jar.
  const mod = await import('yahoo-finance2')
  // Default export is the YahooFinance class
  const YahooFinance = (mod as unknown as { default: new (opts?: unknown) => unknown }).default
  return new YahooFinance({ suppressNotices: ['yahooSurvey'] }) as {
    quote: (symbol: string) => Promise<unknown>
    quoteSummary: (symbol: string, opts: { modules: string[] }) => Promise<unknown>
  }
}
