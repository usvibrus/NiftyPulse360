import type { NewsItem } from './newsService'

export interface StockAnalysisInput {
  symbol: string
  companyName: string
  sector: string
  changePercent: number
  eventType: 'RISE' | 'FALL'
  open: number
  close: number
  high: number
  low: number
  volume: number
  avgVolume: number
  week52High: number
  week52Low: number
  sectorChange: number | null
  niftyChange: number | null
  date: string
}

export interface AnalysisResult {
  analysis: string
  faq: { question: string; answer: string }[]
}

const SHARED_PROMPT_RULES = `Analysis rules:
- 200-250 words explaining why the stock moved today
- Mention specific news trigger if exists
- Comment on volume relative to average and what it signals
- Mention 52-week context (near high? near low?)
- Compare to sector and Nifty performance
- Write in simple English for Indian retail investors
- DO NOT use phrases like "it is worth noting", "market participants", "ongoing market dynamics"
- DO NOT give buy/sell advice
- End with ONE sentence on what to watch in coming sessions
- Use Indian number format (Cr, L)

FAQ rules:
- Q1: Why did the stock move today? (use real data + news)
- Q2: 52-week high/low context
- Q3: Should investors watch this stock? (NEUTRAL — not financial advice)
- Each answer 2-3 sentences`

function buildPrompt(stock: StockAnalysisInput, news: NewsItem[]): string {
  const direction = stock.eventType === 'RISE' ? 'rose' : 'fell'
  const volRatio = stock.avgVolume > 0 ? (stock.volume / stock.avgVolume).toFixed(1) : 'N/A'
  const newsBlock = news.length > 0
    ? news.slice(0, 5).map(n => `- ${n.title} (${n.source})`).join('\n')
    : '- No major news in last 48 hours'

  return `You are a financial analyst writing for Indian retail investors on NiftyPulse360.

Stock: ${stock.companyName} (${stock.symbol})
Date: ${stock.date}
Price ${direction} ${Math.abs(stock.changePercent)}%
Open: ₹${stock.open} | Close: ₹${stock.close} | High: ₹${stock.high} | Low: ₹${stock.low}
Volume: ${stock.volume.toLocaleString('en-IN')} shares (${volRatio}x the 30-day average of ${stock.avgVolume.toLocaleString('en-IN')})
52-Week High: ₹${stock.week52High} | 52-Week Low: ₹${stock.week52Low}
Sector: ${stock.sector}
Sector index change today: ${stock.sectorChange !== null ? stock.sectorChange.toFixed(2) + '%' : 'N/A'}
Nifty 50 change today: ${stock.niftyChange !== null ? stock.niftyChange.toFixed(2) + '%' : 'N/A'}

Today's news (last 48 hours only):
${newsBlock}

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "analysis": "200-250 word analysis here",
  "faq": [
    {"question": "Q1", "answer": "A1"},
    {"question": "Q2", "answer": "A2"},
    {"question": "Q3", "answer": "A3"}
  ]
}

${SHARED_PROMPT_RULES}`
}

function parseJsonResponse(text: string): AnalysisResult | null {
  try {
    const cleaned = text.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
    const parsed = JSON.parse(cleaned)
    if (parsed.analysis && Array.isArray(parsed.faq) && parsed.faq.length > 0) {
      return { analysis: parsed.analysis, faq: parsed.faq.slice(0, 3) }
    }
    return null
  } catch {
    return null
  }
}

// ──────────────────────────────────────────
// PROVIDER 1: Gemini (Google) — direct REST (no SDK, saves ~20-30MB RAM)
// ──────────────────────────────────────────
async function generateWithGemini(stock: StockAnalysisInput, news: NewsItem[]): Promise<AnalysisResult | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(stock, news) }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1200 },
        }),
        signal: AbortSignal.timeout(60000),
      }
    )

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      if (res.status === 429 || body.toLowerCase().includes('quota')) {
        console.warn(`[aiAnalysis:gemini] quota exceeded for ${stock.symbol}`)
      } else {
        console.warn(`[aiAnalysis:gemini] HTTP ${res.status} for ${stock.symbol}: ${body.slice(0, 200)}`)
      }
      return null
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return null
    return parseJsonResponse(text)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn(`[aiAnalysis:gemini] failed for ${stock.symbol}:`, msg.slice(0, 200))
    return null
  }
}

// ──────────────────────────────────────────
// PROVIDER 2: OpenRouter (free models) — fallback
// Set OPENROUTER_API_KEY in env. Pick a free model via OPENROUTER_MODEL.
// Good free choices (as of 2026): meta-llama/llama-3.3-70b-instruct:free,
// deepseek/deepseek-chat:free, google/gemini-2.0-flash-exp:free,
// nvidia/llama-3.1-nemotron-70b-instruct:free
// ──────────────────────────────────────────
async function generateWithOpenRouter(stock: StockAnalysisInput, news: NewsItem[]): Promise<AnalysisResult | null> {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) return null

  const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': siteUrl,
        'X-Title': 'NiftyPulse360',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a financial analyst. Respond ONLY with valid JSON, no markdown.' },
          { role: 'user', content: buildPrompt(stock, news) },
        ],
        temperature: 0.4,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.warn(`[aiAnalysis:openrouter] HTTP ${res.status} for ${stock.symbol}: ${body.slice(0, 200)}`)
      return null
    }

    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content
    if (!text) return null
    return parseJsonResponse(text)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn(`[aiAnalysis:openrouter] failed for ${stock.symbol}:`, msg.slice(0, 200))
    return null
  }
}

// ──────────────────────────────────────────
// PROVIDER 3: Static fallback — last resort
// ──────────────────────────────────────────
function fallbackAnalysis(stock: StockAnalysisInput, news: NewsItem[]): string {
  const verb = stock.eventType === 'RISE' ? 'rose' : 'fell'
  const volRatio = stock.avgVolume > 0 ? (stock.volume / stock.avgVolume).toFixed(1) : '1.0'
  const newsTrigger = news.length > 0
    ? `Today's news shows: ${news[0].title}.`
    : 'No major company-specific news was published in the last 48 hours.'
  // changePercent is a magnitude, so compare the signed move with the sector. Without sector
  // data say nothing, instead of "data unavailable, with the stock outperforming its sector".
  const signedChange = stock.eventType === 'RISE' ? stock.changePercent : -stock.changePercent
  const sectorText = stock.sectorChange !== null
    ? ` The ${stock.sector || 'broader'} sector moved ${stock.sectorChange > 0 ? 'up' : 'down'} ${Math.abs(stock.sectorChange).toFixed(1)}% today, with the stock ${signedChange > stock.sectorChange ? 'outperforming' : 'underperforming'} its sector.`
    : ''
  const week52Text = stock.week52High > 0
    ? `The 52-week range stands at ₹${stock.week52Low.toFixed(0)} to ₹${stock.week52High.toFixed(0)}.`
    : ''

  return `${stock.companyName} (${stock.symbol}) shares ${verb} ${stock.changePercent.toFixed(2)}% on ${stock.date}, closing at ₹${stock.close.toFixed(2)}. ${newsTrigger} Volume today was ${(stock.volume / 100000).toFixed(1)}L shares, ${volRatio}x the 30-day average — ${parseFloat(volRatio) > 1.5 ? 'indicating elevated trading activity and potential institutional interest' : 'reflecting moderate participation'}.${sectorText} ${week52Text} Investors should monitor follow-up volume and any further news in coming sessions to confirm the trend.`
}

function fallbackFAQ(stock: StockAnalysisInput, news: NewsItem[]): { question: string; answer: string }[] {
  const verb = stock.eventType === 'RISE' ? 'rise' : 'fall'
  const verbPast = stock.eventType === 'RISE' ? 'rose' : 'fell'
  const newsTrigger = news.length > 0 ? news[0].title : 'broader market movement and sector trends'
  return [
    {
      question: `Why did ${stock.companyName} share price ${verb} today?`,
      answer: `${stock.companyName} (${stock.symbol}) ${verbPast} ${stock.changePercent.toFixed(2)}% on ${stock.date} due to ${newsTrigger}. Trading volume was ${(stock.volume / 100000).toFixed(1)}L shares.`,
    },
    {
      question: `What is ${stock.companyName}'s 52-week high and low?`,
      answer: stock.week52High > 0
        ? `${stock.companyName}'s 52-week high is ₹${stock.week52High.toFixed(2)} and 52-week low is ₹${stock.week52Low.toFixed(2)}. The current price of ₹${stock.close.toFixed(2)} is ${((stock.close - stock.week52Low) / (stock.week52High - stock.week52Low) * 100).toFixed(0)}% of this range.`
        : `52-week high/low data is not available for ${stock.companyName} at this time.`,
    },
    {
      question: `Is ${stock.companyName} a good stock to watch after today's move?`,
      answer: `Today's ${stock.changePercent.toFixed(1)}% ${verb} in ${stock.symbol} on ${(stock.volume / 100000).toFixed(1)}L volume is worth tracking. Investors should monitor follow-through price action and upcoming corporate announcements. This is not financial advice — please consult a SEBI-registered advisor before investing.`,
    },
  ]
}

// ──────────────────────────────────────────
// MAIN ENTRY: OpenRouter → Gemini → static fallback
// ──────────────────────────────────────────
export async function generateStockAnalysis(stock: StockAnalysisInput, news: NewsItem[]): Promise<AnalysisResult> {
  // Try OpenRouter first (gpt-oss-120b free)
  const openrouter = await generateWithOpenRouter(stock, news)
  if (openrouter) return openrouter

  // Fall back to Gemini
  const gemini = await generateWithGemini(stock, news)
  if (gemini) {
    console.log(`[aiAnalysis] Used Gemini fallback for ${stock.symbol}`)
    return gemini
  }

  // Last resort: static template
  console.log(`[aiAnalysis] Used static fallback for ${stock.symbol}`)
  return {
    analysis: fallbackAnalysis(stock, news),
    faq: fallbackFAQ(stock, news),
  }
}
