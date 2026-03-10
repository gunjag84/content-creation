import React, { useState } from 'react'
import { ZoneEditor, type Zone } from './ZoneEditor'
import { Button } from '../ui/button'
import type { Settings } from '../../../../shared/types/settings'

export interface CarouselVariants {
  cover: Zone[]
  content: Zone[]
  cta: Zone[]
}

interface CarouselVariantEditorProps {
  variants: CarouselVariants
  onChange: (variants: CarouselVariants) => void
  brandGuidance: Settings['visualGuidance']
  backgroundImage: HTMLImageElement | null
  backgroundType: 'image' | 'solid_color' | 'gradient'
  backgroundColor?: string
  overlayColor: string
  overlayOpacity: number
  overlayEnabled: boolean
  format: 'feed' | 'story'
}

type VariantTab = 'cover' | 'content' | 'cta'

export function CarouselVariantEditor({
  variants,
  onChange,
  brandGuidance,
  backgroundImage,
  backgroundType,
  backgroundColor,
  overlayColor,
  overlayOpacity,
  overlayEnabled,
  format
}: CarouselVariantEditorProps) {
  const [activeTab, setActiveTab] = useState<VariantTab>('cover')

  const handleZonesChange = (tab: VariantTab, zones: Zone[]) => {
    onChange({
      ...variants,
      [tab]: zones
    })
  }

  const tabs: { key: VariantTab; label: string; description: string }[] = [
    {
      key: 'cover',
      label: 'Cover Slide',
      description: 'First slide - typically features a prominent hook'
    },
    {
      key: 'content',
      label: 'Content Slides',
      description: 'Middle slides - this layout is reused for all content slides'
    },
    {
      key: 'cta',
      label: 'CTA Slide',
      description: 'Last slide - call to action with logo and handle'
    }
  ]

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="border-b border-slate-700">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Description */}
      <div className="text-sm text-slate-400">
        {tabs.find((t) => t.key === activeTab)?.description}
      </div>

      {/* Zone Count Summary */}
      <div className="flex gap-4 text-xs text-slate-500">
        <div>
          Cover: {variants.cover.length} zone{variants.cover.length !== 1 ? 's' : ''}
        </div>
        <div>
          Content: {variants.content.length} zone{variants.content.length !== 1 ? 's' : ''}
        </div>
        <div>
          CTA: {variants.cta.length} zone{variants.cta.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Zone Editor for Active Tab */}
      <ZoneEditor
        backgroundImage={backgroundImage}
        backgroundType={backgroundType}
        backgroundColor={backgroundColor}
        overlayColor={overlayColor}
        overlayOpacity={overlayOpacity}
        overlayEnabled={overlayEnabled}
        zones={variants[activeTab]}
        onZonesChange={(zones) => handleZonesChange(activeTab, zones)}
        brandGuidance={brandGuidance}
        format={format}
      />
    </div>
  )
}
