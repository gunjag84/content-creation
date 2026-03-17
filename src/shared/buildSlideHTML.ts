import type { Slide, Settings, ZoneOverride } from './types'

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
  // Already an HTTP URL
  if (path.startsWith('http')) return path
  // Convert file path to API URL
  return `${baseUrl}/api/files/${encodeURIComponent(path.replace(/\\/g, '/'))}`
}

export function buildSlideHTML(params: BuildSlideHTMLParams): string {
  const { slide, allSlides, settings, baseUrl } = params
  const v = settings?.visual
  const colors = v?.colors ?? ['#ffffff', '#cccccc', '#1a1a2e']
  const primaryColor = colors[0] || '#ffffff'
  const secondaryColor = colors[1] || '#cccccc'
  const bgColor = colors[2] || '#1a1a2e'

  // Font face declarations
  const fontStyles = [
    v?.fonts?.headline ? `@font-face { font-family: 'CustomHeadline'; src: url('${fileUrl(v.fonts.headline, baseUrl)}'); }` : '',
    v?.fonts?.body ? `@font-face { font-family: 'CustomBody'; src: url('${fileUrl(v.fonts.body, baseUrl)}'); }` : '',
    v?.fonts?.cta ? `@font-face { font-family: 'CustomCTA'; src: url('${fileUrl(v.fonts.cta, baseUrl)}'); }` : ''
  ].filter(Boolean).join('\n')

  // Background
  let backgroundCSS = `background-color: ${bgColor};`
  if (slide.custom_background_path) {
    backgroundCSS = `background-image: url('${fileUrl(slide.custom_background_path, baseUrl)}'); background-size: cover; background-position: center;`
  }

  const overlayOpacity = slide.overlay_opacity ?? 0.5
  const headlineFamily = v?.fonts?.headline ? "'CustomHeadline', sans-serif" : 'sans-serif'
  const bodyFamily = v?.fonts?.body ? "'CustomBody', sans-serif" : 'sans-serif'
  const ctaFamily = v?.fonts?.cta ? "'CustomCTA', sans-serif" : 'sans-serif'

  // CTA text: last slide uses standard CTA if available
  const slideIdx = allSlides.findIndex(s => s.uid === slide.uid)
  const isLast = slideIdx === allSlides.length - 1
  const ctaText = (isLast && slide.slide_type === 'cta' && v?.cta) ? v.cta : (slide.cta_text || '')

  // Zone overrides
  const zoneIds = ['hook', 'body', 'cta'] as const
  const zoneDefaults = {
    hook: { top: 0, height: 340, font: headlineFamily, fontSize: 56, color: primaryColor, weight: 'bold' as const },
    body: { top: 340, height: 770, font: bodyFamily, fontSize: 38, color: secondaryColor, weight: 'normal' as const },
    cta: { top: 1110, height: 240, font: ctaFamily, fontSize: 48, color: primaryColor, weight: 'bold' as const }
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
    ? `<div style="position:absolute;bottom:30px;left:50%;transform:translateX(-50%);font-family:${bodyFamily};font-size:20px;color:${secondaryColor};">${v.handle}</div>`
    : ''

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>* { margin: 0; padding: 0; box-sizing: border-box; } ${fontStyles} body { width: 1080px; height: 1350px; position: relative; overflow: hidden; ${backgroundCSS} } .overlay { position: absolute; inset: 0; background-color: rgba(0,0,0,${overlayOpacity}); }</style></head><body><div class="overlay"></div>${zoneElements}${logoHtml}${handleHtml}</body></html>`
}
