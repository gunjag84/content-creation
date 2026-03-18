import { useRef, useState, useEffect } from 'react'
import type { Slide } from '@shared/types'

interface BackgroundPanEditorProps {
  slide: Slide
  slideIndex: number
  totalSlides: number
  onChange: (index: number, field: keyof Slide, value: string | number) => void
  onApplyToAll: () => void
  onDone: () => void
  onUpload: (file: File) => Promise<void>
  onRemove: () => void
  baseUrl: string
}

interface DragStart {
  x: number
  y: number
  bgX: number
  bgY: number
}

export function BackgroundPanEditor({
  slide,
  slideIndex,
  totalSlides,
  onChange,
  onApplyToAll,
  onDone,
  onUpload,
  onRemove,
  baseUrl,
}: BackgroundPanEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragStart = useRef<DragStart | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [applyConfirm, setApplyConfirm] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const bgX = slide.background_position_x ?? 50
  const bgY = slide.background_position_y ?? 50
  const bgScale = slide.background_scale ?? 1.0

  const imageUrl = slide.custom_background_path
    ? `${baseUrl}/api/files/${encodeURIComponent(slide.custom_background_path.replace(/\\/g, '/'))}`
    : ''

  // Preload image and auto-focus canvas for keyboard nav
  useEffect(() => {
    if (!imageUrl) return
    setImageLoaded(false)
    const img = new Image()
    img.onload = () => setImageLoaded(true)
    img.src = imageUrl
  }, [imageUrl])

  useEffect(() => {
    canvasRef.current?.focus()
  }, [])

  const applyDelta = (clientX: number, clientY: number) => {
    if (!dragStart.current) return
    const dx = (clientX - dragStart.current.x) * 0.3
    const dy = (clientY - dragStart.current.y) * 0.3
    const newX = Math.max(0, Math.min(100, dragStart.current.bgX - dx))
    const newY = Math.max(0, Math.min(100, dragStart.current.bgY - dy))
    onChange(slideIndex, 'background_position_x', newX)
    onChange(slideIndex, 'background_position_y', newY)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    dragStart.current = { x: e.clientX, y: e.clientY, bgX, bgY }
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    applyDelta(e.clientX, e.clientY)
  }

  const handleMouseUp = () => {
    dragStart.current = null
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    dragStart.current = { x: t.clientX, y: t.clientY, bgX, bgY }
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const t = e.touches[0]
    applyDelta(t.clientX, t.clientY)
  }

  const handleTouchEnd = () => {
    dragStart.current = null
    setIsDragging(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!slide.custom_background_path) return
    const step = e.shiftKey ? 5 : 1
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        onChange(slideIndex, 'background_position_x', Math.max(0, bgX - step))
        break
      case 'ArrowRight':
        e.preventDefault()
        onChange(slideIndex, 'background_position_x', Math.min(100, bgX + step))
        break
      case 'ArrowUp':
        e.preventDefault()
        onChange(slideIndex, 'background_position_y', Math.max(0, bgY - step))
        break
      case 'ArrowDown':
        e.preventDefault()
        onChange(slideIndex, 'background_position_y', Math.min(100, bgY + step))
        break
      case 'Escape':
        onChange(slideIndex, 'background_position_x', 50)
        onChange(slideIndex, 'background_position_y', 50)
        onChange(slideIndex, 'background_scale', 1.0)
        break
    }
  }

  const handleReset = () => {
    onChange(slideIndex, 'background_position_x', 50)
    onChange(slideIndex, 'background_position_y', 50)
    onChange(slideIndex, 'background_scale', 1.0)
  }

  const handleApplyToAll = () => {
    onApplyToAll()
    setApplyConfirm(true)
    setTimeout(() => setApplyConfirm(false), 1200)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    try {
      await onUpload(file)
    } catch {
      setUploadError('Upload failed. Try again.')
    }
    e.target.value = ''
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 text-gray-700"
          >
            Change image
          </button>
          <button
            onClick={onRemove}
            className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
          >
            Remove
          </button>
        </div>
        <button
          onClick={onDone}
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Done
        </button>
      </div>
      {uploadError && (
        <p className="mb-2 text-xs text-red-600">{uploadError}</p>
      )}

      {/* Pan canvas */}
      <div className="relative flex-1 flex flex-col">
        <div
          ref={canvasRef}
          tabIndex={0}
          role="img"
          aria-label="Drag to reframe background image. Use arrow keys for fine adjustment, Escape to reset."
          className="rounded-lg overflow-hidden select-none focus:outline-none focus:ring-2 focus:ring-blue-500 relative"
          style={{
            aspectRatio: '1080/1350',
            width: 'min(100%, calc((100vh - 300px) * 1080 / 1350))',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onKeyDown={handleKeyDown}
        >
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
          )}
          {imageUrl && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `url('${imageUrl}') ${bgX}% ${bgY}% / cover no-repeat`,
                transform: `scale(${bgScale})`,
                transformOrigin: `${bgX}% ${bgY}%`,
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.15s',
              }}
            />
          )}
          {/* Drag hint overlay */}
          {imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-white text-xs bg-black/40 rounded px-2 py-1 opacity-60">
                drag to reframe
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-3">
          <label className="text-xs text-gray-500 flex items-center gap-2 flex-1">
            Zoom
            <input
              type="range"
              min="100"
              max="300"
              step="5"
              value={Math.round(bgScale * 100)}
              onChange={(e) => onChange(slideIndex, 'background_scale', parseInt(e.target.value) / 100)}
              className="flex-1"
              aria-label={`Zoom: ${Math.round(bgScale * 100)}%`}
            />
            <span className="w-10 text-right text-xs tabular-nums">{Math.round(bgScale * 100)}%</span>
          </label>
          <button
            onClick={handleReset}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 shrink-0"
          >
            Reset
          </button>
        </div>

        {totalSlides > 1 && (
          <button
            onClick={handleApplyToAll}
            className="mt-2 w-full px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 text-gray-600"
          >
            {applyConfirm ? 'Applied!' : 'Apply to all slides'}
          </button>
        )}
      </div>
    </div>
  )
}
