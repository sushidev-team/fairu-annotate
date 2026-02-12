import React, { useState } from 'react'
import type { Label, TagSearchFn, TagCreateFn, TagDeleteFn } from '../../types/labels'
import { useUIStore } from '../../stores/provider'
import { useTagSearch } from '../../hooks/use-tag-search'
import { TagSearchInput } from './TagSearchInput'
import { TagList } from './TagList'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { IconPlus } from '../common/Icons'

interface TagManagerProps {
  labels: Label[]
  onTagSearch?: TagSearchFn
  onTagCreate?: TagCreateFn
  onTagDelete?: TagDeleteFn
  className?: string
}

const PRESET_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']

export function TagManager({ labels, onTagSearch, onTagCreate, onTagDelete, className = '' }: TagManagerProps) {
  const activeLabelId = useUIStore((s) => s.activeLabelId)
  const setActiveLabel = useUIStore((s) => s.setActiveLabel)
  const { query, setQuery, results, loading } = useTagSearch({ localLabels: labels, onTagSearch })
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])

  const handleCreate = async () => {
    if (!newName.trim() || !onTagCreate) return
    await onTagCreate(newName.trim(), newColor)
    setNewName('')
    setShowCreate(false)
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
        Labels
      </div>
      <TagSearchInput value={query} onChange={setQuery} loading={loading} />
      <TagList
        labels={results}
        activeLabelId={activeLabelId}
        onSelect={setActiveLabel}
        onDelete={onTagDelete}
      />
      {onTagCreate && (
        <>
          {showCreate ? (
            <fieldset className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <legend className="px-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                New Label
              </legend>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Name
                </label>
                <Input
                  placeholder="e.g. Cat, Person, Vehicle..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Color
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      className={`h-6 w-6 rounded-full ring-2 ring-offset-2 transition-transform focus:outline-none focus-visible:ring-blue-500 dark:ring-offset-zinc-900 ${
                        newColor === c ? 'ring-zinc-900 dark:ring-zinc-100 scale-110' : 'ring-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                      onClick={() => setNewColor(c)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" onClick={handleCreate} disabled={!newName.trim()}>
                  Create
                </Button>
              </div>
            </fieldset>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setShowCreate(true)}>
              <IconPlus className="w-3.5 h-3.5" />
              Add Label
            </Button>
          )}
        </>
      )}
    </div>
  )
}
