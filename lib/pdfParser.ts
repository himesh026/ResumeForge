import fs from 'fs'
import path from 'path'

export interface ParsedResume {
  text: string
  links: ExtractedLink[]
  combined: string  // text + links section fed to AI
}

export interface ExtractedLink {
  url: string
  display?: string
}

export async function parsePdfToText(filePath: string): Promise<string> {
  const parsed = await parsePdf(filePath)
  return parsed.combined
}

export async function parsePdf(filePath: string): Promise<ParsedResume> {
  const ext = path.extname(filePath).toLowerCase()

  // Plain text / LaTeX file — no link extraction needed
  if (ext !== '.pdf') {
    try {
      const text = fs.readFileSync(filePath, 'utf-8').trim()
      return { text, links: [], combined: text }
    } catch {
      return { text: '', links: [], combined: '' }
    }
  }

  let text = ''
  let links: ExtractedLink[] = []

  // Step 1: Extract text
  try {
    const pdfParse = await import('pdf-parse')
    const dataBuffer = fs.readFileSync(filePath)
    const data = await pdfParse.default(dataBuffer)
    text = data.text.trim()
  } catch (err) {
    console.error('pdf-parse text extraction failed:', err)
  }

  // Step 2: Extract URLs from PDF annotations using raw buffer scan
  // pdf-parse doesn't expose annotations, so we scan the raw PDF bytes
  // for URI annotations which contain the actual href URLs
  try {
    const buffer = fs.readFileSync(filePath)
    links = extractUrlsFromPdfBuffer(buffer)
  } catch (err) {
    console.error('PDF link extraction failed:', err)
  }

  // Also scan the text itself for any plain-text URLs that survived parsing
  const textUrls = extractUrlsFromText(text)
  for (const url of textUrls) {
    if (!links.find(l => l.url === url)) {
      links.push({ url })
    }
  }

  const combined = buildCombinedText(text, links)
  return { text, links, combined }
}

/**
 * Scans raw PDF bytes for URI annotations.
 * PDFs store hyperlinks as: /URI (https://example.com)
 * This catches all clickable links regardless of display text.
 */
function extractUrlsFromPdfBuffer(buffer: Buffer): ExtractedLink[] {
  const content = buffer.toString('latin1')
  const links: ExtractedLink[] = []
  const seen = new Set<string>()

  // Match /URI (url) pattern — standard PDF hyperlink annotation
  const uriPattern = /\/URI\s*\(([^)]+)\)/g
  let match: RegExpExecArray | null

  while ((match = uriPattern.exec(content)) !== null) {
    let url = match[1].trim()
    // Decode PDF escape sequences
    url = url.replace(/\\([0-7]{3})/g, (_, oct) =>
      String.fromCharCode(parseInt(oct, 8))
    )
    url = url.replace(/\\\\/g, '\\').replace(/\\n/g, '')
    url = url.trim()

    if (url && isValidUrl(url) && !seen.has(url)) {
      seen.add(url)
      links.push({ url, display: inferDisplay(url) })
    }
  }

  // Also match /URI <url> (angle bracket variant)
  const uriAnglePattern = /\/URI\s*<([^>]+)>/g
  while ((match = uriAnglePattern.exec(content)) !== null) {
    const url = match[1].trim()
    if (url && isValidUrl(url) && !seen.has(url)) {
      seen.add(url)
      links.push({ url, display: inferDisplay(url) })
    }
  }

  return links
}

/**
 * Extracts plain-text URLs from parsed text content.
 */
function extractUrlsFromText(text: string): string[] {
  const urlPattern = /https?:\/\/[^\s,)<>\]"']+/gi
  const matches = text.match(urlPattern) || []
  return Array.from(new Set(matches.map(u => u.replace(/[.,;:]+$/, ''))))
}

function isValidUrl(url: string): boolean {
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:')) {
    return false
  }
  return url.length > 10
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

/**
 * Builds a combined string of resume text + extracted links
 * that gets sent to the AI. This ensures the AI knows every URL.
 */
function buildCombinedText(text: string, links: ExtractedLink[]): string {
  if (links.length === 0) return text

  const linkSection = [
    '',
    '--- EXTRACTED PROFILE LINKS (from PDF annotations) ---',
    'IMPORTANT: These are the actual URLs behind clickable text in the resume.',
    'You MUST include ALL of these links in the generated LaTeX using \\href{URL}{display}.',
    '',
    ...links.map(l => `  ${l.display || l.url} → ${l.url}`),
    '--- END OF EXTRACTED LINKS ---',
    '',
  ].join('\n')

  return text + linkSection
}

export async function saveUploadedFile(
  buffer: Buffer,
  originalName: string,
  userId: string
): Promise<string> {
  const uploadDir = process.env.UPLOAD_DIR || './uploads'
  const userDir = path.join(uploadDir, userId)

  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true })
  }

  const ext = path.extname(originalName)
  const safeName = `${Date.now()}-resume${ext}`
  const filePath = path.join(userDir, safeName)

  fs.writeFileSync(filePath, buffer)
  return filePath
}
