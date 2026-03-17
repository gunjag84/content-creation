import React from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardFooter } from '../ui/card'
import { Edit, Copy, Trash2 } from 'lucide-react'
import type { Template } from '../../../../preload/types'

interface TemplateCardProps {
  template: Template
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
}

export function TemplateCard({ template, onEdit, onDelete, onDuplicate }: TemplateCardProps) {
  const handleDelete = () => {
    const confirmed = window.confirm(
      `Delete template '${template.name}'? This cannot be undone.`
    )
    if (confirmed) {
      onDelete()
    }
  }

  const handleDuplicate = () => {
    onDuplicate()
  }

  // Parse zones count
  let zoneCount = 0
  try {
    const zones = JSON.parse(template.zones_config)
    if (Array.isArray(zones)) {
      zoneCount = zones.length
    } else if (zones && typeof zones === 'object') {
      // Carousel variant format
      const { cover, content, cta } = zones
      zoneCount = [cover, content, cta].filter(Array.isArray).reduce(
        (sum, arr) => sum + arr.length,
        0
      )
    }
  } catch (err) {
    // Ignore parse errors
  }

  // Format badge text
  const formatBadge = template.format === 'feed' ? 'Feed 4:5' : 'Story 9:16'

  // Background preview
  const renderBackgroundPreview = () => {
    if (template.background_type === 'image') {
      // Try to load image, fallback to placeholder
      return (
        <div className="w-full h-32 bg-slate-700 rounded overflow-hidden flex items-center justify-center">
          <img
            src={`file://${template.background_value}`}
            alt="Background"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.style.display = 'none'
              e.currentTarget.parentElement!.innerHTML = `
                <div class="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <span class="text-xs text-slate-400">Image</span>
                </div>
              `
            }}
          />
        </div>
      )
    }

    if (template.background_type === 'solid_color') {
      return (
        <div
          className="w-full h-32 rounded border border-slate-600"
          style={{ backgroundColor: template.background_value }}
        />
      )
    }

    if (template.background_type === 'gradient') {
      const colors = template.background_value.split(',')
      return (
        <div
          className="w-full h-32 rounded border border-slate-600"
          style={{
            background: `linear-gradient(180deg, ${colors[0] || '#000'}, ${colors[1] || '#fff'})`
          }}
        />
      )
    }

    return (
      <div className="w-full h-32 bg-slate-700 rounded flex items-center justify-center">
        <span className="text-xs text-slate-500">No background</span>
      </div>
    )
  }

  // Format relative time
  const getRelativeTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
      <CardContent className="p-4 space-y-3">
        {/* Background preview */}
        {renderBackgroundPreview()}

        {/* Template info */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-100 truncate">{template.name}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="px-2 py-1 bg-slate-700 rounded">{formatBadge}</span>
            <span>{zoneCount} zone{zoneCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="text-xs text-slate-500">
            Created {getRelativeTime(template.created_at)}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={handleDuplicate}>
          <Copy className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-400 hover:text-red-300">
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
