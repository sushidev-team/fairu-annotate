import React, { useMemo, useState } from 'react'
import type { Annotation } from '../../types/annotations'
import type { Label } from '../../types/labels'
import type { YoloFormat } from '../../utils/yolo-format'
import { toYoloTxt, toYoloSegmentationTxt, toYoloOBBTxt, toYoloClassificationTxt } from '../../utils/yolo-format'
import { IconCopy } from '../common/Icons'

interface DataPreviewProps {
  annotations: Annotation[]
  labels: Label[]
  yoloFormat: YoloFormat | 'auto'
  imageWidth: number
  imageHeight: number
  mode?: 'annotate' | 'classify'
  className?: string
}

function resolveFormatLabel(format: YoloFormat | 'auto', mode: 'annotate' | 'classify'): string {
  if (mode === 'classify') return 'Classification'
  switch (format) {
    case 'detection': return 'Detection'
    case 'segmentation': return 'Segmentation'
    case 'obb': return 'OBB'
    case 'auto': return 'Auto'
  }
}

export function DataPreview({ annotations, labels, yoloFormat, imageWidth, imageHeight, mode = 'annotate', className = '' }: DataPreviewProps) {
  const [copied, setCopied] = useState(false)

  const displayAnnotations = mode === 'classify'
    ? annotations.filter((a) => a.type === 'classification')
    : annotations.filter((a) => a.type !== 'classification')

  const previewText = useMemo(() => {
    if (displayAnnotations.length === 0) return ''

    if (mode === 'classify') {
      return toYoloClassificationTxt(displayAnnotations, labels)
    }

    switch (yoloFormat) {
      case 'segmentation':
        return toYoloSegmentationTxt(displayAnnotations, labels, imageWidth, imageHeight)
      case 'obb':
        return toYoloOBBTxt(displayAnnotations, labels, imageWidth, imageHeight)
      case 'detection':
      case 'auto':
      default:
        return toYoloTxt(displayAnnotations, labels, imageWidth, imageHeight)
    }
  }, [displayAnnotations, labels, yoloFormat, imageWidth, imageHeight, mode])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(previewText)
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
          {resolveFormatLabel(yoloFormat, mode)}
        </span>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {displayAnnotations.length} {mode === 'classify' ? 'label' : 'annotation'}{displayAnnotations.length !== 1 ? 's' : ''}
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleCopy}
          disabled={!previewText}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded px-1.5 py-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          title="Copy to clipboard"
        >
          <IconCopy className="w-3.5 h-3.5" />
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="px-3 pb-2 max-h-32 overflow-auto">
        {previewText ? (
          <pre className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300 font-mono whitespace-pre select-all">
            {previewText}
          </pre>
        ) : (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">No {mode === 'classify' ? 'labels' : 'annotations'}</p>
        )}
      </div>
    </div>
  )
}
