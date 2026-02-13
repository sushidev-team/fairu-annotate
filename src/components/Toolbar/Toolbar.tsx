import React from 'react'
import { useUIStore } from '../../stores/provider'
import { Button } from '../common/Button'
import {
  IconPencil,
  IconCursor,
  IconHand,
  IconPolygon,
  IconZoomIn,
  IconZoomOut,
  IconReset,
  IconDownload,
  IconLock,
  IconUnlock,
  IconCode,
} from '../common/Icons'
import type { Tool } from '../../types/events'
import type { Label } from '../../types/labels'
import { LabelSelector } from './LabelSelector'

interface ToolbarProps {
  onExport?: () => void
  labels?: Label[]
  locked?: boolean
  readOnly?: boolean
  showIcons?: boolean
  showLabelDots?: boolean
  mode?: 'annotate' | 'classify'
  className?: string
}

const drawTools: { id: Tool; label: string; shortcut: string; icon: React.ReactNode }[] = [
  {
    id: 'draw',
    label: 'Draw',
    shortcut: 'D',
    icon: <IconPencil className="w-4 h-4" />,
  },
  {
    id: 'polygon',
    label: 'Polygon',
    shortcut: 'P',
    icon: <IconPolygon className="w-4 h-4" />,
  },
]

const viewTools: { id: Tool; label: string; shortcut: string; icon: React.ReactNode }[] = [
  {
    id: 'select',
    label: 'Select',
    shortcut: 'V',
    icon: <IconCursor className="w-4 h-4" />,
  },
  {
    id: 'pan',
    label: 'Pan',
    shortcut: 'H',
    icon: <IconHand className="w-4 h-4" />,
  },
]

export function Toolbar({ onExport, labels, locked = false, readOnly = false, showIcons = true, showLabelDots = true, mode = 'annotate', className = '' }: ToolbarProps) {
  const activeTool = useUIStore((s) => s.tool)
  const setTool = useUIStore((s) => s.setTool)
  const zoom = useUIStore((s) => s.zoom)
  const setZoom = useUIStore((s) => s.setZoom)
  const resetView = useUIStore((s) => s.resetView)
  const userLocked = useUIStore((s) => s.locked)
  const setLocked = useUIStore((s) => s.setLocked)
  const showDataPreview = useUIStore((s) => s.showDataPreview)
  const setShowDataPreview = useUIStore((s) => s.setShowDataPreview)

  return (
    <div className={`flex items-center gap-1 p-1.5 bg-white ring-1 ring-inset ring-zinc-200 rounded-lg shadow-sm dark:bg-zinc-900 dark:ring-zinc-700 ${className}`}>
      {/* Lock toggle */}
      {!readOnly && (
        <Button
          size="sm"
          variant={locked ? 'primary' : 'ghost'}
          onClick={() => setLocked(!userLocked)}
          title={locked ? 'Unlock editing (L)' : 'Lock editing (L)'}
        >
          {locked ? (
            <IconLock className="w-4 h-4" />
          ) : (
            <IconUnlock className="w-4 h-4" />
          )}
        </Button>
      )}
      {/* Draw tools — hidden when locked or in classify mode */}
      {!locked && mode !== 'classify' &&
        drawTools.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={activeTool === t.id ? 'primary' : 'ghost'}
            onClick={() => setTool(t.id)}
            title={`${t.label} (${t.shortcut})`}
          >
            {showIcons ? t.icon : <span className="text-xs font-semibold w-4 h-4 flex items-center justify-center">{t.shortcut}</span>}
          </Button>
        ))}
      {/* View tools — always visible */}
      {viewTools.map((t) => (
        <Button
          key={t.id}
          size="sm"
          variant={activeTool === t.id ? 'primary' : 'ghost'}
          onClick={() => setTool(t.id)}
          title={`${t.label} (${t.shortcut})`}
        >
          {showIcons ? t.icon : <span className="text-xs font-semibold w-4 h-4 flex items-center justify-center">{t.shortcut}</span>}
        </Button>
      ))}
      {/* Label selector — hidden in classify mode */}
      {labels && labels.length > 0 && mode !== 'classify' && (
        <>
          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
          <LabelSelector labels={labels} disabled={locked} showDots={showLabelDots} />
        </>
      )}
      <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
      <Button size="sm" variant="ghost" onClick={() => setZoom(zoom / 1.2)} title="Zoom Out">
        <IconZoomOut className="w-4 h-4" />
      </Button>
      <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums w-12 text-center select-none">
        {Math.round(zoom * 100)}%
      </span>
      <Button size="sm" variant="ghost" onClick={() => setZoom(zoom * 1.2)} title="Zoom In">
        <IconZoomIn className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={resetView} title="Reset View">
        <IconReset className="w-4 h-4" />
      </Button>
      <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
      <Button
        size="sm"
        variant={showDataPreview ? 'primary' : 'ghost'}
        onClick={() => setShowDataPreview(!showDataPreview)}
        title="Toggle Data Preview"
      >
        <IconCode className="w-3.5 h-3.5" />
      </Button>
      {onExport && (
        <Button size="sm" variant="default" onClick={onExport} title="Export YOLO (Ctrl+S)">
          <IconDownload className="w-3.5 h-3.5" />
          Export
        </Button>
      )}
    </div>
  )
}
