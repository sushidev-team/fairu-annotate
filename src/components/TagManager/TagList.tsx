import React from 'react'
import type { Label } from '../../types/labels'
import { useUIStore } from '../../stores/provider'
import { Badge } from '../common/Badge'
import { IconClose, IconStar, IconStarFilled } from '../common/Icons'

interface TagListProps {
  labels: Label[]
  activeLabelId: string | null
  onSelect: (id: string) => void
  onDelete?: (id: string) => void
  className?: string
}

export function TagList({ labels, activeLabelId, onSelect, onDelete, className = '' }: TagListProps) {
  const favoriteLabelIds = useUIStore((s) => s.favoriteLabelIds)
  const addFavoriteLabel = useUIStore((s) => s.addFavoriteLabel)
  const removeFavoriteLabel = useUIStore((s) => s.removeFavoriteLabel)

  if (labels.length === 0) {
    return <div className="py-2 text-xs text-zinc-400 dark:text-zinc-500 text-center">No labels found</div>
  }

  const favSet = new Set(favoriteLabelIds)
  const isFull = favoriteLabelIds.length >= 9

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      {labels.map((label, i) => {
        const isFav = favSet.has(label.id)
        const favIndex = isFav ? favoriteLabelIds.indexOf(label.id) : -1
        const shortcut = favoriteLabelIds.length > 0
          ? (isFav && favIndex < 9 ? favIndex + 1 : null)
          : (i < 9 ? i + 1 : null)

        return (
          <div
            key={label.id}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer transition-colors ${
              activeLabelId === label.id ? 'bg-blue-50 ring-1 ring-inset ring-blue-300 dark:bg-blue-900/30 dark:ring-blue-600' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
            onClick={() => onSelect(label.id)}
          >
            <Badge color={label.color}>{label.name}</Badge>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-auto tabular-nums select-none">
              {shortcut ?? ''}
            </span>
            <button
              className={`transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isFav
                  ? 'text-amber-400 hover:text-amber-500'
                  : isFull
                    ? 'text-zinc-200 dark:text-zinc-700 cursor-not-allowed'
                    : 'text-zinc-300 dark:text-zinc-600 hover:text-amber-400'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                if (isFav) {
                  removeFavoriteLabel(label.id)
                } else if (!isFull) {
                  addFavoriteLabel(label.id)
                }
              }}
              title={isFav ? 'Remove from favorites' : isFull ? 'Favorites full (9/9)' : 'Add to favorites'}
              disabled={!isFav && isFull}
            >
              {isFav ? (
                <IconStarFilled className="w-3.5 h-3.5" />
              ) : (
                <IconStar className="w-3.5 h-3.5" />
              )}
            </button>
            {onDelete && (
              <button
                className="text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(label.id)
                }}
                title={`Delete ${label.name}`}
              >
                <IconClose className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
