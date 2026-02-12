import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useUIStore } from '../../stores/provider'
import { IconChevronDown, IconStar, IconClose } from '../common/Icons'
import type { Label } from '../../types/labels'

type SortOrder = 'default' | 'az' | 'za'

interface LabelSelectorProps {
  labels: Label[]
  disabled?: boolean
  showDots?: boolean
  className?: string
}

export function LabelSelector({ labels, disabled = false, showDots = true, className = '' }: LabelSelectorProps) {
  const activeLabelId = useUIStore((s) => s.activeLabelId)
  const setActiveLabel = useUIStore((s) => s.setActiveLabel)
  const favoriteLabelIds = useUIStore((s) => s.favoriteLabelIds)
  const setFavoriteLabelIds = useUIStore((s) => s.setFavoriteLabelIds)
  const addFavoriteLabel = useUIStore((s) => s.addFavoriteLabel)
  const removeFavoriteLabel = useUIStore((s) => s.removeFavoriteLabel)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('default')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Drag & drop state
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  const activeLabel = labels.find((l) => l.id === activeLabelId)

  const favoriteLabels = useMemo(() => {
    return favoriteLabelIds
      .map((id) => labels.find((l) => l.id === id))
      .filter((l): l is Label => l != null)
  }, [favoriteLabelIds, labels])

  const nonFavoriteLabels = useMemo(() => {
    const favSet = new Set(favoriteLabelIds)
    let filtered = labels.filter((l) => !favSet.has(l.id))
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter((l) => l.name.toLowerCase().includes(q))
    }
    if (sortOrder === 'az') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortOrder === 'za') {
      filtered = [...filtered].sort((a, b) => b.name.localeCompare(a.name))
    }
    return filtered
  }, [labels, favoriteLabelIds, search, sortOrder])

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      setSearch('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // Click-outside to close
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'Enter' && nonFavoriteLabels.length > 0) {
      setActiveLabel(nonFavoriteLabels[0].id)
      setOpen(false)
    }
  }

  const isFavoritesFull = favoriteLabelIds.length >= 9

  // Drag & drop handlers for favorites reorder
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropIndex(index)
  }, [])

  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex) {
      const newIds = [...favoriteLabelIds]
      const [moved] = newIds.splice(dragIndex, 1)
      newIds.splice(dropIndex, 0, moved)
      setFavoriteLabelIds(newIds)
    }
    setDragIndex(null)
    setDropIndex(null)
  }, [dragIndex, dropIndex, favoriteLabelIds, setFavoriteLabelIds])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
          disabled
            ? 'opacity-50 cursor-not-allowed text-zinc-400'
            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer'
        }`}
      >
        {showDots && activeLabel && (
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: activeLabel.color }}
          />
        )}
        <span className="truncate max-w-[6rem]">{activeLabel?.name ?? 'Label'}</span>
        <IconChevronDown className="w-3 h-3 text-zinc-400 dark:text-zinc-500 shrink-0" />
      </button>

      {open && !disabled && (
        <div className="absolute top-full left-0 mt-1 min-w-[14rem] bg-white dark:bg-zinc-900 rounded-lg shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-700 z-50">
          {/* Favorites section */}
          {favoriteLabels.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                <span>Favorites ({favoriteLabels.length}/9)</span>
              </div>
              <div className="py-0.5">
                {favoriteLabels.map((label, index) => (
                  <div
                    key={label.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                      label.id === activeLabelId
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    } ${dragIndex === index ? 'opacity-40' : ''} ${
                      dropIndex === index && dragIndex !== null && dragIndex !== index
                        ? 'border-t-2 border-blue-400'
                        : ''
                    }`}
                  >
                    <span className="cursor-grab text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 select-none text-[10px]">⠿</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLabel(label.id)
                        setOpen(false)
                      }}
                      className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                    >
                      {showDots && (
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: label.color }}
                        />
                      )}
                      <span className="flex-1 text-left truncate">{label.name}</span>
                    </button>
                    <span className="text-zinc-400 tabular-nums text-[10px]">{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeFavoriteLabel(label.id)}
                      className="text-zinc-300 hover:text-zinc-500 cursor-pointer"
                    >
                      <IconClose className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="border-t border-zinc-100 dark:border-zinc-800" />
            </>
          )}

          {/* Search + Sort */}
          <div className="p-1.5 space-y-1.5">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search labels..."
              className="w-full px-2 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
            <div className="flex gap-1">
              {(['default', 'az', 'za'] as const).map((order) => {
                const labelText = order === 'default' ? '#' : order === 'az' ? 'A-Z' : 'Z-A'
                return (
                  <button
                    key={order}
                    type="button"
                    onClick={() => setSortOrder(order)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      sortOrder === order
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {labelText}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Non-favorite label list */}
          <div className="max-h-64 overflow-y-auto py-1 border-t border-zinc-100 dark:border-zinc-800">
            {nonFavoriteLabels.length === 0 ? (
              <div className="px-3 py-2 text-xs text-zinc-400 dark:text-zinc-500">No labels found</div>
            ) : (
              nonFavoriteLabels.map((label) => {
                const shortcutIndex = favoriteLabelIds.length === 0
                  ? labels.indexOf(label)
                  : -1
                return (
                  <div
                    key={label.id}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                      label.id === activeLabelId
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLabel(label.id)
                        setOpen(false)
                      }}
                      className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                    >
                      {showDots && (
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: label.color }}
                        />
                      )}
                      <span className="flex-1 text-left truncate">{label.name}</span>
                    </button>
                    {shortcutIndex >= 0 && shortcutIndex < 9 && (
                      <span className="text-zinc-400 tabular-nums text-[10px]">{shortcutIndex + 1}</span>
                    )}
                    <button
                      type="button"
                      disabled={isFavoritesFull}
                      onClick={() => addFavoriteLabel(label.id)}
                      className={`${
                        isFavoritesFull
                          ? 'text-zinc-200 dark:text-zinc-700 cursor-not-allowed'
                          : 'text-zinc-300 dark:text-zinc-600 hover:text-amber-500 cursor-pointer'
                      }`}
                    >
                      <IconStar className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
