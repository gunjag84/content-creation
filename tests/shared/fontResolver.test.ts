import { describe, it, expect } from 'vitest'
import { resolveFont } from '../../src/shared/fontResolver'
import type { FontLibraryEntry } from '../../src/shared/types'

const baseUrl = 'http://localhost:3001'
const lib: FontLibraryEntry[] = [
  { id: 'abc-123', name: 'My Brand Font', path: 'uploads/brand.ttf' }
]

describe('fontResolver - same output as original resolveFont', () => {
  it('returns sans-serif fallback for undefined', () => {
    const result = resolveFont(undefined, 'Alias', lib, baseUrl)
    expect(result.css).toBe('')
    expect(result.family).toBe('sans-serif')
  })

  it('resolves Google Font to @import url', () => {
    const result = resolveFont('Josefin Sans', 'Alias', lib, baseUrl)
    expect(result.css).toContain("@import url('https://fonts.googleapis.com/css2?family=Josefin+Sans")
    expect(result.family).toBe("'Josefin Sans', sans-serif")
  })

  it('resolves custom:id to @font-face using fontLibrary', () => {
    const result = resolveFont('custom:abc-123', 'CustomHeadline', lib, baseUrl)
    expect(result.css).toContain("@font-face")
    expect(result.css).toContain("font-family: 'CustomHeadline'")
    expect(result.css).toContain('uploads%2Fbrand.ttf')
    expect(result.family).toBe("'CustomHeadline', sans-serif")
  })

  it('returns sans-serif when custom:id not in library', () => {
    const result = resolveFont('custom:missing', 'Alias', lib, baseUrl)
    expect(result.css).toBe('')
    expect(result.family).toBe('sans-serif')
  })

  it('resolves legacy file path to @font-face', () => {
    const result = resolveFont('uploads/my-font.ttf', 'CustomBody', [], baseUrl)
    expect(result.css).toContain("@font-face")
    expect(result.css).toContain("font-family: 'CustomBody'")
    expect(result.family).toBe("'CustomBody', sans-serif")
  })

  it('resolves system font name as passthrough (no import)', () => {
    const result = resolveFont('Arial', 'Alias', [], baseUrl)
    expect(result.css).toBe('')
    expect(result.family).toBe("'Arial', sans-serif")
  })

  it('encodes spaces in file URL for custom:id path', () => {
    const libWithSpace: FontLibraryEntry[] = [{ id: 'x1', name: 'Font', path: 'uploads/my font.ttf' }]
    const result = resolveFont('custom:x1', 'Alias', libWithSpace, baseUrl)
    expect(result.css).toContain('my%20font.ttf')
  })
})
