import React from 'react'
import { useUIStore } from '../../stores/provider'
import { Button } from '../common/Button'
import { IconChevronLeft, IconChevronRight } from '../common/Icons'

interface PaginationProps {
  images: { id: string; name: string }[]
  className?: string
}

export function Pagination({ images, className = '' }: PaginationProps) {
  const currentIndex = useUIStore((s) => s.currentImageIndex)
  const setIndex = useUIStore((s) => s.setCurrentImageIndex)

  if (images.length <= 1) return null

  return (
    <div className={`flex items-center gap-2 p-1.5 bg-white ring-1 ring-inset ring-zinc-200 rounded-lg shadow-sm dark:bg-zinc-900 dark:ring-zinc-700 ${className}`}>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIndex(currentIndex - 1)}
        disabled={currentIndex === 0}
        title="Previous image"
      >
        <IconChevronLeft className="w-4 h-4" />
      </Button>
      <span className="text-xs text-zinc-600 dark:text-zinc-300 tabular-nums select-none">
        {currentIndex + 1} / {images.length}
      </span>
      <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate max-w-32">
        {images[currentIndex]?.name}
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIndex(currentIndex + 1)}
        disabled={currentIndex >= images.length - 1}
        title="Next image"
      >
        <IconChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}
