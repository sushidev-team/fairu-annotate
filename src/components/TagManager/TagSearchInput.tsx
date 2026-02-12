import React from 'react'
import { Input } from '../common/Input'
import { IconSearch } from '../common/Icons'

interface TagSearchInputProps {
  value: string
  onChange: (value: string) => void
  loading?: boolean
  className?: string
}

export function TagSearchInput({ value, onChange, loading, className = '' }: TagSearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
        <IconSearch className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
      </div>
      <Input
        type="text"
        placeholder="Search labels..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8"
      />
      {loading && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500 dark:border-zinc-600 dark:border-t-blue-400" />
        </div>
      )}
    </div>
  )
}
