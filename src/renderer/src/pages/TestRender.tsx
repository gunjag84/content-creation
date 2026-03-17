import { useState } from 'react'

interface RenderResult {
  format: string
  path: string
  dataUrl: string
  duration: number
  dimensions: string
}

export function TestRender() {
  const [isRendering, setIsRendering] = useState(false)
  const [results, setResults] = useState<RenderResult[]>([])

  const createSampleHTML = (format: string, width: number, height: number): string => {
    return `
      <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;
                   background:linear-gradient(135deg, #1e293b 0%, #334155 100%);
                   font-family:system-ui;color:white;">
        <div style="text-align:center;padding:40px;">
          <h1 style="font-size:48px;margin-bottom:20px;">Content Creation System</h1>
          <p style="font-size:24px;opacity:0.8;">Test Render - ${format}</p>
          <p style="font-size:18px;opacity:0.6;margin-top:10px;">${width}x${height}</p>
        </div>
      </div>
    `
  }

  const handleRender = async (format: string, width: number, height: number) => {
    setIsRendering(true)
    const startTime = performance.now()

    try {
      const html = createSampleHTML(format, width, height)
      const rawResult = await window.api.renderToPNG(html, { width, height })
      const parsed = JSON.parse(rawResult)
      const duration = performance.now() - startTime

      const result: RenderResult = {
        format,
        path: parsed.filePath,
        dataUrl: parsed.dataUrl,
        duration: Math.round(duration),
        dimensions: `${width}x${height}`
      }

      setResults((prev) => [result, ...prev])
    } catch (err) {
      console.error('Render failed:', err)
      alert(`Render failed: ${err}`)
    } finally {
      setIsRendering(false)
    }
  }

  const handleRenderCarousel = async () => {
    setIsRendering(true)
    const startTime = performance.now()

    try {
      const slide1 = createSampleHTML('Carousel Slide 1', 1080, 1350)
      const slide2 = createSampleHTML('Carousel Slide 2', 1080, 1350)
      const slide3 = createSampleHTML('Carousel Slide 3', 1080, 1350)

      const raw1 = await window.api.renderToPNG(slide1, { width: 1080, height: 1350 })
      const raw2 = await window.api.renderToPNG(slide2, { width: 1080, height: 1350 })
      const raw3 = await window.api.renderToPNG(slide3, { width: 1080, height: 1350 })

      const parsed1 = JSON.parse(raw1)
      const parsed2 = JSON.parse(raw2)
      const parsed3 = JSON.parse(raw3)

      const duration = performance.now() - startTime

      const newResults: RenderResult[] = [
        {
          format: 'Carousel Slide 1',
          path: parsed1.filePath,
          dataUrl: parsed1.dataUrl,
          duration: Math.round(duration / 3),
          dimensions: '1080x1350'
        },
        {
          format: 'Carousel Slide 2',
          path: parsed2.filePath,
          dataUrl: parsed2.dataUrl,
          duration: Math.round(duration / 3),
          dimensions: '1080x1350'
        },
        {
          format: 'Carousel Slide 3',
          path: parsed3.filePath,
          dataUrl: parsed3.dataUrl,
          duration: Math.round(duration / 3),
          dimensions: '1080x1350'
        }
      ]

      setResults((prev) => [...newResults, ...prev])
    } catch (err) {
      console.error('Carousel render failed:', err)
      alert(`Carousel render failed: ${err}`)
    } finally {
      setIsRendering(false)
    }
  }

  return (
    <div className="px-6 py-6">
      <h1 className="text-4xl font-bold mb-2 text-slate-100">Rendering Test</h1>
      <p className="text-slate-400 mb-8">
        Test the HTML-to-PNG rendering pipeline at Instagram dimensions
      </p>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 text-slate-100">Test Renders</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleRender('Feed Post', 1080, 1350)}
            disabled={isRendering}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            Render Feed Post (1080x1350)
          </button>

          <button
            onClick={() => handleRender('Story', 1080, 1920)}
            disabled={isRendering}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            Render Story (1080x1920)
          </button>

          <button
            onClick={handleRenderCarousel}
            disabled={isRendering}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            Render Carousel (3 slides)
          </button>
        </div>

        {isRendering && (
          <div className="mt-4 text-slate-400 text-sm flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full"></div>
            <span>Rendering...</span>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Render Results</h2>

          {results.map((result, index) => (
            <div key={index} className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-slate-100 font-medium">{result.format}</h3>
                  <p className="text-slate-400 text-sm">
                    {result.dimensions} - {result.duration}ms
                  </p>
                </div>
                <span className="text-xs text-green-400 bg-green-950/50 px-2 py-1 rounded">
                  Success
                </span>
              </div>

              <div className="bg-slate-950 rounded-lg p-4 mb-3">
                <img
                  src={result.dataUrl}
                  alt={result.format}
                  className="max-w-full h-auto mx-auto"
                  style={{ maxHeight: '400px' }}
                />
              </div>

              <div className="text-xs text-slate-500 break-all font-mono">
                {result.path}
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !isRendering && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center">
          <p className="text-slate-400">No renders yet. Click a button above to test rendering.</p>
        </div>
      )}
    </div>
  )
}
