'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Application {
  id: string
  companyName: string
  jobRole: string
  createdAt: Date | string
  generatedPdfPath: string | null
  latexContent: string | null
  atsScoreBefore: number | null
  atsScoreAfter: number | null
}

interface ApplicationTableProps {
  applications: Application[]
}

export default function ApplicationTable({ applications }: ApplicationTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    setConfirmId(null)
    try {
      await fetch(`/api/applications/${id}`, { method: 'DELETE' })
      router.refresh() // re-fetch server component data
    } catch {
      setDeletingId(null)
    }
  }

  if (applications.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 rounded-xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--bg-tertiary)' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 6h12M4 10h8M4 14h10" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>No applications yet</p>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Create your first tailored resume</p>
        <Link
          href="/new-application"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm no-underline"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          <span>+</span> New Application
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {/* Header */}
      <div
        className="grid text-xs uppercase tracking-wider px-5 py-3"
        style={{
          gridTemplateColumns: '2fr 2fr 1.2fr 1fr 1.2fr 1fr',
          color: 'var(--text-muted)',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          letterSpacing: '0.06em',
        }}
      >
        <span>Company</span>
        <span>Role</span>
        <span>Date</span>
        <span>ATS Score</span>
        <span>Status</span>
        <span className="text-right">Actions</span>
      </div>

      {/* Rows */}
      <div style={{ background: 'var(--bg-card)' }}>
        {applications.map((app, i) => (
          <div key={app.id}>
            <div
              className="grid items-center px-5 py-3.5 transition-colors"
              style={{
                gridTemplateColumns: '2fr 2fr 1.2fr 1fr 1.2fr 1fr',
                borderBottom: (i < applications.length - 1 && confirmId !== app.id) ? '1px solid var(--border)' : 'none',
                opacity: deletingId === app.id ? 0.4 : 1,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span className="font-medium text-sm truncate pr-4" style={{ color: 'var(--text-primary)' }}>{app.companyName}</span>
              <span className="text-sm truncate pr-4" style={{ color: 'var(--text-secondary)' }}>{app.jobRole}</span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span>
                {app.atsScoreAfter != null ? (
                  <span className="text-xs font-mono font-medium"
                    style={{ color: app.atsScoreAfter >= 75 ? 'var(--success)' : app.atsScoreAfter >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                    {app.atsScoreAfter}%
                    {app.atsScoreBefore != null && app.atsScoreAfter > app.atsScoreBefore && (
                      <span className="ml-1" style={{ color: 'var(--success)' }}>↑{app.atsScoreAfter - app.atsScoreBefore}</span>
                    )}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                )}
              </span>
              <span>
                {app.latexContent ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--success-dim)', color: 'var(--success)' }}>
                    <span className="w-1 h-1 rounded-full inline-block" style={{ background: 'var(--success)' }} />
                    Generated
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--warning-dim)', color: 'var(--warning)' }}>
                    <span className="w-1 h-1 rounded-full inline-block" style={{ background: 'var(--warning)' }} />
                    Pending
                  </span>
                )}
              </span>
              <div className="flex items-center justify-end gap-2">
                {app.latexContent && (
                  <Link
                    href={`/result/${app.id}`}
                    className="text-xs px-2.5 py-1 rounded-md no-underline"
                    style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', background: 'transparent' }}
                  >
                    View
                  </Link>
                )}
                {app.generatedPdfPath && (
                  <a
                    href={`/api/files/${app.id}/pdf`}
                    className="text-xs px-2.5 py-1 rounded-md no-underline"
                    style={{ color: 'var(--accent-bright)', border: '1px solid var(--border-accent)', background: 'var(--accent-dim)' }}
                  >
                    PDF ↓
                  </a>
                )}
                {deletingId === app.id ? (
                  <span className="text-xs px-2.5 py-1" style={{ color: 'var(--text-muted)' }}>Deleting...</span>
                ) : confirmId === app.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="text-xs px-2.5 py-1 rounded-md font-medium"
                      style={{ color: 'white', background: 'var(--danger)', border: 'none', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="text-xs px-2.5 py-1 rounded-md"
                      style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(app.id)}
                    className="text-xs px-2.5 py-1 rounded-md transition-all"
                    style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = 'var(--danger)'
                      e.currentTarget.style.borderColor = 'var(--danger)'
                      e.currentTarget.style.background = 'var(--danger-dim)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = 'var(--text-muted)'
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Inline confirm row */}
            {confirmId === app.id && (
              <div
                className="px-5 py-2.5 flex items-center justify-between"
                style={{
                  background: 'var(--danger-dim)',
                  borderBottom: i < applications.length - 1 ? '1px solid var(--border)' : 'none',
                  borderTop: '1px solid rgba(248,113,113,0.2)',
                }}
              >
                <span className="text-xs" style={{ color: 'var(--danger)' }}>
                  Delete <strong>{app.companyName} — {app.jobRole}</strong>? This cannot be undone.
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(app.id)}
                    className="text-xs px-3 py-1 rounded-md font-medium"
                    style={{ color: 'white', background: 'var(--danger)', border: 'none', cursor: 'pointer' }}
                  >
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="text-xs px-3 py-1 rounded-md"
                    style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
