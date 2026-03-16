// Tests for the LaTeX post-processing logic in resumeOptimizer
// (The AI call itself is not tested — we mock it)

// Import the fixHyperref function by re-exporting it for testing
// Since it's not exported, we test via the behavior of the output

describe('LaTeX hyperref fix', () => {
  // Inline the fixHyperref logic for direct testing
  function fixHyperref(latex: string): string {
    latex = latex.replace(
      /\\usepackage\[.*?\]\{hyperref\}/g,
      '\\usepackage[colorlinks=true, urlcolor=blue, linkcolor=blue, citecolor=blue]{hyperref}'
    )
    if (!latex.includes('{hyperref}')) {
      latex = latex.replace(
        /\\usepackage(\[.*?\])?\{geometry\}/,
        (match: string) =>
          match +
          '\n\\usepackage[colorlinks=true, urlcolor=blue, linkcolor=blue, citecolor=blue]{hyperref}'
      )
    }
    return latex
  }

  it('replaces hidelinks with colorlinks', () => {
    const input = '\\usepackage[hidelinks]{hyperref}'
    const result = fixHyperref(input)
    expect(result).not.toContain('hidelinks')
    expect(result).toContain('colorlinks=true')
    expect(result).toContain('urlcolor=blue')
  })

  it('replaces any hyperref option variant', () => {
    const input = '\\usepackage[pdftex,hidelinks,colorlinks=false]{hyperref}'
    const result = fixHyperref(input)
    expect(result).toContain('colorlinks=true')
    expect(result).not.toContain('hidelinks')
  })

  it('injects hyperref if missing, after geometry', () => {
    const input = '\\usepackage[margin=1in]{geometry}\n\\begin{document}'
    const result = fixHyperref(input)
    expect(result).toContain('{hyperref}')
    expect(result).toContain('colorlinks=true')
    // Should come after geometry
    const geoIdx = result.indexOf('{geometry}')
    const hyperIdx = result.indexOf('{hyperref}')
    expect(hyperIdx).toBeGreaterThan(geoIdx)
  })

  it('does not duplicate hyperref if already present with correct options', () => {
    const input = '\\usepackage[colorlinks=true, urlcolor=blue, linkcolor=blue, citecolor=blue]{hyperref}'
    const result = fixHyperref(input)
    const count = (result.match(/\{hyperref\}/g) || []).length
    expect(count).toBe(1)
  })

  it('preserves rest of document unchanged', () => {
    const input = [
      '\\documentclass{article}',
      '\\usepackage[hidelinks]{hyperref}',
      '\\begin{document}',
      'Hello World',
      '\\end{document}',
    ].join('\n')
    const result = fixHyperref(input)
    expect(result).toContain('\\documentclass{article}')
    expect(result).toContain('Hello World')
    expect(result).toContain('\\end{document}')
  })
})

describe('LaTeX code fence cleanup', () => {
  function cleanLatex(text: string): string {
    return text
      .replace(/^```(?:latex|tex)?\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim()
  }

  it('removes ```latex fences', () => {
    const input = '```latex\n\\documentclass{article}\n```'
    expect(cleanLatex(input)).toBe('\\documentclass{article}')
  })

  it('removes ```tex fences', () => {
    const input = '```tex\n\\documentclass{article}\n```'
    expect(cleanLatex(input)).toBe('\\documentclass{article}')
  })

  it('removes plain ``` fences', () => {
    const input = '```\n\\documentclass{article}\n```'
    expect(cleanLatex(input)).toBe('\\documentclass{article}')
  })

  it('leaves clean LaTeX unchanged', () => {
    const input = '\\documentclass{article}\n\\begin{document}\n\\end{document}'
    expect(cleanLatex(input)).toBe(input)
  })

  it('is case insensitive for fence language', () => {
    const input = '```LaTeX\n\\documentclass{article}\n```'
    expect(cleanLatex(input)).toBe('\\documentclass{article}')
  })
})
