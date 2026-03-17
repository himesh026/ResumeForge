import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateVerificationCode, sendVerificationEmail } from '@/lib/auth'
import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Rate limit by email to prevent abuse
    const rl = rateLimit(`auth:${normalizedEmail}`, RATE_LIMITS.auth)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait 15 minutes before trying again.' },
        { status: 429 }
      )
    }

    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {},
      create: { email: normalizedEmail },
    })

    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    const token = await prisma.authToken.create({
      data: { token: code, userId: user.id, expiresAt },
    })

    // Debug log to verify DB is persisting
    console.log(`[AUTH] Token created for ${normalizedEmail}, tokenId: ${token.id}, expires: ${expiresAt.toISOString()}, DB: ${process.env.DATABASE_URL}`)

    await sendVerificationEmail(normalizedEmail, code)

    return NextResponse.json({ success: true, message: 'Verification code sent' })
  } catch (err) {
    console.error('Send code error:', err)
    return NextResponse.json({ error: 'Failed to send code' }, { status: 500 })
  }
}
