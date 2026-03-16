'use client'

import { useState } from 'react'
import Link from 'next/link'
import FileUpload from '@/components/FileUpload'

type RoastState = 'idle' | 'roasting' | 'done' | 'error'

const roastingMessages = [
  'Reading your resume... oh no.',
  'Comparing to job description... this is bad.',
  'Counting the red flags...',
  'Preparing the fire extinguisher...',
  'Almost done roasting... well done (literally).',
]

export default function RoastPage() {
  const [jobRole, setJobRole] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [state, setState] = useState<RoastState>('idle')
  const [roast, setRoast] = useState('')
  const [model, setModel] = useState('')
  const [error, setError] = useState('')
  const [msgIndex, setMsgIndex] = useState(0)

  async function handleRoast(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setRoast('')
    setState('roasting')
    setMsgIndex(0)

    // Cycle through roasting messages
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % roastingMessages.length)
    }, 1800)

    try {
      const formData = new FormData()
      formData.append('jobRole', jobRole)
      formData.append('jobDescription', jobDescription)
      if (resumeFile) formData.append('resume', resumeFile)

      const res = await fetch('/api/roast-resume', {
        method: 'POST',
        body: formData,
      })

      clearInterval(interval)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Roast failed')

      setRoast(data.roast)
      setModel(data.model)
      setState('done')
    } catch (err: unknown) {
      clearInterval(interval)
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }

  function reset() {
    setState('idle')
    setRoast('')
    setError('')
    setMsgIndex(0)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-50 flex items-center justify-between px-6 h-14"
        style={{
          background: 'rgba(12,12,15,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="no-underline flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 3h12M1 7h7M1 11h9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </Link>
          <span style={{ color: 'var(--border-strong)' }}>/</span>
          <span className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span>🔥</span> Roast My Resume
          </span>
        </div>
        <Link
          href="/new-application"
          className="text-xs px-3 py-1.5 rounded-md no-underline transition-all"
          style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', background: 'transparent' }}
        >
          ✨ Generate Resume Instead
        </Link>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-8">

        {/* Hero */}
        <div className="text-center mb-10 animate-in">
          <div className="text-5xl mb-4">🔥</div>
          <h1 className="font-display text-4xl mb-3" style={{ color: 'var(--text-primary)' }}>
            Roast My Resume
          </h1>
          <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Paste a job description, upload your resume, and get a brutally honest, no-mercy critique of how badly you match the role.
          </p>
          <div
            className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-xs"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
          >
            ⚠️ Warning: This will hurt. But it will help.
          </div>
        </div>

        {state === 'idle' || state === 'error' ? (
          <form onSubmit={handleRoast} className="space-y-5 animate-in">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Job role <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={jobRole}
                  onChange={e => setJobRole(e.target.value)}
                  placeholder="e.g. Senior Engineer"
                  className="input-base px-4 py-2.5"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <div
                  className="w-full px-3 py-2.5 rounded-lg text-xs"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
                >
                  🎯 More detail = more brutal roast
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Job description <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                className="input-base px-4 py-3"
                rows={7}
                required
                style={{ resize: 'vertical', minHeight: '140px' }}
              />
            </div>

            <FileUpload onFileSelect={setResumeFile} label="Upload your resume to roast" />

            {state === 'error' && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{ background: 'var(--danger-dim)', border: '1px solid var(--danger)', color: 'var(--danger)' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!jobDescription.trim()}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
              style={{
                background: !jobDescription.trim() ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #dc2626, #ea580c)',
                color: !jobDescription.trim() ? 'var(--text-muted)' : 'white',
                border: 'none',
                cursor: !jobDescription.trim() ? 'not-allowed' : 'pointer',
                fontSize: '15px',
              }}
            >
              🔥 Roast My Resume
            </button>
          </form>

        ) : state === 'roasting' ? (
          <div className="flex flex-col items-center justify-center py-20 animate-in-fast">
            {/* Fire animation */}
            <div className="text-6xl mb-6" style={{ animation: 'pulse-dot 0.8s ease infinite' }}>
              🔥
            </div>
            <h2 className="font-display text-2xl mb-3" style={{ color: 'var(--text-primary)' }}>
              Preparing the roast...
            </h2>
            <p
              className="text-sm transition-all"
              style={{ color: 'var(--text-secondary)', minHeight: '24px' }}
            >
              {roastingMessages[msgIndex]}
            </p>
            <div className="mt-8 flex gap-1.5">
              {[0, 1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: '#dc2626',
                    animation: `pulse-dot 1s ease ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>

        ) : (
          <div className="animate-in">
            {/* Result header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🔥</span>
                <div>
                  <h2 className="font-display text-xl" style={{ color: 'var(--text-primary)' }}>
                    Your Resume Has Been Roasted
                  </h2>
                  <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    via {model}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={reset}
                  className="text-sm px-4 py-2 rounded-lg transition-all"
                  style={{
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-strong)',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  Roast Again
                </button>
                <Link
                  href="/new-application"
                  className="text-sm px-4 py-2 rounded-lg no-underline transition-all"
                  style={{ background: 'var(--accent)', color: 'white' }}
                >
                  ✨ Fix It Now
                </Link>
              </div>
            </div>

            {/* Roast content */}
            <div
              className="rounded-xl p-6"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <RoastContent content={roast} />
            </div>

            {/* CTA */}
            <div
              className="mt-6 p-5 rounded-xl flex items-center justify-between gap-4"
              style={{ background: 'var(--accent-muted)', border: '1px solid var(--border-accent)' }}
            >
              <div>
                <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--accent-bright)' }}>
                  Ready to actually fix it?
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Let the AI tailor your resume to this exact job description.
                </p>
              </div>
              <Link
                href="/new-application"
                className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium no-underline"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                Generate Optimized Resume →
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// Renders markdown-like roast content with styled sections
function RoastContent({ content }: { content: string }) {
  const lines = content.split('\n')

  return (
    <div className="space-y-1" style={{ fontSize: '14px', lineHeight: '1.8' }}>
      {lines.map((line, i) => {
        // Section headers ## 🔥 Title
        if (line.startsWith('## ')) {
          return (
            <div key={i} className="mt-6 mb-2 first:mt-0">
              <h3
                className="text-base font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                {line.replace('## ', '')}
              </h3>
              <div style={{ height: '1px', background: 'var(--border)', marginTop: '6px' }} />
            </div>
          )
        }

        // Bullet points
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 pl-2">
              <span style={{ color: '#dc2626', flexShrink: 0 }}>•</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {renderInline(line.replace(/^[-*] /, ''))}
              </span>
            </div>
          )
        }

        // Numbered points
        if (/^\d+\. /.test(line)) {
          return (
            <div key={i} className="flex gap-2 pl-2">
              <span style={{ color: 'var(--accent-bright)', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                {line.match(/^\d+/)?.[0]}.
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {renderInline(line.replace(/^\d+\. /, ''))}
              </span>
            </div>
          )
        }

        // Empty line
        if (line.trim() === '') {
          return <div key={i} style={{ height: '4px' }} />
        }

        // Regular paragraph
        return (
          <p key={i} style={{ color: 'var(--text-secondary)' }}>
            {renderInline(line)}
          </p>
        )
      })}
    </div>
  )
}

// Renders **bold** and `code` inline
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: '#f87171' }}>
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}
