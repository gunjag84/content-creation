import type { Slide, Settings, ZoneOverride } from './types'
import { resolveFont, fileUrl } from './fontResolver'
import { ZONE_POSITION_DEFAULTS } from './zoneDefaults'

const CANVAS_W = 1080
const CANVAS_H = 1350

export interface BuildSlideHTMLParams {
  slide: Slide
  allSlides?: Slide[] // kept for backwards compat, no longer used
  settings: Settings | null
  baseUrl: string // e.g. 'http://localhost:3001'
}

export function buildSlideHTML(params: BuildSlideHTMLParams): string {
  const { slide, settings, baseUrl } = params
  const v = settings?.visual
  const colors = v?.colors ?? ['#ffffff', '#cccccc', '#1a1a2e']
  const primaryColor = colors[0] || '#ffffff'
  const secondaryColor = colors[1] || '#cccccc'
  const bgColor = colors[2] || '#1a1a2e'
  const fontLibrary = v?.fontLibrary ?? []

  const headlineFont = resolveFont(v?.fonts?.headline, 'CustomHeadline', fontLibrary, baseUrl)
  const bodyFont = resolveFont(v?.fonts?.body, 'CustomBody', fontLibrary, baseUrl)
  const ctaFont = resolveFont(v?.fonts?.cta, 'CustomCTA', fontLibrary, baseUrl)

  // Load all custom uploaded fonts by their display name so zone overrides can reference them
  const customLibraryFontStyles = fontLibrary.map(entry =>
    `@font-face { font-family: '${entry.name}'; src: url('${fileUrl(entry.path, baseUrl)}'); }`
  ).join('\n')

  const fontStyles = [headlineFont.css, bodyFont.css, ctaFont.css, customLibraryFontStyles]
    .filter(Boolean)
    .join('\n')

  // Background
  const bgX = slide.background_position_x ?? 50
  const bgY = slide.background_position_y ?? 50
  const bgScale = slide.background_scale ?? 1.0
  let bgWrapperHtml = ''
  if (slide.custom_background_path) {
    bgWrapperHtml = `<div style="position:absolute;inset:0;overflow:hidden;"><div style="position:absolute;inset:0;background:url('${fileUrl(slide.custom_background_path, baseUrl)}') ${bgX}% ${bgY}% / cover no-repeat;transform:scale(${bgScale});transform-origin:${bgX}% ${bgY}%;"></div></div>`
  }

  const overlayOpacity = slide.overlay_opacity ?? 0.5
  const overlayColor = slide.overlay_color === 'light' ? '255,255,255' : '0,0,0'

  const ctaText = slide.cta_text || ''

  // Zone overrides
  const fontSizes = v?.fontSizes ?? { headline: 56, body: 38, cta: 48 }
  const zoneIds = ['hook', 'body', 'cta'] as const
  const zoneDefaults = {
    hook: { ...ZONE_POSITION_DEFAULTS.hook, font: headlineFont.family, fontSize: fontSizes.headline, color: primaryColor, weight: 'bold' as const },
    body: { ...ZONE_POSITION_DEFAULTS.body, font: bodyFont.family, fontSize: fontSizes.body, color: secondaryColor, weight: 'normal' as const },
    cta:  { ...ZONE_POSITION_DEFAULTS.cta,  font: ctaFont.family,  fontSize: fontSizes.cta,  color: primaryColor, weight: 'bold' as const }
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
    const fontStyle = ov.fontStyle ?? 'normal'
    const color = ov.color ?? def.color
    const textAlign = ov.textAlign ?? 'center'
    const fontFamily = ov.fontFamily ? `'${ov.fontFamily}'` : def.font
    const lineHeight = ov.lineHeight ?? 1.3
    const letterSpacing = ov.letterSpacing ?? 0

    // Position: use overrides if set, otherwise full-width defaults
    const top = ov.posTop ?? def.top
    const height = ov.posHeight ?? def.height
    const positionCss = (ov.posLeft !== undefined || ov.posWidth !== undefined)
      ? `left:${ov.posLeft ?? 0}px;width:${ov.posWidth ?? CANVAS_W}px;`
      : `left:0;right:0;`

    return `<div style="position:absolute;top:${top}px;${positionCss}height:${height}px;display:flex;align-items:center;justify-content:center;padding:30px 80px;">
      <div style="font-family:${fontFamily};font-size:${fontSize}px;font-weight:${fontWeight};font-style:${fontStyle};color:${color};text-align:${textAlign};line-height:${lineHeight};letter-spacing:${letterSpacing}px;word-wrap:break-word;width:100%;">${text}</div>
    </div>`
  }).filter(Boolean).join('\n')

  // Logo — always above handle, locked in bottom zone
  const logoHtml = v?.logo
    ? `<img src="${fileUrl(v.logo, baseUrl)}" style="position:absolute;bottom:90px;left:50%;transform:translateX(-50%);width:400px;height:auto;object-fit:contain;" alt="" />`
    : ''

  // Handle — bottom of slide, larger
  const handleHtml = v?.handle
    ? `<div style="position:absolute;bottom:24px;left:50%;transform:translateX(-50%);font-family:${bodyFont.family};font-size:30px;color:${secondaryColor};white-space:nowrap;">${v.handle}</div>`
    : ''

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>* { margin: 0; padding: 0; box-sizing: border-box; } ${fontStyles} body { width: ${CANVAS_W}px; height: ${CANVAS_H}px; position: relative; overflow: hidden; background-color: ${bgColor}; } .overlay { position: absolute; inset: 0; background-color: rgba(${overlayColor},${overlayOpacity}); }</style></head><body>${bgWrapperHtml}<div class="overlay"></div>${zoneElements}${logoHtml}${handleHtml}</body></html>`
}
