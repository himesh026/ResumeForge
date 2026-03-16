import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

export interface CompileResult {
  success: boolean
  pdfPath?: string
  latexPath: string
  error?: string
  log?: string
}

export async function compileLatexToPdf(
  latexContent: string,
  outputDir: string,
  baseName: string
): Promise<CompileResult> {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const latexPath = path.join(outputDir, `${baseName}.tex`)
  const pdfPath = path.join(outputDir, `${baseName}.pdf`)

  // Write LaTeX file
  fs.writeFileSync(latexPath, latexContent, 'utf-8')

  // Check if pdflatex is available
  try {
    await execAsync('which pdflatex')
  } catch {
    return {
      success: false,
      latexPath,
      error: 'pdflatex not found. Install TeX Live: sudo apt-get install texlive-full',
    }
  }

  // Run pdflatex (twice for cross-references)
  try {
    const cmd = `pdflatex -interaction=nonstopmode -halt-on-error -output-directory="${outputDir}" "${latexPath}"`
    
    const { stdout: log1, stderr: err1 } = await execAsync(cmd, {
      timeout: 30000,
      cwd: outputDir,
    })
    
    // Second pass for proper rendering
    await execAsync(cmd, { timeout: 30000, cwd: outputDir })

    if (fs.existsSync(pdfPath)) {
      // Clean up auxiliary files
      cleanAuxFiles(outputDir, baseName)
      return { success: true, pdfPath, latexPath, log: log1 }
    } else {
      return {
        success: false,
        latexPath,
        error: 'PDF not generated despite successful compilation',
        log: log1 + err1,
      }
    }
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; message?: string }
    const log = (error.stdout || '') + (error.stderr || '')
    
    // Extract meaningful error from LaTeX log
    const latexError = extractLatexError(log)
    
    return {
      success: false,
      latexPath,
      error: latexError || error.message || 'Compilation failed',
      log,
    }
  }
}

function cleanAuxFiles(dir: string, baseName: string) {
  const auxExtensions = ['.aux', '.log', '.out', '.toc', '.lof', '.lot', '.fls', '.fdb_latexmk']
  for (const ext of auxExtensions) {
    const file = path.join(dir, `${baseName}${ext}`)
    if (fs.existsSync(file)) {
      try { fs.unlinkSync(file) } catch { /* ignore */ }
    }
  }
}

function extractLatexError(log: string): string {
  const lines = log.split('\n')
  const errorLines: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('!') || line.includes('Error:')) {
      errorLines.push(line.trim())
      // Get next few lines for context
      for (let j = 1; j <= 3 && i + j < lines.length; j++) {
        const ctx = lines[i + j].trim()
        if (ctx) errorLines.push(ctx)
      }
      if (errorLines.length > 0) break
    }
  }
  
  return errorLines.slice(0, 4).join(' | ') || ''
}

export function getOutputPaths(userId: string, applicationId: string) {
  const outputDir = path.join(
    process.env.OUTPUT_DIR || './outputs',
    userId,
    applicationId
  )
  const baseName = 'resume'
  return {
    outputDir,
    latexPath: path.join(outputDir, `${baseName}.tex`),
    pdfPath: path.join(outputDir, `${baseName}.pdf`),
    baseName,
  }
}
