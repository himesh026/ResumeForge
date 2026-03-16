import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const applicationId = params.path[0]
    const fileType = params.path[1] // 'pdf' or 'latex'

    if (!applicationId || !fileType) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId: session.userId },
    })

    if (!application) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (fileType === 'pdf') {
      if (!application.generatedPdfPath) {
        return NextResponse.json({ error: 'PDF not available' }, { status: 404 })
      }
      const filePath = application.generatedPdfPath
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'PDF file not found on disk' }, { status: 404 })
      }
      const fileBuffer = fs.readFileSync(filePath)
      const fileName = `${application.companyName}-${application.jobRole}-resume.pdf`
        .replace(/[^a-z0-9\-_.]/gi, '-')
        .toLowerCase()
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      })
    }

    if (fileType === 'latex') {
      const content = application.latexContent || ''
      const fileName = `${application.companyName}-${application.jobRole}-resume.tex`
        .replace(/[^a-z0-9\-_.]/gi, '-')
        .toLowerCase()
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  } catch (err) {
    console.error('File serve error:', err)
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 })
  }
}
