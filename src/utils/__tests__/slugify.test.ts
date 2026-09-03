import { describe, expect, it } from 'vitest'
import { slugify } from '@/utils/slugify'

describe('slugify', () => {
  it('lowercases and trims', () => {
    expect(slugify('  Toko Contoh  ')).toBe('toko-contoh')
  })

  it('collapses whitespace into single hyphens', () => {
    expect(slugify('Toko  Contoh   Baru')).toBe('toko-contoh-baru')
  })

  it('strips accents', () => {
    expect(slugify('Kue Basah Éclair')).toBe('kue-basah-eclair')
  })

  it('removes unsupported characters', () => {
    expect(slugify('Toko @#$ Saya!')).toBe('toko-saya')
  })

  it('removes leading and trailing hyphens', () => {
    expect(slugify('  -Toko Halal-  ')).toBe('toko-halal')
  })

  it('returns empty string for input with only unsupported chars', () => {
    expect(slugify('!!!')).toBe('')
  })

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('')
  })
})
