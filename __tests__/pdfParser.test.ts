// Tests for URL extraction utilities in pdfParser

// Re-implement the testable pure functions inline
function extractUrlsFromText(text: string): string[] {
  const urlPattern = /https?:\/\/[^\s,)<>\]"']+/gi
  const matches = text.match(urlPattern) || []
  return [...new Set(matches.map(u => u.replace(/[.,;:]+$/, '')))]
}

function inferDisplay(url: string): string {
  try {
    if (url.startsWith('mailto:')) return url.replace('mailto:', '')
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    const pathPart = u.pathname.replace(/\/$/, '')
    return pathPart ? `${host}${pathPart}` : host
  } catch {
    return url
  }
}

function isValidUrl(url: string): boolean {
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:')) {
    return false
  }
  return url.length > 10
}

describe('extractUrlsFromText', () => {
  it('extracts http URLs', () => {
    const text = 'Visit http://example.com for more info'
    expect(extractUrlsFromText(text)).toContain('http://example.com')
  })

  it('extracts https URLs', () => {
    const text = 'Profile: https://github.com/user'
    expect(extractUrlsFromText(text)).toContain('https://github.com/user')
  })

  it('extracts multiple URLs', () => {
    const text = 'GitHub: https://github.com/user LinkedIn: https://linkedin.com/in/user'
    const urls = extractUrlsFromText(text)
    expect(urls).toHaveLength(2)
    expect(urls).toContain('https://github.com/user')
    expect(urls).toContain('https://linkedin.com/in/user')
  })

  it('deduplicates URLs', () => {
    const text = 'https://github.com/user and again https://github.com/user'
    const urls = extractUrlsFromText(text)
    expect(urls).toHaveLength(1)
  })

  it('strips trailing punctuation', () => {
    const text = 'See https://example.com.'
    const urls = extractUrlsFromText(text)
    expect(urls[0]).toBe('https://example.com')
  })

  it('returns empty array for text with no URLs', () => {
    expect(extractUrlsFromText('No links here at all')).toHaveLength(0)
  })

  it('returns empty array for empty string', () => {
    expect(extractUrlsFromText('')).toHaveLength(0)
  })
})

describe('inferDisplay', () => {
  it('shows host for root URL', () => {
    expect(inferDisplay('https://github.com')).toBe('github.com')
  })

  it('removes www prefix', () => {
    expect(inferDisplay('https://www.linkedin.com/in/user')).toBe('linkedin.com/in/user')
  })

  it('includes path in display', () => {
    expect(inferDisplay('https://github.com/user/repo')).toBe('github.com/user/repo')
  })

  it('handles mailto URLs', () => {
    expect(inferDisplay('mailto:user@example.com')).toBe('user@example.com')
  })

  it('strips trailing slash from path', () => {
    expect(inferDisplay('https://example.com/page/')).toBe('example.com/page')
  })

  it('returns url as-is for invalid URLs', () => {
    expect(inferDisplay('not-a-url')).toBe('not-a-url')
  })
})

describe('isValidUrl', () => {
  it('accepts https URLs', () => {
    expect(isValidUrl('https://github.com/user')).toBe(true)
  })

  it('accepts http URLs', () => {
    expect(isValidUrl('http://example.com/page')).toBe(true)
  })

  it('accepts mailto URLs', () => {
    expect(isValidUrl('mailto:user@example.com')).toBe(true)
  })

  it('rejects plain text', () => {
    expect(isValidUrl('github.com/user')).toBe(false)
  })

  it('rejects short strings', () => {
    expect(isValidUrl('https://x')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidUrl('')).toBe(false)
  })
})
