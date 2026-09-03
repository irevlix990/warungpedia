import { describe, it, expect } from 'vitest'
import { analyticsRangeSchema } from '../analytics'

describe('analyticsRangeSchema', () => {
  it('accepts valid range presets', () => {
    for (const range of ['7d', '30d', '90d']) {
      expect(analyticsRangeSchema.safeParse({ range }).success).toBe(true)
    }
  })

  it('rejects an invalid range', () => {
    expect(analyticsRangeSchema.safeParse({ range: '1y' }).success).toBe(false)
  })

  it('rejects a missing range', () => {
    expect(analyticsRangeSchema.safeParse({}).success).toBe(false)
  })
})
