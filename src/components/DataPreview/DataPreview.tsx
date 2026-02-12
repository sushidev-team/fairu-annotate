import React, { useMemo, useState } from 'react'
import type { Annotation } from '../../types/annotations'
import type { Label } from '../../types/labels'
import type { YoloFormat } from '../../utils/yolo-format'
import { toYoloTxt, toYoloSegmentationTxt, toYoloOBBTxt } from '../../utils/yolo-format'
import { IconCopy } from '../common/Icons'

interface DataPreviewProps {
  annotations: Annotation[]
  labels: Label[]
  yoloFormat: YoloFormat | 'auto'
  imageWidth: number
  imageHeight: number
  className?: string
}

function resolveFormatLabel(format: YoloFormat | 'auto'): string {
  switch (format) {
    case 'detection': return 'Detection'
    case 'segmentation': return 'Segmentation'
    case 'obb': return 'OBB'
    case 'auto': return 'Auto'
  }
}

export function DataPreview({ annotations, labels, yoloFormat, imageWidth, imageHeight, className = '' }: DataPreviewProps) {
  const [copied, setCopied] = useState(false)

  const yoloTxt = useMemo(() => {
    if (annotations.length === 0) return ''
    switch (yoloFormat) {
      case 'segmentation':
        return toYoloSegmentationTxt(annotations, labels, imageWidth, imageHeight)
      case 'obb':
        return toYoloOBBTxt(annotations, labels, imageWidth, imageHeight)
      case 'detection':
      case 'auto':
      default:
        return toYoloTxt(annotations, labels, imageWidth, imageHeight)
    }
  }, [annotations, labels, yoloFormat, imageWidth, imageHeight])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(yoloTxt)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Fallback: ignore if clipboard is unavailable
    }
  }

  return (
    <div className={`border-t border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 ${className}`}>
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          YOLO Preview
        </span>
        <span className="inline-flex items-center rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {resolveFormatLabel(yoloFormat)}
        </span>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleCopy}
          disabled={!yoloTxt}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded px-1.5 py-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          title="Copy to clipboard"
        >
          <IconCopy className="w-3.5 h-3.5" />
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="px-3 pb-2 max-h-32 overflow-auto">
        {yoloTxt ? (
          <pre className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300 font-mono whitespace-pre select-all">
            {yoloTxt}
          </pre>
        ) : (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">No annotations</p>
        )}
      </div>
    </div>
  )
}
