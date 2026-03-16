'use client'

import { useState } from 'react'

interface ATSScore {
  score: number
  matchedKeywords: string[]
  missingKeywords: string[]
  suggestions: string[]
  verdict: string
}

interface ATSComparison {
  before: ATSScore
  after: ATSScore
  improvement: number
}

interface ResultViewProps {
  applicationId: string
  companyName: string
  jobRole: string
  latexContent: string
  hasPdf: boolean
  model?: string
  atsComparison?: ATSComparison | null
}

export default function ResultView({
  applicationId,
  companyName,
  jobRole,
  latexContent,
  hasPdf,
  model,
  atsComparison,
}: ResultViewProps) {
  const [latex, setLatex] = useState(latexContent)
  const [copied, setCopied] = useState(false)

  function downloadLatex() {
    const blob = new Blob([latex], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${companyName}-${jobRole}-resume.tex`.replace(/[^a-z0-9\-_.]/gi, '-').toLowerCase()
    a.click()
    URL.revokeObjectURL(url)
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(latex)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function scoreColor(score: number) {
    if (score >= 75) return 'var(--success)'
    if (score >= 50) return 'var(--warning)'
    return 'var(--danger)'
  }

  return (
    <div className="animate-in">
      {/* Result header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--success-dim)' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 9l4.5 4.5L15 4.5" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h2 className="font-display text-xl" style={{ color: 'var(--text-primary)' }}>
              Optimized Resume Ready
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {jobRole} at {companyName}
              {model && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                  {model}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Download actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {hasPdf && (
            <a
              href={`/api/files/${applicationId}/pdf`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium no-underline transition-all"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v8M4 6l3 3 3-3M1 11v1a1 1 0 001 1h10a1 1 0 001-1v-1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Download PDF
            </a>
          )}
          <button
            onClick={downloadLatex}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-strong)', background: 'transparent', cursor: 'pointer' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v8M4 6l3 3 3-3M1 11v1a1 1 0 001 1h10a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Download LaTeX
          </button>
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
            style={{
              color: copied ? 'var(--success)' : 'var(--text-secondary)',
              border: `1px solid ${copied ? 'var(--success)' : 'var(--border-strong)'}`,
              background: copied ? 'var(--success-dim)' : 'transparent',
              cursor: 'pointer',
            }}
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
                  <path d="M2 9V3a1 1 0 011-1h6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                </svg>
                Copy LaTeX
              </>
            )}
          </button>
        </div>
      </div>

      {/* ATS Score Comparison */}
      {atsComparison && (
        <div className="mb-6 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="px-5 py-3 flex items-center justify-between" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>ATS Match Score</span>
            {atsComparison.improvement > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--success-dim)', color: 'var(--success)' }}>
                +{atsComparison.improvement} points improvement
              </span>
            )}
          </div>
          <div className="p-5" style={{ background: 'var(--bg-card)' }}>
            {/* Score bars */}
            <div className="grid grid-cols-2 gap-6 mb-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Before optimization</span>
                  <span className="text-lg font-display" style={{ color: scoreColor(atsComparison.before.score) }}>
                    {atsComparison.before.score}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${atsComparison.before.score}%`, background: scoreColor(atsComparison.before.score) }} />
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{atsComparison.before.verdict}</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>After optimization</span>
                  <span className="text-lg font-display" style={{ color: scoreColor(atsComparison.after.score) }}>
                    {atsComparison.after.score}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${atsComparison.after.score}%`, background: scoreColor(atsComparison.after.score) }} />
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{atsComparison.after.verdict}</p>
              </div>
            </div>
            {/* Keywords */}
            <div className="grid grid-cols-2 gap-4">
              {atsComparison.after.matchedKeywords.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>✓ Matched keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {atsComparison.after.matchedKeywords.slice(0, 10).map((kw, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--success-dim)', color: 'var(--success)' }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {atsComparison.after.missingKeywords.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>✗ Still missing</p>
                  <div className="flex flex-wrap gap-1.5">
                    {atsComparison.after.missingKeywords.slice(0, 10).map((kw, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--danger-dim)', color: 'var(--danger)' }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!hasPdf && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg text-sm mb-5" style={{ background: 'var(--warning-dim)', border: '1px solid rgba(251,191,36,0.3)', color: 'var(--warning)' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 12H1L7 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M7 5.5v3M7 10v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          PDF compilation unavailable. Paste the LaTeX into{' '}
          <a href="https://overleaf.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--warning)' }}>overleaf.com</a>{' '}
          to get a PDF.
        </div>
      )}

      {/* LaTeX editor */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-4 py-2.5" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--border-strong)' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--border-strong)' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--border-strong)' }} />
            </div>
            <span className="text-xs font-mono ml-1" style={{ color: 'var(--text-muted)' }}>resume.tex</span>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Editable · {latex.split('\n').length} lines
          </span>
        </div>
        <textarea
          value={latex}
          onChange={e => setLatex(e.target.value)}
          className="w-full font-mono text-xs"
          spellCheck={false}
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            border: 'none',
            outline: 'none',
            padding: '16px',
            resize: 'vertical',
            minHeight: '480px',
            lineHeight: '1.7',
            fontSize: '12px',
          }}
        />
      </div>
    </div>
  )
}
