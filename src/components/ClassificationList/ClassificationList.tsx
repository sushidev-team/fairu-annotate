import React from 'react'
import { useAnnotationStore } from '../../stores/provider'
import type { Label } from '../../types/labels'
import type { Annotation } from '../../types/annotations'

const EMPTY_ANNOTATIONS: Annotation[] = []

interface ClassificationListProps {
  imageId: string
  labels: Label[]
  labelKeyBindings?: Record<string, string>
  locked?: boolean
  onToggle: (labelId: string) => void
  className?: string
}

export function ClassificationList({
  imageId,
  labels,
  labelKeyBindings,
  locked = false,
  onToggle,
  className = '',
}: ClassificationListProps) {
  const annotations = useAnnotationStore((s) => s.annotations[imageId] ?? EMPTY_ANNOTATIONS)

  // Build set of active classification label IDs for this image
  const activeLabels = new Set(
    annotations
      .filter((a) => a.type === 'classification')
      .map((a) => a.labelId),
  )

  // Build reverse map: labelId → key hint
  const keyHints = new Map<string, string>()
  if (labelKeyBindings) {
    for (const [labelId, key] of Object.entries(labelKeyBindings)) {
      keyHints.set(labelId, key.toUpperCase())
    }
  }

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
        Classification ({activeLabels.size})
      </div>
      {labels.length === 0 ? (
        <div className="px-2 py-3 text-xs text-zinc-400 dark:text-zinc-500 text-center">
          No labels defined.
        </div>
      ) : (
        labels.map((label) => {
          const isActive = activeLabels.has(label.id)
          const keyHint = keyHints.get(label.id)

          return (
            <button
              key={label.id}
              type="button"
              disabled={locked}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left transition-colors w-full ${
                isActive
                  ? 'bg-blue-50 ring-1 ring-inset ring-blue-300 dark:bg-blue-900/30 dark:ring-blue-600'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
              } ${locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => onToggle(label.id)}
            >
              <span
                className={`h-3 w-3 rounded-full shrink-0 ring-1 ring-inset ${isActive ? 'ring-white/50' : 'ring-black/10 dark:ring-white/10'}`}
                style={{ backgroundColor: isActive ? label.color : `${label.color}40` }}
              />
              <span className={`flex-1 truncate ${isActive ? 'font-medium text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400'}`}>
                {label.name}
              </span>
              {keyHint && (
                <kbd className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 ring-1 ring-inset ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700">
                  {keyHint}
                </kbd>
              )}
              {isActive && (
                <svg className="w-4 h-4 shrink-0 text-blue-500 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )
        })
      )}
    </div>
  )
}
