import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import ResultView from '@/components/ResultView'

export default async function ResultPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const application = await prisma.application.findFirst({
    where: { id: params.id, userId: session.userId },
  })

  if (!application) notFound()
  if (!application.latexContent) redirect('/dashboard')

  const atsComparison =
    application.atsScoreBefore != null && application.atsScoreAfter != null
      ? {
          before: { score: application.atsScoreBefore, matchedKeywords: [], missingKeywords: [], suggestions: [], verdict: '' },
          after:  { score: application.atsScoreAfter,  matchedKeywords: [], missingKeywords: [], suggestions: [], verdict: '' },
          improvement: application.atsScoreAfter - application.atsScoreBefore,
        }
      : null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar userEmail={session.email} />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Link
            href="/dashboard"
            className="no-underline transition-colors hover:text-white"
            style={{ color: 'var(--text-muted)' }}
          >
            Dashboard
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--text-secondary)' }}>
            {application.companyName} — {application.jobRole}
          </span>
        </div>
        <ResultView
          applicationId={application.id}
          companyName={application.companyName}
          jobRole={application.jobRole}
          latexContent={application.latexContent}
          hasPdf={!!application.generatedPdfPath}
          atsComparison={atsComparison}
        />
      </main>
    </div>
  )
}
