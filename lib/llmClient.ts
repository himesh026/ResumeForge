type LLMMode = 'cloud' | 'local'

interface LLMResponse {
  text: string
  model: string
}

// Fallback chain — tried in order until one succeeds.
// Override the first model via GEMINI_MODEL env var.
const GEMINI_FALLBACK_CHAIN = [
  process.env.GEMINI_MODEL || "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash-001",
  "gemini-2.5-pro",
];

// ─────────────────────────────────────────────────────────────
// Public entry point
// ─────────────────────────────────────────────────────────────
export async function callLLM(prompt: string): Promise<LLMResponse> {
  const mode = (process.env.AI_MODE || 'cloud') as LLMMode

  if (mode === 'local') {
    return callOllama(prompt)
  }

  if (process.env.GEMINI_API_KEY) {
    return callGeminiWithFallback(prompt)
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return callAnthropic(prompt)
  }

  throw new Error(
    'No AI API key configured. Add GEMINI_API_KEY to your .env file.\n' +
    'Get a free key at: https://aistudio.google.com/app/apikey'
  )
}

// ─────────────────────────────────────────────────────────────
// Gemini — tries each model in GEMINI_FALLBACK_CHAIN
// ─────────────────────────────────────────────────────────────
async function callGeminiWithFallback(prompt: string): Promise<LLMResponse> {
  // Deduplicate chain (in case GEMINI_MODEL matches a fallback)
  const chain = [...new Set(GEMINI_FALLBACK_CHAIN)]
  const errors: string[] = []

  for (const model of chain) {
    try {
      console.log(`[LLM] Trying Gemini model: ${model}`)
      const result = await callGeminiModel(prompt, model)
      console.log(`[LLM] Success with model: ${model}`)
      return result
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      const isQuota = msg.includes('quota') || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')

      console.warn(`[LLM] ${model} failed: ${msg}`)
      errors.push(`${model}: ${msg}`)

      // Only continue the fallback chain on quota/rate-limit errors
      if (!isQuota) {
        // Hard error (bad API key, invalid request, etc.) — don't try more models
        throw new Error(msg)
      }
      // else: quota hit — try next model
    }
  }

  throw new Error(
    `All Gemini models exhausted their quota.\n\n${errors.join('\n')}\n\n` +
    'Options:\n' +
    '  1. Wait for quota reset (usually resets each minute / day)\n' +
    '  2. Enable billing at https://console.cloud.google.com/billing\n' +
    '  3. Switch to a different GEMINI_MODEL in .env\n' +
    '  4. Use local Ollama: set AI_MODE=local in .env'
  )
}

async function callGeminiModel(prompt: string, model: string): Promise<LLMResponse> {
  const apiKey = process.env.GEMINI_API_KEY!

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
        },
      }),
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    const message = err?.error?.message || response.statusText
    // Attach status code so callers can detect quota errors reliably
    throw new Error(`[${response.status}] Gemini API error: ${message}`)
  }

  const data = await response.json()
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  if (!text) {
    const reason = data.candidates?.[0]?.finishReason || 'unknown'
    throw new Error(`Gemini returned empty response. finishReason: ${reason}`)
  }

  return { text, model }
}

// ─────────────────────────────────────────────────────────────
// Anthropic (fallback if no Gemini key)
// ─────────────────────────────────────────────────────────────
async function callAnthropic(prompt: string): Promise<LLMResponse> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`Anthropic API error: ${err.error?.message || response.statusText}`)
  }

  const data = await response.json()
  return {
    text: data.content[0]?.text || '',
    model: 'claude-sonnet-4-6',
  }
}

// ─────────────────────────────────────────────────────────────
// Ollama (local inference)
// ─────────────────────────────────────────────────────────────
async function callOllama(prompt: string): Promise<LLMResponse> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  const model = process.env.OLLAMA_MODEL || 'llama3'

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { temperature: 0.3, num_predict: 4096 },
    }),
  })

  if (!response.ok) {
    throw new Error(
      `Ollama error: ${response.statusText}. Make sure Ollama is running at ${baseUrl}`
    )
  }

  const data = await response.json()
  return { text: data.response || '', model }
}
