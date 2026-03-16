import { callLLM } from './llmClient'

export interface ATSScore {
  score: number          // 0-100
  matchedKeywords: string[]
  missingKeywords: string[]
  suggestions: string[]
  verdict: string
}

export interface ATSComparison {
  before: ATSScore
  after: ATSScore
  improvement: number
}

/**
 * Calculates ATS match score between resume text and job description.
 * Uses both keyword matching and AI analysis.
 */
export async function calculateATSScore(
  resumeText: string,
  jobDescription: string,
  jobRole: string
): Promise<ATSScore> {
  const prompt = `You are an ATS (Applicant Tracking System) scoring engine.
Analyze how well the resume matches the job description and return a JSON score.

Job Role: ${jobRole}

Job Description:
${jobDescription}

Resume:
${resumeText}

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "score": <number 0-100>,
  "matchedKeywords": [<array of important keywords/skills found in both>],
  "missingKeywords": [<array of important keywords/skills in job but NOT in resume>],
  "suggestions": [<array of 3-4 specific actionable improvements>],
  "verdict": "<one sentence summary of the match quality>"
}`

  try {
    const { text } = await callLLM(prompt)

    // Strip any markdown fences
    const cleaned = text
      .replace(/^```(?:json)?\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim()

    const result = JSON.parse(cleaned) as ATSScore

    // Validate and clamp score
    result.score = Math.max(0, Math.min(100, Math.round(result.score)))
    result.matchedKeywords = result.matchedKeywords?.slice(0, 15) || []
    result.missingKeywords = result.missingKeywords?.slice(0, 15) || []
    result.suggestions = result.suggestions?.slice(0, 5) || []

    return result
  } catch (err) {
    console.error('ATS score parse error:', err)
    // Fallback to keyword-only scoring
    return keywordScore(resumeText, jobDescription)
  }
}

/**
 * Fast keyword-only scoring fallback (no LLM call).
 */
export function keywordScore(resumeText: string, jobDescription: string): ATSScore {
  const resumeLower = resumeText.toLowerCase()
  const jdLower = jobDescription.toLowerCase()

  // Extract meaningful words from JD (4+ chars, not stopwords)
  const stopwords = new Set([
    'with', 'that', 'this', 'have', 'from', 'they', 'will', 'been',
    'their', 'what', 'when', 'your', 'would', 'about', 'which', 'were',
    'also', 'into', 'more', 'some', 'than', 'then', 'them', 'these',
  ])

  const jdWords = Array.from(new Set(
    jdLower
      .replace(/[^a-z0-9\s+#.]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 4 && !stopwords.has(w))
  )]

  const matched = jdWords.filter(w => resumeLower.includes(w))
  const missing = jdWords.filter(w => !resumeLower.includes(w)).slice(0, 10)

  const score = jdWords.length > 0
    ? Math.round((matched.length / jdWords.length) * 100)
    : 0

  return {
    score: Math.min(score, 95), // keyword match caps at 95 — AI scoring can go higher
    matchedKeywords: matched.slice(0, 12),
    missingKeywords: missing,
    suggestions: [
      'Add more keywords from the job description',
      'Quantify achievements with numbers',
      'Match the exact terminology used in the job posting',
    ],
    verdict: score >= 70
      ? 'Good keyword match — optimize bullet points for higher score'
      : score >= 40
        ? 'Moderate match — significant keywords missing'
        : 'Poor match — resume needs major tailoring for this role',
  }
}

/**
 * Compares ATS scores before and after optimization.
 */
export async function compareATSScores(
  originalResumeText: string,
  optimizedLatex: string,
  jobDescription: string,
  jobRole: string
): Promise<ATSComparison> {
  // Strip LaTeX commands for text comparison
  const optimizedText = stripLatex(optimizedLatex)

  const [before, after] = await Promise.all([
    calculateATSScore(originalResumeText, jobDescription, jobRole),
    calculateATSScore(optimizedText, jobDescription, jobRole),
  ])

  return {
    before,
    after,
    improvement: after.score - before.score,
  }
}

/**
 * Strips LaTeX markup to plain text for scoring.
 */
export function stripLatex(latex: string): string {
  return latex
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')   // \cmd{text} → text
    .replace(/\\[a-zA-Z]+\[[^\]]*\]\{([^}]*)\}/g, '$1') // \cmd[opt]{text} → text
    .replace(/\\[a-zA-Z]+/g, ' ')                 // remaining commands
    .replace(/[{}\\]/g, ' ')                       // braces and backslashes
    .replace(/\s+/g, ' ')
    .trim()
}
