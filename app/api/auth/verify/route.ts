import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Upsert user — handles DB reset while cookie is still alive
    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {},
      create: { email: normalizedEmail },
    })

    const authToken = await prisma.authToken.findFirst({
      where: {
        userId: user.id,
        token: code,
        used: false,
        expiresAt: { gt: new Date() },
      },
    })

    if (!authToken) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 })
    }

    // Mark token as used
    await prisma.authToken.update({ where: { id: authToken.id }, data: { used: true } })

    // Create session JWT
    const sessionToken = await createSession(user.id, user.email)

    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email } })
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Verify error:', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
