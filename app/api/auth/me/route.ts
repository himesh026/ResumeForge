import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    // Upsert — re-creates user row if DB was wiped but cookie is still valid
    const user = await prisma.user.upsert({
      where: { email: session.email },
      update: {},
      create: { id: session.userId, email: session.email },
      select: { id: true, email: true, createdAt: true },
    })

    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
