import React from 'react'
import type { Annotation } from '../../types/annotations'
import type { Label } from '../../types/labels'
import { Badge } from '../common/Badge'
import { IconTrash } from '../common/Icons'

interface AnnotationItemProps {
  annotation: Annotation
  label: Label | undefined
  selected: boolean
  onSelect: () => void
  onDelete: () => void
  locked?: boolean
  className?: string
}

export function AnnotationItem({ annotation, label, selected, onSelect, onDelete, locked = false, className = '' }: AnnotationItemProps) {
  const { box } = annotation

  return (
    <div
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors ${
        selected ? 'bg-blue-50 ring-1 ring-inset ring-blue-300 dark:bg-blue-900/30 dark:ring-blue-600' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
      } ${className}`}
      onClick={onSelect}
    >
      {label && <Badge color={label.color}>{label.name}</Badge>}
      <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums flex-1 truncate">
        {Math.round(box.x)}, {Math.round(box.y)} &mdash; {Math.round(box.width)}&times;{Math.round(box.height)}
      </span>
      {!locked && (
        <button
          className="text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-colors shrink-0 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          title="Delete annotation"
        >
          <IconTrash className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
