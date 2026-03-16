import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const applications = await prisma.application.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        companyName: true,
        jobRole: true,
        jobDescription: true,
        generatedPdfPath: true,
        generatedLatexPath: true,
        latexContent: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ applications })
  } catch (err) {
    console.error('Get applications error:', err)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { companyName, jobRole, jobDescription } = body

    if (!companyName || !jobRole || !jobDescription) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const application = await prisma.application.create({
      data: {
        userId: session.userId,
        companyName,
        jobRole,
        jobDescription,
      },
    })

    return NextResponse.json({ application })
  } catch (err) {
    console.error('Create application error:', err)
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 })
  }
}
