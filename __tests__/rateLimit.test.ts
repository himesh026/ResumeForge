import { rateLimit, RATE_LIMITS } from '../lib/rateLimit'

describe('rateLimit', () => {
  // Use unique keys per test to avoid state bleed
  const key = (suffix: string) => `test:${Date.now()}:${suffix}`

  it('allows first request', () => {
    const result = rateLimit(key('first'), { limit: 5, windowSecs: 60 })
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('tracks remaining correctly', () => {
    const id = key('track')
    const config = { limit: 3, windowSecs: 60 }

    const r1 = rateLimit(id, config)
    const r2 = rateLimit(id, config)
    const r3 = rateLimit(id, config)

    expect(r1.remaining).toBe(2)
    expect(r2.remaining).toBe(1)
    expect(r3.remaining).toBe(0)
  })

  it('blocks after limit is exceeded', () => {
    const id = key('block')
    const config = { limit: 2, windowSecs: 60 }

    rateLimit(id, config)
    rateLimit(id, config)
    const result = rateLimit(id, config)

    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('different keys do not interfere', () => {
    const config = { limit: 1, windowSecs: 60 }
    const r1 = rateLimit(key('a'), config)
    const r2 = rateLimit(key('b'), config)

    expect(r1.success).toBe(true)
    expect(r2.success).toBe(true)
  })

  it('returns resetAt timestamp in the future', () => {
    const result = rateLimit(key('reset'), { limit: 5, windowSecs: 60 })
    expect(result.resetAt).toBeGreaterThan(Date.now())
  })

  it('returns correct limit value', () => {
    const config = { limit: 10, windowSecs: 60 }
    const result = rateLimit(key('lim'), config)
    expect(result.limit).toBe(10)
  })

  it('RATE_LIMITS presets have correct shape', () => {
    expect(RATE_LIMITS.generation.limit).toBeGreaterThan(0)
    expect(RATE_LIMITS.generation.windowSecs).toBeGreaterThan(0)
    expect(RATE_LIMITS.auth.limit).toBeGreaterThan(0)
    expect(RATE_LIMITS.api.limit).toBeGreaterThan(0)
  })
})
