import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import ApplicationTable from '@/components/ApplicationTable'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const applications = await prisma.application.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      companyName: true,
      jobRole: true,
      jobDescription: true,
      generatedPdfPath: true,
      generatedLatexPath: true,
      latexContent: true,
      atsScoreBefore: true,
      atsScoreAfter: true,
      createdAt: true,
    },
  })

  const totalCount = applications.length
  const now = new Date()
  const thisMonthCount = applications.filter(a => {
    const d = new Date(a.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const generatedCount = applications.filter(a => a.latexContent).length

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar userEmail={session.email} />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-in">
          <div>
            <h1 className="font-display text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>
              Dashboard
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Track your job applications and tailored resumes
            </p>
          </div>
          <Link
            href="/new-application"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium no-underline transition-all"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            <span className="text-lg leading-none">+</span>
            New Application
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 stagger-children">
          <StatCard label="Total Applications" value={totalCount} icon="📋" />
          <StatCard label="This Month" value={thisMonthCount} icon="📅" />
          <StatCard label="Resumes Generated" value={generatedCount} icon="✨" />
        </div>

        {/* Roast banner */}
        <div
          className="flex items-center justify-between p-5 rounded-xl mb-8 animate-in"
          style={{
            background: 'linear-gradient(135deg, rgba(220,38,38,0.08), rgba(234,88,12,0.08))',
            border: '1px solid rgba(220,38,38,0.2)',
            animationDelay: '0.15s',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Roast My Resume
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Get a brutally honest critique of how well your resume matches a job description
              </p>
            </div>
          </div>
          <Link
            href="/roast"
            className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium no-underline transition-all"
            style={{
              background: 'linear-gradient(135deg, #dc2626, #ea580c)',
              color: 'white',
            }}
          >
            Roast It →
          </Link>
        </div>

        {/* Table */}
        <div className="animate-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Recent Applications
            </h2>
          </div>
          <ApplicationTable applications={applications} />
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
          {label}
        </span>
        <span className="text-base">{icon}</span>
      </div>
      <div className="font-display text-4xl" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  )
}
