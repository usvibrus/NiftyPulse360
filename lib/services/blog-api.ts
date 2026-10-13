const API_BASE = 'https://rankai.ai/api/v1/cmpyjpfb8000dcl5piunh4qwn'

// ─── Types ───────────────────────────────────────────────────────────

export interface BlogArticleSummary {
  id: string
  title: string
  slug: string
  excerpt: string
  featuredImageUrl: string | null
  publishedAt: string
  updatedAt: string
  author: string | null
  metaTitle: string | null
  metaDescription: string | null
  tags: string[]
}

export interface BlogArticleFull extends BlogArticleSummary {
  content: string            // HTML or Markdown depending on format param
  canonicalUrl: string | null
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ArticlesResponse {
  success: boolean
  data: BlogArticleSummary[]
  pagination: PaginationMeta
}

export interface ArticleResponse {
  success: boolean
  data: BlogArticleFull
}

// ─── Fetch helpers ───────────────────────────────────────────────────

/**
 * Fetch paginated article summaries from RankAI.
 * Returns empty data array on any failure so the UI never crashes.
 */
export async function fetchArticles(
  page = 1,
  limit = 12
): Promise<ArticlesResponse> {
  try {
    const res = await fetch(
      `${API_BASE}/articles?page=${page}&limit=${limit}`,
      { next: { revalidate: 60 } }
    )

    if (!res.ok) {
      console.error(`[blog-api] fetchArticles failed: ${res.status}`)
      return emptyResponse(page, limit)
    }

    const json = await res.json()
    // A 200 with an unexpected body (e.g. { success: false }) would otherwise crash /blog
    // when the page calls articles.length / articles.map.
    if (!json?.success || !Array.isArray(json.data)) {
      console.error('[blog-api] fetchArticles: unexpected response shape')
      return emptyResponse(page, limit)
    }
    return {
      success: true,
      data: json.data as BlogArticleSummary[],
      pagination: json.pagination ?? { page, limit, total: json.data.length, totalPages: 1 },
    }
  } catch (err) {
    console.error('[blog-api] fetchArticles error:', err)
    return emptyResponse(page, limit)
  }
}

/**
 * Fetch a single article by slug. Returns null if not found.
 * Uses ?format=html so content is ready to render.
 */
export async function fetchArticleBySlug(
  slug: string,
  format: 'html' | 'markdown' = 'html'
): Promise<BlogArticleFull | null> {
  try {
    const res = await fetch(
      `${API_BASE}/articles/${encodeURIComponent(slug)}?format=${format}`,
      { next: { revalidate: 60 } }
    )

    if (!res.ok) {
      if (res.status === 404) return null
      console.error(`[blog-api] fetchArticleBySlug failed: ${res.status}`)
      return null
    }

    const json = await res.json()
    if (!json.success || !json.data) return null
    return json.data as BlogArticleFull
  } catch (err) {
    console.error('[blog-api] fetchArticleBySlug error:', err)
    return null
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function emptyResponse(page: number, limit: number): ArticlesResponse {
  return {
    success: true,
    data: [],
    pagination: { page, limit, total: 0, totalPages: 0 },
  }
}
