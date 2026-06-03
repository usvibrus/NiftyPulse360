import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchArticleBySlug } from '@/lib/services/blog-api'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await fetchArticleBySlug(slug)

  if (!article) {
    return { title: 'Article Not Found' }
  }

  const title = article.metaTitle || article.title
  const description =
    article.metaDescription ||
    article.excerpt ||
    `Read "${article.title}" on NiftyPulse360 Blog.`

  return {
    title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE}/blog/${slug}`,
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      ...(article.featuredImageUrl && {
        images: [{ url: article.featuredImageUrl, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(article.featuredImageUrl && { images: [article.featuredImageUrl] }),
    },
  }
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = await fetchArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  const publishDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const updateDate = article.updatedAt
    ? new Date(article.updatedAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  // Article structured data
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt || article.metaDescription || '',
    url: `${SITE}/blog/${slug}`,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    publisher: {
      '@type': 'Organization',
      name: 'NiftyPulse360',
      url: SITE,
      logo: { '@type': 'ImageObject', url: `${SITE}/logo.svg` },
    },
    ...(article.author && {
      author: { '@type': 'Person', name: article.author },
    }),
    ...(article.featuredImageUrl && {
      image: {
        '@type': 'ImageObject',
        url: article.featuredImageUrl,
      },
    }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE}/blog/${slug}`,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <article className="max-w-4xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#666] mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#1565C0] transition-colors">Home</Link>
          <span className="text-[#ccc]">/</span>
          <Link href="/blog" className="hover:text-[#1565C0] transition-colors">Blog</Link>
          <span className="text-[#ccc]">/</span>
          <span className="text-[#1A1A1A] font-medium truncate max-w-[200px]">{article.title}</span>
        </nav>

        {/* Hero Image */}
        {article.featuredImageUrl && (
          <div className="blog-hero-image mb-6">
            <img
              src={article.featuredImageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Header */}
        <header className="mb-8">
          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags.map((tag) => (
                <span key={tag} className="blog-tag">{tag}</span>
              ))}
            </div>
          )}

          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] leading-tight mb-4">
            {article.title}
          </h1>

          {/* Meta bar */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#666] pb-6 border-b border-[#E0E0E0]">
            {article.author && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#1565C0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium text-[#1A1A1A]">{article.author}</span>
              </div>
            )}
            {publishDate && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#1565C0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Published {publishDate}</span>
              </div>
            )}
            {updateDate && updateDate !== publishDate && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#999]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Updated {updateDate}</span>
              </div>
            )}
          </div>
        </header>

        {/* Article Content */}
        <div
          className="prose blog-content"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Back to blog */}
        <div className="mt-12 pt-8 border-t border-[#E0E0E0]">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1565C0] hover:text-[#0D47A1] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Blog
          </Link>
        </div>
      </article>
    </>
  )
}
