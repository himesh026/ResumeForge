import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { parsePdfToText, saveUploadedFile } from '@/lib/pdfParser'
import { callLLM } from '@/lib/llmClient'
import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit: same as generation
    const rl = rateLimit(`roast:${session.userId}`, RATE_LIMITS.generation)
    if (!rl.success) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${Math.ceil((rl.resetAt - Date.now()) / 60000)} minutes.` },
        { status: 429 }
      )
    }

    const formData = await req.formData()
    const jobRole = formData.get('jobRole') as string
    const jobDescription = formData.get('jobDescription') as string
    const resumeFile = formData.get('resume') as File | null

    if (!jobDescription) {
      return NextResponse.json({ error: 'Job description required' }, { status: 400 })
    }

    // Parse resume
    let resumeText = ''
    if (resumeFile && resumeFile.size > 0) {
      const buffer = Buffer.from(await resumeFile.arrayBuffer())
      const filePath = await saveUploadedFile(buffer, resumeFile.name, session.userId)
      resumeText = await parsePdfToText(filePath)
    }

    const prompt = `You are an experienced technical recruiter and hiring manager who has reviewed thousands of resumes for competitive tech roles. Your task is to **critically evaluate and roast a candidate’s resume in a realistic and brutally honest but constructive way** based on the provided job description.

Your tone should feel like **real internal recruiter feedback** — direct, practical, and slightly harsh where necessary, but always useful. Do not insult the candidate personally; critique the **resume content, structure, and relevance to the job**.

GOALS

1. Evaluate how well the resume matches the job description.
2. Identify weaknesses that would cause the resume to be rejected in a real screening.
3. Point out missing skills, weak bullet points, vague claims, and irrelevant content.
4. Explain why the resume would or would not pass ATS and recruiter screening.
5. Provide clear suggestions for improvement.

INPUTS

JOB ROLE: ${jobRole || "Not specified"}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S RESUME:
${resumeText || "No resume provided — roast them for not even uploading one."}

INSTRUCTIONS

Analyze the resume against the job description and produce the following sections:

1. ATS Match Score (0–100)
   Estimate how well the resume matches the job description keywords.

2. First Impression (Recruiter Perspective)
   Write what a recruiter would realistically think within the first 10 seconds of seeing the resume.

3. Brutal Resume Roast
   List the biggest problems in the resume. Focus on things like:

* weak bullet points
* vague achievements
* lack of metrics
* missing technologies
* irrelevant sections
* poor storytelling
* generic wording

Explain why each issue weakens the resume.

4. Missing Keywords / Skills
   List important keywords or technologies mentioned in the job description that are missing from the resume.

5. Bullet Point Problems
   Highlight examples of weak resume bullet points and explain why they are ineffective.

6. How Likely This Resume Gets an Interview
   Provide a realistic probability estimate.

Example:
"Estimated interview chance: 12%"

Explain the reasoning.

7. What Needs to Change Immediately
   Provide concrete improvements the candidate should make.

Focus on:

* stronger bullet points
* better metrics
* highlighting relevant technologies
* removing irrelevant content

TONE GUIDELINES

The tone should feel like **real hiring manager feedback**, not polite AI coaching.

Examples of acceptable tone:

"This bullet point says almost nothing. 'Worked on backend services' is far too vague and tells the recruiter nothing about your impact."

"This project sounds like a tutorial-level project and does not demonstrate production-level engineering experience."

Avoid personal insults. Critique the resume professionally.

OUTPUT FORMAT

Return the analysis in the following structure:

ATS Match Score

First Impression

Brutal Resume Roast

Missing Keywords / Skills

Bullet Point Problems

Interview Probability

What Needs to Change Immediately

Do not rewrite the resume unless specifically asked. Focus on honest evaluation.`;

    const { text, model } = await callLLM(prompt)

    return NextResponse.json({ roast: text, model })
  } catch (err: unknown) {
    console.error('Roast error:', err)
    const message = err instanceof Error ? err.message : 'Roast failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
