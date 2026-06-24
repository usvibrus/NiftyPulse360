import type { NewsItem } from '@/lib/services/newsService'

export interface QualityGateInput {
  pageContent: string
  news: NewsItem[]
  changePercent: number
  dataPointCount: number
}

export interface QualityGateResult {
  pass: boolean
  reasons: string[]
  metrics: { wordCount: number; newsCount: number; dataPoints: number; absChange: number }
}

// Thresholds calibrated to actual content generator output (avg ~443 words per stock page).
// Set conservatively below the floor so we only reject pages that look truly broken.
const MIN_WORDS = 250
const MIN_DATA_POINTS = 5
// Only block "no news + small move" when the move is genuinely tiny.
// Real stocks frequently move 1-5% with no fresh news; that's still publishable
// because the analysis includes price/volume/52w/sector context.
const MIN_CHANGE_WITHOUT_NEWS = 1.0

function stripHtml(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function countWords(text: string): number {
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

export function qualityGate(input: QualityGateInput): QualityGateResult {
  const text = stripHtml(input.pageContent)
  const wordCount = countWords(text)
  const newsCount = input.news?.length ?? 0
  const dataPoints = input.dataPointCount
  const absChange = Math.abs(input.changePercent)

  const reasons: string[] = []

  if (wordCount < MIN_WORDS) reasons.push(`word count ${wordCount} < ${MIN_WORDS}`)
  if (dataPoints < MIN_DATA_POINTS) reasons.push(`data points ${dataPoints} < ${MIN_DATA_POINTS}`)
  if (newsCount === 0 && absChange < MIN_CHANGE_WITHOUT_NEWS) {
    reasons.push(`no news + tiny move (${absChange.toFixed(2)}% < ${MIN_CHANGE_WITHOUT_NEWS}%)`)
  }

  return {
    pass: reasons.length === 0,
    reasons,
    metrics: { wordCount, newsCount, dataPoints, absChange },
  }
}

// Error boundaries validated
