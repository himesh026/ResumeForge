import { keywordScore, stripLatex } from '../lib/atsScorer'

describe('keywordScore', () => {
  const jobDescription = `
    We are looking for a Senior Software Engineer with experience in:
    React, TypeScript, Node.js, PostgreSQL, Docker, Kubernetes, AWS, REST APIs,
    microservices architecture, CI/CD pipelines, agile development.
    Must have strong problem-solving skills and experience with system design.
  `

  it('returns high score when resume matches well', () => {
    const resume = `
      Senior Software Engineer with 5 years experience.
      Proficient in React, TypeScript, Node.js, PostgreSQL.
      Built microservices on AWS using Docker and Kubernetes.
      Implemented CI/CD pipelines and REST APIs.
      Strong system design and agile development experience.
    `
    const result = keywordScore(resume, jobDescription)
    expect(result.score).toBeGreaterThan(60)
    expect(result.matchedKeywords.length).toBeGreaterThan(5)
  })

  it('returns low score when resume has few matches', () => {
    const resume = `
      Graphic Designer with experience in Photoshop, Illustrator, and InDesign.
      Created marketing materials and brand identities for clients.
    `
    const result = keywordScore(resume, jobDescription)
    expect(result.score).toBeLessThan(40)
  })

  it('score is between 0 and 100', () => {
    const result = keywordScore('hello world', jobDescription)
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('returns matched and missing keywords arrays', () => {
    const resume = 'React developer with TypeScript experience'
    const result = keywordScore(resume, jobDescription)
    expect(Array.isArray(result.matchedKeywords)).toBe(true)
    expect(Array.isArray(result.missingKeywords)).toBe(true)
    expect(result.matchedKeywords.some(k => k.includes('react') || k.includes('typescript'))).toBe(true)
  })

  it('returns empty score gracefully for empty resume', () => {
    const result = keywordScore('', jobDescription)
    expect(result.score).toBe(0)
    expect(result.matchedKeywords).toHaveLength(0)
  })

  it('returns a verdict string', () => {
    const result = keywordScore('React TypeScript Node.js developer', jobDescription)
    expect(typeof result.verdict).toBe('string')
    expect(result.verdict.length).toBeGreaterThan(0)
  })
})

describe('stripLatex', () => {
  it('removes basic LaTeX commands', () => {
    const latex = '\\textbf{Hello} \\textit{World}'
    expect(stripLatex(latex)).toContain('Hello')
    expect(stripLatex(latex)).toContain('World')
    expect(stripLatex(latex)).not.toContain('\\textbf')
  })

  it('removes section commands', () => {
    const latex = '\\section*{Professional Experience}'
    expect(stripLatex(latex)).toContain('Professional Experience')
    expect(stripLatex(latex)).not.toContain('\\section')
  })

  it('handles href commands', () => {
    const latex = '\\href{https://github.com/user}{github.com/user}'
    const result = stripLatex(latex)
    expect(result).toContain('github.com/user')
  })

  it('returns plain text for plain input', () => {
    const text = 'Hello World this is plain text'
    expect(stripLatex(text)).toBe(text)
  })

  it('handles empty string', () => {
    expect(stripLatex('')).toBe('')
  })

  it('removes backslashes and braces', () => {
    const latex = '\\begin{document}\\end{document}'
    const result = stripLatex(latex)
    expect(result).not.toContain('\\')
    expect(result).not.toContain('{')
  })
})
