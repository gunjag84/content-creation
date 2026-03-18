import type { Slide, Settings, ZoneOverride, FontLibraryEntry } from './types'
import { GOOGLE_FONT_NAMES, googleFontImport } from './fonts'

export interface BuildSlideHTMLParams {
  slide: Slide
  allSlides: Slide[]
  settings: Settings | null
  baseUrl: string // e.g. 'http://localhost:3001'
}

function getLogoPositionStyle(position: string): string {
  switch (position) {
    case 'top-left': return 'top: 40px; left: 40px;'
    case 'top-center': return 'top: 40px; left: 50%; transform: translateX(-50%);'
    case 'top-right': return 'top: 40px; right: 40px;'
    case 'bottom-left': return 'bottom: 40px; left: 40px;'
    case 'bottom-center': return 'bottom: 40px; left: 50%; transform: translateX(-50%);'
    case 'bottom-right': return 'bottom: 40px; right: 40px;'
    default: return 'bottom: 40px; left: 50%; transform: translateX(-50%);'
  }
}

function fileUrl(path: string, baseUrl: string): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${baseUrl}/api/files/${encodeURIComponent(path.replace(/\\/g, '/'))}`
}

function isFilePath(val: string): boolean { return val.includes('/') }

interface ResolvedFont {
  importRule: string   // @import or @font-face (may be empty)
  family: string       // CSS font-family value
}

function resolveFont(
  value: string | undefined,
  alias: string,
  fontLibrary: FontLibraryEntry[],
  baseUrl: string
): ResolvedFont {
  if (!value) return { importRule: '', family: 'sans-serif' }

  // Custom uploaded font referenced by id (e.g. "custom:uuid-123")
  if (value.startsWith('custom:')) {
    const id = value.slice(7)
    const entry = fontLibrary.find(f => f.id === id)
    if (entry) {
      return {
        importRule: `@font-face { font-family: '${alias}'; src: url('${fileUrl(entry.path, baseUrl)}'); }`,
        family: `'${alias}', sans-serif`
      }
    }
    return { importRule: '', family: 'sans-serif' }
  }

  // Legacy: bare file path stored directly (backward compat)
  if (isFilePath(value)) {
    return {
      importRule: `@font-face { font-family: '${alias}'; src: url('${fileUrl(value, baseUrl)}'); }`,
      family: `'${alias}', sans-serif`
    }
  }

  // Google Font preset
  if (GOOGLE_FONT_NAMES.has(value)) {
    return {
      importRule: googleFontImport(value),
      family: `'${value}', sans-serif`
    }
  }

  // System / generic font name
  return { importRule: '', family: `'${value}', sans-serif` }
}

export function buildSlideHTML(params: BuildSlideHTMLParams): string {
  const { slide, allSlides, settings, baseUrl } = params
  const v = settings?.visual
  const colors = v?.colors ?? ['#ffffff', '#cccccc', '#1a1a2e']
  const primaryColor = colors[0] || '#ffffff'
  const secondaryColor = colors[1] || '#cccccc'
  const bgColor = colors[2] || '#1a1a2e'
  const fontLibrary = v?.fontLibrary ?? []

  const headlineFont = resolveFont(v?.fonts?.headline, 'CustomHeadline', fontLibrary, baseUrl)
  const bodyFont = resolveFont(v?.fonts?.body, 'CustomBody', fontLibrary, baseUrl)
  const ctaFont = resolveFont(v?.fonts?.cta, 'CustomCTA', fontLibrary, baseUrl)

  const fontStyles = [headlineFont.importRule, bodyFont.importRule, ctaFont.importRule]
    .filter(Boolean)
    .join('\n')

  // Background
  let backgroundCSS = `background-color: ${bgColor};`
  if (slide.custom_background_path) {
    backgroundCSS = `background-image: url('${fileUrl(slide.custom_background_path, baseUrl)}'); background-size: cover; background-position: center;`
  }

  const overlayOpacity = slide.overlay_opacity ?? 0.5

  // CTA text: last slide uses standard CTA if available
  const slideIdx = allSlides.findIndex(s => s.uid === slide.uid)
  const isLast = slideIdx === allSlides.length - 1
  const ctaText = (isLast && slide.slide_type === 'cta' && v?.cta) ? v.cta : (slide.cta_text || '')

  // Zone overrides
  const zoneIds = ['hook', 'body', 'cta'] as const
  const zoneDefaults = {
    hook: { top: 0, height: 340, font: headlineFont.family, fontSize: 56, color: primaryColor, weight: 'bold' as const },
    body: { top: 340, height: 770, font: bodyFont.family, fontSize: 38, color: secondaryColor, weight: 'normal' as const },
    cta: { top: 1110, height: 240, font: ctaFont.family, fontSize: 48, color: primaryColor, weight: 'bold' as const }
  }

  const textMap = { hook: slide.hook_text || '', body: slide.body_text || '', cta: ctaText }
  const overrides = slide.zone_overrides ?? {}

  const zoneElements = zoneIds.map(zoneId => {
    const text = textMap[zoneId]
    if (!text) return ''
    const def = zoneDefaults[zoneId]
    const ov: ZoneOverride = overrides[zoneId] ?? {}
    const fontSize = ov.fontSize ?? def.fontSize
    const fontWeight = ov.fontWeight ?? def.weight
    const color = ov.color ?? def.color
    const textAlign = ov.textAlign ?? 'center'
    const fontFamily = ov.fontFamily ? `'${ov.fontFamily}'` : def.font

    return `<div style="position:absolute;top:${def.top}px;left:0;right:0;height:${def.height}px;display:flex;align-items:center;justify-content:center;padding:30px 80px;">
      <div style="font-family:${fontFamily};font-size:${fontSize}px;font-weight:${fontWeight};color:${color};text-align:${textAlign};line-height:1.3;word-wrap:break-word;white-space:pre-wrap;">${text}</div>
    </div>`
  }).filter(Boolean).join('\n')

  // Logo
  const logoHtml = v?.logo
    ? `<img src="${fileUrl(v.logo, baseUrl)}" style="position:absolute;${getLogoPositionStyle('bottom-center')};width:120px;height:auto;object-fit:contain;" alt="" />`
    : ''

  // Handle
  const handleHtml = v?.handle
    ? `<div style="position:absolute;bottom:30px;left:50%;transform:translateX(-50%);font-family:${bodyFont.family};font-size:20px;color:${secondaryColor};">${v.handle}</div>`
    : ''

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>* { margin: 0; padding: 0; box-sizing: border-box; } ${fontStyles} body { width: 1080px; height: 1350px; position: relative; overflow: hidden; ${backgroundCSS} } .overlay { position: absolute; inset: 0; background-color: rgba(0,0,0,${overlayOpacity}); }</style></head><body><div class="overlay"></div>${zoneElements}${logoHtml}${handleHtml}</body></html>`
}
