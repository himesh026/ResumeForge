import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import ResumeForm from '@/components/ResumeForm'

export default async function NewApplicationPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar userEmail={session.email} />

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm animate-in" style={{ color: 'var(--text-muted)' }}>
          <Link href="/dashboard" className="no-underline transition-colors hover:text-white" style={{ color: 'var(--text-muted)' }}>
            Dashboard
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--text-secondary)' }}>New Application</span>
        </div>

        {/* Header */}
        <div className="mb-8 animate-in" style={{ animationDelay: '0.05s' }}>
          <h1 className="font-display text-3xl mb-2" style={{ color: 'var(--text-primary)' }}>
            New Application
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Paste the job details below. Our AI will tailor your resume to match the role.
          </p>
        </div>

        {/* AI info banner */}
        <div
          className="flex items-start gap-3 p-4 rounded-xl mb-7 animate-in"
          style={{
            background: 'var(--accent-muted)',
            border: '1px solid var(--border-accent)',
            animationDelay: '0.1s',
          }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: 'var(--accent-dim)' }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1l1.2 3.6H11l-2.9 2.1 1.1 3.4L6.5 8.2 3.8 10.1l1.1-3.4L2 4.6h3.3z" stroke="var(--accent-bright)" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--accent-bright)' }}>
              AI-Powered Optimization
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              The AI analyzes the job description, extracts key skills and keywords, then rewrites your resume to maximize ATS matching — without inventing any experience.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="animate-in" style={{ animationDelay: '0.15s' }}>
          <ResumeForm />
        </div>
      </main>
    </div>
  )
}
