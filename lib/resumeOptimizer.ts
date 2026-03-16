import { callLLM } from './llmClient'

interface OptimizeInput {
  companyName: string
  jobRole: string
  jobDescription: string
  resumeText: string
}

interface OptimizeResult {
  latex: string
  model: string
}

export async function optimizeResume(input: OptimizeInput): Promise<OptimizeResult> {
  const { companyName, jobRole, jobDescription, resumeText } = input

  const prompt = `You are an expert technical resume writer and ATS optimization specialist.
Your task is to generate a complete, ATS-optimized LaTeX resume based on a candidate's existing resume and a job description.

STRICT RULES:
1. Preserve all truthful experience — do NOT invent fake jobs, degrees, or skills.
2. Improve wording using strong action verbs (Led, Architected, Reduced, Scaled, Delivered, etc.).
3. Naturally incorporate relevant keywords from the job description.
4. Maintain a clean, professional single-column resume structure.
5. Output ONLY valid LaTeX code — no markdown, no explanations, no code fences.
6. Start with \\documentclass and end with \\end{document}.
7. Use these packages: geometry, hyperref, enumitem, titlesec, xcolor, parskip, fontenc, inputenc.
8. Margins: 0.75in all sides.
9. Keep bullet points concise (1-2 lines max).
10. Do not use special Unicode characters — use LaTeX equivalents (e.g. -- for dash, \\& for ampersand).
11. Ensure the LaTeX compiles cleanly with pdflatex.

HYPERLINK RULES (very important):
12. ALWAYS use \\usepackage[colorlinks=true, urlcolor=blue, linkcolor=blue, citecolor=blue]{hyperref} — never use hidelinks.
13. Wrap ALL URLs with \\href{URL}{display text} — never paste raw URLs.
14. For email use \\href{mailto:email@example.com}{email@example.com}.
15. For LinkedIn use \\href{https://linkedin.com/in/username}{linkedin.com/in/username}.
16. For GitHub use \\href{https://github.com/username}{github.com/username}.
17. For portfolio use \\href{https://yoursite.com}{yoursite.com}.
18. Preserve ALL profile links found in the candidate's resume — do not drop any.
19. Display link text should be short and clean (no https://, no www.).
20. Links in the header contact line should all be on one line separated by \\quad $|$ \\quad or \\quad $\\cdot$ \\quad.

INPUTS:
Company Name: ${companyName}
Job Role: ${jobRole}

Job Description:
${jobDescription}

Candidate's Current Resume:
${resumeText || 'No existing resume provided. Create a well-structured template resume for a software professional.'}

OUTPUT: Return only the complete LaTeX source code, starting with \\documentclass.`

  const { text, model } = await callLLM(prompt)

  // Clean up the response
  let latex = text.trim()

  // Remove markdown code fences if present
  latex = latex.replace(/^```(?:latex|tex)?\n?/i, '').replace(/\n?```\s*$/i, '').trim()

  // Post-process: ensure colorlinks is used, never hidelinks
  latex = fixHyperref(latex)

  // Validate it looks like LaTeX
  if (!latex.includes('\\documentclass') || !latex.includes('\\begin{document}')) {
    console.warn('AI response may not be valid LaTeX, using fallback template')
    latex = generateFallbackLatex(companyName, jobRole, resumeText)
  }

  return { latex, model }
}

/**
 * Ensures hyperref is always set up with visible colored links.
 * Replaces any variant of hidelinks / black links with colorlinks=true.
 */
function fixHyperref(latex: string): string {
  // Replace any existing hyperref usepackage line with the correct one
  latex = latex.replace(
    /\\usepackage\[.*?\]\{hyperref\}/g,
    '\\usepackage[colorlinks=true, urlcolor=blue, linkcolor=blue, citecolor=blue]{hyperref}'
  )

  // If hyperref isn't included at all, inject it after geometry
  if (!latex.includes('{hyperref}')) {
    latex = latex.replace(
      /\\usepackage(\[.*?\])?\{geometry\}/,
      (match) =>
        match +
        '\n\\usepackage[colorlinks=true, urlcolor=blue, linkcolor=blue, citecolor=blue]{hyperref}'
    )
  }

  return latex
}

function generateFallbackLatex(
  companyName: string,
  jobRole: string,
  resumeText: string
): string {
  const nameMatch = resumeText.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/m)
  const name = nameMatch ? nameMatch[1] : 'Your Name'

  const emailMatch = resumeText.match(/[\w.+-]+@[\w-]+\.\w+/)
  const email = emailMatch ? emailMatch[0] : 'email@example.com'

  // Try to extract links from resume text
  const githubMatch = resumeText.match(/github\.com\/([^\s,)]+)/i)
  const linkedinMatch = resumeText.match(/linkedin\.com\/in\/([^\s,)]+)/i)
  const portfolioMatch = resumeText.match(/https?:\/\/(?!github|linkedin)([^\s,)]+)/i)

  const githubUrl = githubMatch ? `https://github.com/${githubMatch[1]}` : 'https://github.com/yourname'
  const githubDisplay = githubMatch ? `github.com/${githubMatch[1]}` : 'github.com/yourname'
  const linkedinUrl = linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : 'https://linkedin.com/in/yourname'
  const linkedinDisplay = linkedinMatch ? `linkedin.com/in/${linkedinMatch[1]}` : 'linkedin.com/in/yourname'

  const portfolioLine = portfolioMatch
    ? ` \\quad $\\cdot$ \\quad \\href{${portfolioMatch[0]}}{${portfolioMatch[1]}}`
    : ''

  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.75in]{geometry}
\\usepackage[colorlinks=true, urlcolor=blue, linkcolor=blue, citecolor=blue]{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\usepackage{parskip}

\\definecolor{accent}{RGB}{30, 64, 175}

\\titleformat{\\section}
  {\\large\\bfseries\\color{accent}}
  {}
  {0em}
  {}
  [\\color{accent}\\titlerule]

\\titlespacing{\\section}{0pt}{12pt}{6pt}

\\setlist[itemize]{
  noitemsep,
  topsep=2pt,
  parsep=0pt,
  partopsep=0pt,
  leftmargin=1.2em
}

\\pagestyle{empty}

\\begin{document}

\\begin{center}
  {\\LARGE\\bfseries ${name}}\\\\[6pt]
  \\href{mailto:${email}}{${email}}
  \\quad $\\cdot$ \\quad
  \\href{${linkedinUrl}}{${linkedinDisplay}}
  \\quad $\\cdot$ \\quad
  \\href{${githubUrl}}{${githubDisplay}}${portfolioLine}
\\end{center}

\\vspace{4pt}

\\section*{Professional Summary}
Results-driven software professional targeting the ${jobRole} role at ${companyName}.
Proven track record delivering scalable, high-quality software solutions with measurable business impact.

\\section*{Technical Skills}
\\begin{itemize}
  \\item \\textbf{Languages:} Python, JavaScript, TypeScript, SQL, Java
  \\item \\textbf{Frameworks \\& Libraries:} React, Node.js, FastAPI, Django, Spring Boot
  \\item \\textbf{Cloud \\& DevOps:} AWS, Docker, Kubernetes, CI/CD, Terraform
  \\item \\textbf{Databases:} PostgreSQL, MySQL, Redis, MongoDB
  \\item \\textbf{Tools:} Git, Jira, Figma, Linux
\\end{itemize}

\\section*{Professional Experience}

\\textbf{Senior Software Engineer} \\hfill \\textit{Jan 2022 -- Present}\\\\
\\textit{Tech Company} \\hfill Remote
\\begin{itemize}
  \\item Led development of microservices architecture serving 1M+ daily active users
  \\item Reduced API response latency by 40\\% through query optimization and caching strategies
  \\item Architected CI/CD pipelines reducing deployment time from 2 hours to 15 minutes
  \\item Mentored a team of 4 junior engineers and conducted weekly code reviews
\\end{itemize}

\\vspace{6pt}

\\textbf{Software Engineer} \\hfill \\textit{Jun 2019 -- Dec 2021}\\\\
\\textit{Previous Company} \\hfill City, State
\\begin{itemize}
  \\item Delivered 12 production features across the core product platform on schedule
  \\item Collaborated with product and design teams to define and refine technical requirements
  \\item Improved test coverage from 42\\% to 87\\%, reducing production incidents by 30\\%
\\end{itemize}

\\section*{Projects}

\\textbf{Open Source Project} \\hfill \\href{${githubUrl}}{${githubDisplay}}
\\begin{itemize}
  \\item Built and maintained a developer tool with 2k+ GitHub stars and active community
\\end{itemize}

\\section*{Education}

\\textbf{Bachelor of Science in Computer Science} \\hfill \\textit{2019}\\\\
\\textit{University Name} \\hfill City, State

\\end{document}`
}
