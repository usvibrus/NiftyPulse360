import type { Metadata } from 'next'
import Link from 'next/link'
import { fetchArticles } from '@/lib/services/blog-api'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'

export const metadata: Metadata = {
  title: 'Blog — Market Insights & Analysis',
  description:
    'Read the latest market insights, stock analysis, investment strategies and financial news from NiftyPulse360.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog — Market Insights & Analysis | NiftyPulse360',
    description:
      'Read the latest market insights, stock analysis, investment strategies and financial news from NiftyPulse360.',
    url: `${SITE}/blog`,
    type: 'website',
  },
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const currentPage = Math.max(1, Number(resolvedParams.page) || 1)
  const { data: articles, pagination } = await fetchArticles(currentPage, 12)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="section-header mb-0">
          <span>📝 Blog</span>
        </div>
        <div className="bg-white border border-t-0 border-[#E0E0E0] p-5">
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">
            Market Insights &amp; Analysis
          </h1>
          <p className="text-sm text-[#666]">
            Expert perspectives on Indian stock markets, investment strategies, and financial trends.
          </p>
        </div>
      </div>

      {/* Articles Grid or Empty State */}
      {articles.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {articles.map((article) => (
              <Link
                key={article.id || article.slug}
                href={`/blog/${article.slug}`}
                className="blog-card group"
                id={`blog-card-${article.slug}`}
              >
                {/* Card Image */}
                <div className="blog-card-image">
                  {article.featuredImageUrl ? (
                    <img
                      src={article.featuredImageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1565C0] to-[#0D1B2A] flex items-center justify-center">
                      <span className="text-white/40 text-5xl">📊</span>
                    </div>
                  )}
                  <div className="blog-card-image-overlay" />
                </div>

                {/* Card Content */}
                <div className="p-5">
                  {/* Tags */}
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {article.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="blog-tag">{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* Title */}
                  <h2 className="text-base font-bold text-[#1A1A1A] mb-2 line-clamp-2 group-hover:text-[#1565C0] transition-colors">
                    {article.title}
                  </h2>

                  {/* Excerpt */}
                  {article.excerpt && (
                    <p className="text-sm text-[#666] line-clamp-2 mb-4 leading-relaxed">
                      {article.excerpt}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-[#999] mt-auto">
                    {article.author && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {article.author}
                      </span>
                    )}
                    {article.publishedAt && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(article.publishedAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <nav className="blog-pagination" aria-label="Blog pagination">
              {currentPage > 1 ? (
                <Link
                  href={`/blog?page=${currentPage - 1}`}
                  className="blog-pagination-btn"
                >
                  ← Previous
                </Link>
              ) : (
                <span className="blog-pagination-btn blog-pagination-disabled">
                  ← Previous
                </span>
              )}

              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    // Show first, last, and pages near current
                    if (p === 1 || p === pagination.totalPages) return true
                    if (Math.abs(p - currentPage) <= 2) return true
                    return false
                  })
                  .reduce<(number | 'dots')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('dots')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((item, idx) =>
                    item === 'dots' ? (
                      <span key={`dots-${idx}`} className="px-2 text-[#999]">…</span>
                    ) : (
                      <Link
                        key={item}
                        href={`/blog?page=${item}`}
                        className={`blog-pagination-num ${item === currentPage ? 'blog-pagination-active' : ''}`}
                      >
                        {item}
                      </Link>
                    )
                  )}
              </div>

              {currentPage < pagination.totalPages ? (
                <Link
                  href={`/blog?page=${currentPage + 1}`}
                  className="blog-pagination-btn"
                >
                  Next →
                </Link>
              ) : (
                <span className="blog-pagination-btn blog-pagination-disabled">
                  Next →
                </span>
              )}
            </nav>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="blog-empty">
          <div className="blog-empty-icon">📝</div>
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">
            Coming Soon
          </h2>
          <p className="text-sm text-[#666] max-w-md mx-auto mb-6">
            We&apos;re working on insightful articles about Indian stock markets,
            investment strategies, and financial analysis. Check back soon!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#1565C0] text-white px-5 py-2.5 rounded text-sm font-semibold hover:bg-[#0D47A1] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      )}
    </div>
  )
}
