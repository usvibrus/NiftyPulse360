// Loading skeleton optimized
export default function BlogLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="blog-skeleton h-8 w-64 rounded mb-3" />
        <div className="blog-skeleton h-4 w-96 rounded" />
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden">
            <div className="blog-skeleton h-48 w-full" />
            <div className="p-5">
              <div className="blog-skeleton h-3 w-20 rounded mb-3" />
              <div className="blog-skeleton h-5 w-full rounded mb-2" />
              <div className="blog-skeleton h-5 w-3/4 rounded mb-4" />
              <div className="blog-skeleton h-3 w-full rounded mb-2" />
              <div className="blog-skeleton h-3 w-5/6 rounded mb-4" />
              <div className="flex items-center gap-2">
                <div className="blog-skeleton h-3 w-24 rounded" />
                <div className="blog-skeleton h-3 w-16 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
