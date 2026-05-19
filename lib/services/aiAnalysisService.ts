import { GoogleGenerativeAI } from '@google/generative-ai'
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
// PROVIDER 1: Gemini (Google) — primary
// ──────────────────────────────────────────
async function generateWithGemini(stock: StockAnalysisInput, news: NewsItem[]): Promise<AnalysisResult | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null

  try {
    const genAI = new GoogleGenerativeAI(key)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(buildPrompt(stock, news))
    return parseJsonResponse(result.response.text())
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    // Compact log — don't dump the giant axios object
    if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
      console.warn(`[aiAnalysis:gemini] quota exceeded for ${stock.symbol}`)
    } else {
      console.warn(`[aiAnalysis:gemini] failed for ${stock.symbol}:`, msg.slice(0, 200))
    }
    return null
  }
}

// ──────────────────────────────────────────
// PROVIDER 2: Groq (free Llama inference) — fallback
// ──────────────────────────────────────────
async function generateWithGroq(stock: StockAnalysisInput, news: NewsItem[]): Promise<AnalysisResult | null> {
  const key = process.env.GROQ_API_KEY
  if (!key) return null

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a financial analyst. Respond ONLY with valid JSON, no markdown.' },
          { role: 'user', content: buildPrompt(stock, news) },
        ],
        temperature: 0.4,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) {
      console.warn(`[aiAnalysis:groq] HTTP ${res.status} for ${stock.symbol}`)
      return null
    }

    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content
    if (!text) return null
    return parseJsonResponse(text)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn(`[aiAnalysis:groq] failed for ${stock.symbol}:`, msg.slice(0, 200))
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
  const sectorText = stock.sectorChange !== null
    ? `The ${stock.sector || 'broader'} sector moved ${stock.sectorChange > 0 ? 'up' : 'down'} ${Math.abs(stock.sectorChange).toFixed(1)}% today`
    : 'Sector performance data unavailable'
  const week52Text = stock.week52High > 0
    ? `The 52-week range stands at ₹${stock.week52Low.toFixed(0)} to ₹${stock.week52High.toFixed(0)}.`
    : ''

  return `${stock.companyName} (${stock.symbol}) shares ${verb} ${stock.changePercent.toFixed(2)}% on ${stock.date}, closing at ₹${stock.close.toFixed(2)}. ${newsTrigger} Volume today was ${(stock.volume / 100000).toFixed(1)}L shares, ${volRatio}x the 30-day average — ${parseFloat(volRatio) > 1.5 ? 'indicating elevated trading activity and potential institutional interest' : 'reflecting moderate participation'}. ${sectorText}, ${stock.changePercent > Math.abs(stock.sectorChange || 0) ? 'with the stock outperforming its sector' : 'broadly in line with sector trend'}. ${week52Text} Investors should monitor follow-up volume and any further news in coming sessions to confirm the trend.`
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
// MAIN ENTRY: Gemini → Groq → static fallback
// ──────────────────────────────────────────
export async function generateStockAnalysis(stock: StockAnalysisInput, news: NewsItem[]): Promise<AnalysisResult> {
  // Try Gemini first
  const gemini = await generateWithGemini(stock, news)
  if (gemini) return gemini

  // Fall back to Groq
  const groq = await generateWithGroq(stock, news)
  if (groq) {
    console.log(`[aiAnalysis] Used Groq fallback for ${stock.symbol}`)
    return groq
  }

  // Last resort: static template
  console.log(`[aiAnalysis] Used static fallback for ${stock.symbol}`)
  return {
    analysis: fallbackAnalysis(stock, news),
    faq: fallbackFAQ(stock, news),
  }
}
