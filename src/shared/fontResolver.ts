import type { FontLibraryEntry } from './types'
import { GOOGLE_FONT_NAMES, googleFontImport } from './fonts'

export interface ResolvedFont {
  css: string    // @import or @font-face rule (may be empty)
  family: string // CSS font-family value
}

export function fileUrl(path: string, baseUrl: string): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${baseUrl}/api/files/${encodeURIComponent(path.replace(/\\/g, '/'))}`
}

export function resolveFont(
  value: string | undefined,
  alias: string,
  fontLibrary: FontLibraryEntry[],
  baseUrl: string
): ResolvedFont {
  if (!value) return { css: '', family: 'sans-serif' }

  // Custom uploaded font referenced by id (e.g. "custom:uuid-123")
  if (value.startsWith('custom:')) {
    const id = value.slice(7)
    const entry = fontLibrary.find(f => f.id === id)
    if (entry) {
      return {
        css: `@font-face { font-family: '${alias}'; src: url('${fileUrl(entry.path, baseUrl)}'); }`,
        family: `'${alias}', sans-serif`
      }
    }
    return { css: '', family: 'sans-serif' }
  }

  // Legacy: bare file path stored directly (backward compat)
  if (value.includes('/')) {
    return {
      css: `@font-face { font-family: '${alias}'; src: url('${fileUrl(value, baseUrl)}'); }`,
      family: `'${alias}', sans-serif`
    }
  }

  // Google Font preset
  if (GOOGLE_FONT_NAMES.has(value)) {
    return {
      css: googleFontImport(value),
      family: `'${value}', sans-serif`
    }
  }

  // System / generic font name
  return { css: '', family: `'${value}', sans-serif` }
}
