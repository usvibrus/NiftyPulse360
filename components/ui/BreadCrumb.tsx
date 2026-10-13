import Link from 'next/link'

interface BreadCrumbProps {
  items: { label: string; href?: string }[]
}

export default function BreadCrumb({ items }: BreadCrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-4">
      <ol className="flex flex-wrap gap-1">
        <li><Link href="/" className="hover:text-blue-600">Home</Link></li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            <span>/</span>
            {item.href ? (
              <Link href={item.href} className="hover:text-blue-600">{item.label}</Link>
            ) : (
              <span className="text-gray-700">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
