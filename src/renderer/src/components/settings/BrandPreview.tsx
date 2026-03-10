import React, { useEffect, useState, useRef } from 'react'
import type { Settings } from '../../../../shared/types/settings'

interface BrandPreviewProps {
  visualGuidance: NonNullable<Settings['visualGuidance']>
}

export function BrandPreview({ visualGuidance }: BrandPreviewProps) {
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const latestGuidance = useRef(visualGuidance)

  // Update latest guidance ref
  useEffect(() => {
    latestGuidance.current = visualGuidance
  }, [visualGuidance])

  // Render preview with debounce
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = setTimeout(() => {
      renderPreview()
    }, 500)

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [
    visualGuidance.primaryColor,
    visualGuidance.secondaryColor,
    visualGuidance.backgroundColor,
    visualGuidance.headlineFont?.path,
    visualGuidance.bodyFont?.path,
    visualGuidance.ctaFont?.path,
    visualGuidance.headlineFontSize,
    visualGuidance.bodyFontSize,
    visualGuidance.ctaFontSize,
    visualGuidance.logo?.path,
    visualGuidance.logo?.position,
    visualGuidance.logo?.size,
    visualGuidance.standardCTA,
    visualGuidance.instagramHandle
  ])

  const renderPreview = async () => {
    setIsRendering(true)

    try {
      const html = generatePreviewHTML(latestGuidance.current)
      const dataUrl = await window.api.renderToPNG(html, { width: 1080, height: 1350 })
      setPreviewDataUrl(dataUrl)
    } catch (error) {
      console.error('Preview render failed:', error)
    } finally {
      setIsRendering(false)
    }
  }

  const generatePreviewHTML = (guidance: NonNullable<Settings['visualGuidance']>): string => {
    // Generate @font-face declarations
    let fontStyles = ''
    if (guidance.headlineFont) {
      fontStyles += `
        @font-face {
          font-family: 'CustomHeadline';
          src: url('file://${guidance.headlineFont.path}');
        }
      `
    }
    if (guidance.bodyFont) {
      fontStyles += `
        @font-face {
          font-family: 'CustomBody';
          src: url('file://${guidance.bodyFont.path}');
        }
      `
    }
    if (guidance.ctaFont) {
      fontStyles += `
        @font-face {
          font-family: 'CustomCTA';
          src: url('file://${guidance.ctaFont.path}');
        }
      `
    }

    // Calculate logo size in pixels
    const logoSizes = { small: 80, medium: 120, large: 160 }
    const logoSize = logoSizes[guidance.logo?.size || 'medium']

    // Calculate logo position styles
    const getLogoPositionStyles = () => {
      if (!guidance.logo) return ''

      const position = guidance.logo.position
      const baseStyle = 'position: absolute;'

      switch (position) {
        case 'center':
          return `${baseStyle} top: 50%; left: 50%; transform: translate(-50%, -50%);`
        case 'top-left':
          return `${baseStyle} top: 40px; left: 40px;`
        case 'top-center':
          return `${baseStyle} top: 40px; left: 50%; transform: translateX(-50%);`
        case 'top-right':
          return `${baseStyle} top: 40px; right: 40px;`
        case 'bottom-left':
          return `${baseStyle} bottom: 40px; left: 40px;`
        case 'bottom-center':
          return `${baseStyle} bottom: 40px; left: 50%; transform: translateX(-50%);`
        case 'bottom-right':
          return `${baseStyle} bottom: 40px; right: 40px;`
        default:
          return `${baseStyle} bottom: 40px; left: 50%; transform: translateX(-50%);`
      }
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          ${fontStyles}

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            width: 1080px;
            height: 1350px;
            background-color: ${guidance.backgroundColor};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px;
            position: relative;
            overflow: hidden;
          }

          .headline {
            font-family: ${guidance.headlineFont ? "'CustomHeadline'" : 'sans-serif'};
            font-size: ${guidance.headlineFontSize}px;
            color: ${guidance.primaryColor};
            text-align: center;
            margin-bottom: 40px;
            line-height: 1.2;
          }

          .body {
            font-family: ${guidance.bodyFont ? "'CustomBody'" : 'sans-serif'};
            font-size: ${guidance.bodyFontSize}px;
            color: ${guidance.secondaryColor};
            text-align: center;
            margin-bottom: 60px;
            line-height: 1.5;
            max-width: 800px;
          }

          .cta {
            font-family: ${guidance.ctaFont ? "'CustomCTA'" : 'sans-serif'};
            font-size: ${guidance.ctaFontSize}px;
            color: ${guidance.primaryColor};
            background-color: ${guidance.secondaryColor};
            padding: 20px 40px;
            border-radius: 8px;
            text-align: center;
            font-weight: bold;
          }

          .logo {
            ${getLogoPositionStyles()}
            width: ${logoSize}px;
            height: ${logoSize}px;
            object-fit: contain;
          }

          .instagram {
            position: absolute;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            font-family: ${guidance.bodyFont ? "'CustomBody'" : 'sans-serif'};
            font-size: 20px;
            color: ${guidance.secondaryColor};
          }
        </style>
      </head>
      <body>
        <div class="headline">
          Your Brand at a Glance
        </div>
        <div class="body">
          This preview shows how your brand colors, fonts, and logo work together.
          Customize each element to match your unique visual identity.
        </div>
        ${guidance.standardCTA ? `<div class="cta">${guidance.standardCTA}</div>` : ''}
        ${guidance.logo ? `<img class="logo" src="file://${guidance.logo.path}" alt="Logo" />` : ''}
        ${guidance.instagramHandle ? `<div class="instagram">${guidance.instagramHandle}</div>` : ''}
      </body>
      </html>
    `
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-gray-700">Brand Preview</label>
      <div className="relative bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-center min-h-[400px]">
        {isRendering ? (
          <div className="text-gray-500">Rendering preview...</div>
        ) : previewDataUrl ? (
          <img
            src={previewDataUrl}
            alt="Brand preview"
            className="max-w-full h-auto rounded-md shadow-lg"
            style={{ maxWidth: '300px' }}
          />
        ) : (
          <div className="text-gray-500">Preview will appear here</div>
        )}
      </div>
    </div>
  )
}
