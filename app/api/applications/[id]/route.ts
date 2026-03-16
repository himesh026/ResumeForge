import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const application = await prisma.application.findFirst({
      where: { id: params.id, userId: session.userId },
    })

    if (!application) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ application })
  } catch (err) {
    console.error('Get application error:', err)
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const application = await prisma.application.findFirst({
      where: { id: params.id, userId: session.userId },
    })

    if (!application) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.application.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete application error:', err)
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 })
  }
}
