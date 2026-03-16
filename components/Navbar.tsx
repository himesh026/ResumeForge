'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

interface NavbarProps {
  userEmail?: string
}

export default function Navbar({ userEmail }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-6 h-14"
      style={{
        background: 'rgba(12, 12, 15, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 no-underline">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--accent)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 3h12M1 7h7M1 11h9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <span className="font-display text-sm" style={{ color: 'var(--text-primary)' }}>
          ATS Resume Tailor
        </span>
      </Link>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-1">
        <NavLink href="/dashboard" active={pathname === '/dashboard'}>Dashboard</NavLink>
        <NavLink href="/new-application" active={pathname === '/new-application'}>New Application</NavLink>
        <NavLink href="/roast" active={pathname === '/roast'}>🔥 Roast My Resume</NavLink>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {userEmail && (
          <span
            className="hidden md:block text-xs px-2.5 py-1 rounded-full"
            style={{
              color: 'var(--text-muted)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
            }}
          >
            {userEmail}
          </span>
        )}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-xs px-3 py-1.5 rounded-md transition-all"
          style={{
            color: 'var(--text-secondary)',
            background: 'none',
            border: '1px solid var(--border)',
            cursor: loggingOut ? 'not-allowed' : 'pointer',
          }}
        >
          {loggingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </nav>
  )
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-md text-sm transition-all no-underline"
      style={{
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        background: active ? 'var(--bg-tertiary)' : 'transparent',
      }}
    >
      {children}
    </Link>
  )
}
