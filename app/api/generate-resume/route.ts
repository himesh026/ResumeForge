import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parsePdfToText, saveUploadedFile } from '@/lib/pdfParser'
import { optimizeResume } from '@/lib/resumeOptimizer'
import { compileLatexToPdf, getOutputPaths } from '@/lib/latexCompiler'
import { compareATSScores } from '@/lib/atsScorer'
import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit: 10 generations per hour per user
    const rl = rateLimit(`gen:${session.userId}`, RATE_LIMITS.generation)
    if (!rl.success) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. You can generate ${RATE_LIMITS.generation.limit} resumes per hour. Resets in ${Math.ceil((rl.resetAt - Date.now()) / 60000)} minutes.`,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rl.limit),
            'X-RateLimit-Remaining': String(rl.remaining),
            'X-RateLimit-Reset': String(rl.resetAt),
          },
        }
      )
    }

    const formData = await req.formData()
    const companyName = formData.get('companyName') as string
    const jobRole = formData.get('jobRole') as string
    const jobDescription = formData.get('jobDescription') as string
    const resumeFile = formData.get('resume') as File | null

    if (!companyName || !jobRole || !jobDescription) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Ensure user exists — handles DB reset with stale cookie
    await prisma.user.upsert({
      where: { email: session.email },
      update: {},
      create: { id: session.userId, email: session.email },
    })

    // Step 1: Save and parse resume
    let resumeText = ''
    let resumePdfPath: string | undefined

    if (resumeFile && resumeFile.size > 0) {
      const buffer = Buffer.from(await resumeFile.arrayBuffer())
      resumePdfPath = await saveUploadedFile(buffer, resumeFile.name, session.userId)
      resumeText = await parsePdfToText(resumePdfPath)
    }

    // Step 2: Create DB record
    const application = await prisma.application.create({
      data: {
        userId: session.userId,
        companyName,
        jobRole,
        jobDescription,
        resumePdfPath,
      },
    })

    // Step 3: AI optimization
    const { latex, model } = await optimizeResume({
      companyName,
      jobRole,
      jobDescription,
      resumeText,
    })

    // Step 4: Compile to PDF
    const { outputDir, baseName } = getOutputPaths(session.userId, application.id)
    const compileResult = await compileLatexToPdf(latex, outputDir, baseName)

    // Step 5: ATS score comparison
    let atsComparison = null
    try {
      if (resumeText) {
        atsComparison = await compareATSScores(
          resumeText,
          latex,
          jobDescription,
          jobRole
        )
      }
    } catch (err) {
      console.warn('ATS scoring failed (non-fatal):', err)
    }

    // Step 6: Persist everything
    const updatedApp = await prisma.application.update({
      where: { id: application.id },
      data: {
        latexContent: latex,
        generatedLatexPath: compileResult.latexPath,
        generatedPdfPath: compileResult.success ? compileResult.pdfPath : null,
        atsScoreBefore: atsComparison?.before.score ?? null,
        atsScoreAfter: atsComparison?.after.score ?? null,
      },
    })

    return NextResponse.json(
      {
        success: true,
        application: updatedApp,
        latex,
        pdfGenerated: compileResult.success,
        pdfError: compileResult.error,
        model,
        atsComparison,
      },
      {
        headers: { 'X-RateLimit-Remaining': String(rl.remaining) },
      }
    )
  } catch (err: unknown) {
    console.error('Generate resume error:', err)
    const message = err instanceof Error ? err.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
