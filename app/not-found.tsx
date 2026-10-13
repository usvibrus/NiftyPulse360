import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold mb-4">404 — Page Not Found</h1>
      <p className="text-gray-600 mb-6">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link href="/" className="text-blue-600 hover:underline font-medium">← Back to Home</Link>
    </div>
  )
}
