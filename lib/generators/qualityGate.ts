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

const MIN_WORDS = 800
const MIN_DATA_POINTS = 5
// If no news AND move smaller than this, skip (guarantees quality even for sector-only narratives)
const MIN_CHANGE_WITHOUT_NEWS = 3

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
    reasons.push(`no news + small move (${absChange.toFixed(2)}% < ${MIN_CHANGE_WITHOUT_NEWS}%)`)
  }

  return {
    pass: reasons.length === 0,
    reasons,
    metrics: { wordCount, newsCount, dataPoints, absChange },
  }
}
