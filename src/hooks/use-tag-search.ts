import { useCallback, useEffect, useRef, useState } from 'react'
import type { Label, TagSearchFn } from '../types/labels'

interface UseTagSearchOptions {
  localLabels: Label[]
  onTagSearch?: TagSearchFn
  debounceMs?: number
}

export function useTagSearch({ localLabels, onTagSearch, debounceMs = 300 }: UseTagSearchOptions) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Label[]>(localLabels)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(
    async (q: string, p: number) => {
      if (onTagSearch) {
        setLoading(true)
        try {
          const result = await onTagSearch({ query: q, page: p, limit: 20 })
          setResults((prev) => (p === 1 ? result.labels : [...prev, ...result.labels]))
          setHasMore(result.hasMore)
        } finally {
          setLoading(false)
        }
      } else {
        const filtered = localLabels.filter((l) =>
          l.name.toLowerCase().includes(q.toLowerCase()),
        )
        setResults(filtered)
        setHasMore(false)
      }
    },
    [onTagSearch, localLabels],
  )

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setPage(1)
      search(query, 1)
    }, debounceMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, search, debounceMs])

  // Update results when localLabels change and no remote search
  useEffect(() => {
    if (!onTagSearch) {
      const filtered = localLabels.filter((l) =>
        l.name.toLowerCase().includes(query.toLowerCase()),
      )
      setResults(filtered)
    }
  }, [localLabels, onTagSearch, query])

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      const nextPage = page + 1
      setPage(nextPage)
      search(query, nextPage)
    }
  }, [hasMore, loading, page, query, search])

  return { query, setQuery, results, loading, hasMore, loadMore }
}
