import React from 'react'
import { useAnnotationStore, useUIStore } from '../../stores/provider'
import type { Label } from '../../types/labels'
import type { Annotation } from '../../types/annotations'
import { AnnotationItem } from './AnnotationItem'

const EMPTY_ANNOTATIONS: Annotation[] = []

interface AnnotationListProps {
  imageId: string
  labels: Label[]
  locked?: boolean
  className?: string
}

export function AnnotationList({ imageId, labels, locked = false, className = '' }: AnnotationListProps) {
  const annotations = useAnnotationStore((s) => s.annotations[imageId] ?? EMPTY_ANNOTATIONS)
  const removeAnnotation = useAnnotationStore((s) => s.removeAnnotation)
  const selectedId = useUIStore((s) => s.selectedAnnotationId)
  const setSelected = useUIStore((s) => s.setSelectedAnnotation)

  const labelMap = new Map(labels.map((l) => [l.id, l]))

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
        Annotations ({annotations.length})
      </div>
      {annotations.length === 0 ? (
        <div className="px-2 py-3 text-xs text-zinc-400 dark:text-zinc-500 text-center">
          No annotations yet. Use the draw tool to add bounding boxes.
        </div>
      ) : (
        annotations.map((a) => (
          <AnnotationItem
            key={a.id}
            annotation={a}
            label={labelMap.get(a.labelId)}
            selected={selectedId === a.id}
            onSelect={() => setSelected(a.id)}
            onDelete={() => {
              removeAnnotation(a.id, imageId)
              if (selectedId === a.id) setSelected(null)
            }}
            locked={locked}
          />
        ))
      )}
    </div>
  )
}
