'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import FileUpload from './FileUpload'

export default function ResumeForm() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [jobRole, setJobRole] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'generating'>('form')
  const [genStep, setGenStep] = useState(0)

  const genSteps = [
    { label: 'Parsing resume content', icon: '📄' },
    { label: 'Analyzing job requirements', icon: '🔍' },
    { label: 'Generating optimized resume', icon: '✨' },
    { label: 'Compiling to PDF', icon: '⚙️' },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!companyName.trim() || !jobRole.trim() || !jobDescription.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    setStep('generating')

    // Animate steps
    const stepTimer = setInterval(() => {
      setGenStep(prev => {
        if (prev >= genSteps.length - 1) {
          clearInterval(stepTimer)
          return prev
        }
        return prev + 1
      })
    }, 2500)

    try {
      const formData = new FormData()
      formData.append('companyName', companyName)
      formData.append('jobRole', jobRole)
      formData.append('jobDescription', jobDescription)
      if (resumeFile) formData.append('resume', resumeFile)

      const res = await fetch('/api/generate-resume', {
        method: 'POST',
        body: formData,
      })

      clearInterval(stepTimer)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Generation failed')

      router.push(`/result/${data.application.id}`)
    } catch (err: unknown) {
      clearInterval(stepTimer)
      setStep('form')
      setGenStep(0)
      setLoading(false)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (step === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in-fast">
        {/* Spinner */}
        <div className="relative w-16 h-16 mb-8">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: '2px solid var(--border)',
              borderTopColor: 'var(--accent)',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <div
            className="absolute inset-2 rounded-full flex items-center justify-center"
            style={{ background: 'var(--bg-card)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 3h12M1 7h7M1 11h9" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <h2 className="font-display text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>
          Tailoring your resume
        </h2>
        <p className="text-sm mb-10" style={{ color: 'var(--text-secondary)' }}>
          for {jobRole} at {companyName}
        </p>

        {/* Steps */}
        <div className="w-full max-w-xs space-y-3">
          {genSteps.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-3 transition-all"
              style={{
                opacity: i <= genStep ? 1 : 0.3,
                transform: i <= genStep ? 'none' : 'translateX(-8px)',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                style={{
                  background: i < genStep ? 'var(--success-dim)' : i === genStep ? 'var(--accent-dim)' : 'var(--bg-tertiary)',
                  border: `1px solid ${i < genStep ? 'var(--success)' : i === genStep ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                {i < genStep ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : i === genStep ? (
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--accent)', animation: 'pulse-dot 1s ease infinite' }}
                  />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--text-muted)' }} />
                )}
              </div>
              <span
                className="text-sm"
                style={{ color: i <= genStep ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* Company + Role */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Company name <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            type="text"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="e.g. Google"
            className="input-base px-4 py-2.5"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Job role <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            type="text"
            value={jobRole}
            onChange={e => setJobRole(e.target.value)}
            placeholder="e.g. Backend Engineer"
            className="input-base px-4 py-2.5"
            required
          />
        </div>
      </div>

      {/* Job description */}
      <div>
        <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Job description <span style={{ color: 'var(--danger)' }}>*</span>
        </label>
        <textarea
          value={jobDescription}
          onChange={e => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here. The more detail you include, the better the AI can tailor your resume..."
          className="input-base px-4 py-3"
          rows={8}
          required
          style={{ resize: 'vertical', minHeight: '160px' }}
        />
      </div>

      {/* File upload */}
      <FileUpload onFileSelect={setResumeFile} />

      {/* Error */}
      {error && (
        <div
          className="flex items-start gap-2.5 p-3 rounded-lg text-sm"
          style={{ background: 'var(--danger-dim)', border: '1px solid var(--danger)', color: 'var(--danger)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={loading || !companyName || !jobRole || !jobDescription}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{
            background: loading || !companyName || !jobRole || !jobDescription
              ? 'var(--accent-dim)'
              : 'var(--accent)',
            color: loading || !companyName || !jobRole || !jobDescription
              ? 'var(--accent-bright)'
              : 'white',
            border: 'none',
            cursor: loading || !companyName || !jobRole || !jobDescription ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? (
            <>
              <div style={{ width: 14, height: 14, border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Generating...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1l1.5 4.5H13l-3.7 2.7 1.4 4.3L7 10l-3.7 2.5L4.7 8.2 1 5.5h4.5z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
              Generate Optimized Resume
            </>
          )}
        </button>

        {!resumeFile && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            No resume? We'll generate a template.
          </p>
        )}
      </div>
    </form>
  )
}
