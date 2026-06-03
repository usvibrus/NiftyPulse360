export default function ArticleLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Breadcrumb skeleton */}
      <div className="blog-skeleton h-4 w-32 rounded mb-6" />

      {/* Hero image skeleton */}
      <div className="blog-skeleton h-64 md:h-80 w-full rounded-lg mb-6" />

      {/* Title skeleton */}
      <div className="blog-skeleton h-8 w-full rounded mb-2" />
      <div className="blog-skeleton h-8 w-3/4 rounded mb-6" />

      {/* Meta skeleton */}
      <div className="flex items-center gap-4 mb-8">
        <div className="blog-skeleton h-4 w-28 rounded" />
        <div className="blog-skeleton h-4 w-36 rounded" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="blog-skeleton h-4 rounded" style={{ width: `${85 + Math.random() * 15}%` }} />
        ))}
        <div className="blog-skeleton h-4 w-1/2 rounded" />
        <div className="my-6" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="blog-skeleton h-4 rounded" style={{ width: `${80 + Math.random() * 20}%` }} />
        ))}
      </div>
    </div>
  )
}
