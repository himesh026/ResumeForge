'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'email' | 'code'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (r.ok) router.replace('/dashboard')
    })
  }, [router])

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  async function sendCode(emailToSend: string) {
    const res = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailToSend }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to send code')
    return data
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    try {
      await sendCode(email)
      setStep('code')
      setCountdown(60) // 60 second cooldown before resend
      setMessage('Check your email for a 6-digit code. It expires in 10 minutes.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setError('')
    try {
      await sendCode(email)
      setCountdown(60)
      setCode('')
      setMessage('New code sent! Check your email.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend')
    } finally {
      setResending(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return  // prevent double submit
    setError('')
    if (!code || code.length !== 6) {
      setError('Enter the 6-digit code from your email.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verification failed')
      // Hard redirect prevents Next.js from re-rendering and re-submitting
      window.location.href = '/dashboard'
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)  // only re-enable on error
    }
    // do NOT setLoading(false) on success — keep button disabled during redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        opacity: 0.4,
      }} />

      <div className="relative w-full max-w-md animate-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h8M2 12h10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-display text-lg" style={{ color: 'var(--text-primary)' }}>
              ResumeForge
            </span>
          </div>
          <h1 className="font-display text-3xl mb-2" style={{ color: 'var(--text-primary)' }}>
            {step === 'email' ? 'Welcome back.' : 'Check your email.'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {step === 'email'
              ? 'Sign in to tailor your resume with AI.'
              : message}
          </p>
        </div>

        {/* Card */}
        <div className="card p-8" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-strong)' }}>
          {step === 'email' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-base px-4 py-2.5"
                  autoFocus
                  required
                />
              </div>
              {error && (
                <p className="text-sm px-3 py-2 rounded-md" style={{ background: 'var(--danger-dim)', color: 'var(--danger)' }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: loading ? 'var(--accent-dim)' : 'var(--accent)',
                  color: loading ? 'var(--accent-bright)' : 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  border: 'none',
                }}
              >
                {loading ? 'Sending...' : 'Continue with Email →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Verification code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="input-base px-4 py-2.5 text-center font-mono text-xl tracking-widest"
                  autoFocus
                  maxLength={6}
                  inputMode="numeric"
                />
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                  Sent to {email} · Expires in 10 minutes
                </p>
              </div>

              {error && (
                <p className="text-sm px-3 py-2 rounded-md" style={{ background: 'var(--danger-dim)', color: 'var(--danger)' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: (loading || code.length !== 6) ? 'var(--accent-dim)' : 'var(--accent)',
                  color: (loading || code.length !== 6) ? 'var(--accent-bright)' : 'white',
                  cursor: (loading || code.length !== 6) ? 'not-allowed' : 'pointer',
                  border: 'none',
                }}
              >
                {loading ? 'Verifying...' : 'Sign in →'}
              </button>

              {/* Resend code button */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setCode(''); setError('') }}
                  className="text-sm"
                  style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ← Different email
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || countdown > 0}
                  className="text-sm font-medium transition-all"
                  style={{
                    color: (resending || countdown > 0) ? 'var(--text-muted)' : 'var(--accent-bright)',
                    background: 'none',
                    border: 'none',
                    cursor: (resending || countdown > 0) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {resending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: 'var(--text-muted)' }}>
          No password needed. We'll send a code each time.
        </p>
      </div>
    </div>
  )
}
