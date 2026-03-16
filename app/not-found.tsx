import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="text-center">
        <div
          className="font-display text-8xl mb-4"
          style={{ color: 'var(--border-strong)' }}
        >
          404
        </div>
        <h1 className="font-display text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>
          Page not found
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          The page you're looking for doesn't exist.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm no-underline"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
