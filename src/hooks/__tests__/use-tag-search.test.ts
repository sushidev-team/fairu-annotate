import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTagSearch } from '../use-tag-search'
import type { Label, TagSearchFn } from '../../types/labels'

const sampleLabels: Label[] = [
  { id: '1', name: 'Cat', color: '#ff0000', classId: 0 },
  { id: '2', name: 'Dog', color: '#00ff00', classId: 1 },
  { id: '3', name: 'Catfish', color: '#0000ff', classId: 2 },
  { id: '4', name: 'Bird', color: '#ffff00', classId: 3 },
]

describe('useTagSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initial results equal localLabels', async () => {
    const { result } = renderHook(() =>
      useTagSearch({ localLabels: sampleLabels }),
    )

    // Allow the debounced initial search to fire
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current.results).toEqual(sampleLabels)
    expect(result.current.query).toBe('')
    expect(result.current.loading).toBe(false)
    expect(result.current.hasMore).toBe(false)
  })

  it('setQuery filters localLabels locally', async () => {
    const { result } = renderHook(() =>
      useTagSearch({ localLabels: sampleLabels }),
    )

    // Let initial debounce fire
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    // Set a query
    act(() => {
      result.current.setQuery('dog')
    })

    // Advance past debounce
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current.results).toEqual([
      { id: '2', name: 'Dog', color: '#00ff00', classId: 1 },
    ])
  })

  it('filters case-insensitively', async () => {
    const { result } = renderHook(() =>
      useTagSearch({ localLabels: sampleLabels }),
    )

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    act(() => {
      result.current.setQuery('CAT')
    })

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current.results).toHaveLength(2)
    expect(result.current.results.map((r) => r.name)).toContain('Cat')
    expect(result.current.results.map((r) => r.name)).toContain('Catfish')
  })

  it('calls remote search after debounce when onTagSearch is provided', async () => {
    const remoteLabels: Label[] = [
      { id: '10', name: 'Remote Cat', color: '#aaa', classId: 10 },
    ]
    const onTagSearch: TagSearchFn = vi.fn().mockResolvedValue({
      labels: remoteLabels,
      total: 1,
      hasMore: false,
    })

    const { result } = renderHook(() =>
      useTagSearch({ localLabels: sampleLabels, onTagSearch }),
    )

    // Initial debounce fires the search
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    // The remote search should have been called with the initial empty query
    expect(onTagSearch).toHaveBeenCalledWith({ query: '', page: 1, limit: 20 })

    // Set a query
    act(() => {
      result.current.setQuery('cat')
    })

    // Before debounce, remote should not have been called again
    expect(onTagSearch).toHaveBeenCalledTimes(1)

    // Advance past debounce
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(onTagSearch).toHaveBeenCalledTimes(2)
    expect(onTagSearch).toHaveBeenCalledWith({ query: 'cat', page: 1, limit: 20 })
    expect(result.current.results).toEqual(remoteLabels)
  })

  it('loadMore appends results for remote search', async () => {
    const page1Labels: Label[] = [
      { id: '10', name: 'Result 1', color: '#aaa', classId: 10 },
    ]
    const page2Labels: Label[] = [
      { id: '11', name: 'Result 2', color: '#bbb', classId: 11 },
    ]

    const onTagSearch: TagSearchFn = vi
      .fn()
      .mockResolvedValueOnce({
        labels: page1Labels,
        total: 2,
        hasMore: true,
      })
      .mockResolvedValueOnce({
        labels: page2Labels,
        total: 2,
        hasMore: false,
      })

    const { result } = renderHook(() =>
      useTagSearch({ localLabels: sampleLabels, onTagSearch }),
    )

    // Initial search
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current.results).toEqual(page1Labels)
    expect(result.current.hasMore).toBe(true)

    // Load more
    await act(async () => {
      result.current.loadMore()
    })

    expect(onTagSearch).toHaveBeenCalledWith({ query: '', page: 2, limit: 20 })
    expect(result.current.results).toEqual([...page1Labels, ...page2Labels])
    expect(result.current.hasMore).toBe(false)
  })

  it('shows loading state during remote search', async () => {
    let resolveSearch!: (value: any) => void
    const onTagSearch: TagSearchFn = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSearch = resolve
        }),
    )

    const { result } = renderHook(() =>
      useTagSearch({ localLabels: sampleLabels, onTagSearch }),
    )

    // Fire the debounced search
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    // Should be loading while the promise is pending
    expect(result.current.loading).toBe(true)

    // Resolve the search
    await act(async () => {
      resolveSearch({ labels: [], total: 0, hasMore: false })
    })

    expect(result.current.loading).toBe(false)
  })

  it('updates results when localLabels change without remote search', async () => {
    const { result, rerender } = renderHook(
      ({ labels }: { labels: Label[] }) =>
        useTagSearch({ localLabels: labels }),
      { initialProps: { labels: sampleLabels } },
    )

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current.results).toEqual(sampleLabels)

    // Change localLabels
    const newLabels: Label[] = [
      { id: '5', name: 'Elephant', color: '#purple', classId: 5 },
    ]

    rerender({ labels: newLabels })

    // The effect updates results immediately for local-only mode
    expect(result.current.results).toEqual(newLabels)
  })

  it('respects custom debounceMs', async () => {
    const onTagSearch: TagSearchFn = vi.fn().mockResolvedValue({
      labels: [],
      total: 0,
      hasMore: false,
    })

    renderHook(() =>
      useTagSearch({ localLabels: sampleLabels, onTagSearch, debounceMs: 500 }),
    )

    // At 300ms the default would fire, but our custom is 500ms
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(onTagSearch).not.toHaveBeenCalled()

    // At 500ms it should fire
    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    expect(onTagSearch).toHaveBeenCalledTimes(1)
  })

  it('debounces rapid query changes', async () => {
    const { result } = renderHook(() =>
      useTagSearch({ localLabels: sampleLabels }),
    )

    // Fire initial debounce
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    // Rapidly change query multiple times
    act(() => {
      result.current.setQuery('c')
    })
    act(() => {
      result.current.setQuery('ca')
    })
    act(() => {
      result.current.setQuery('cat')
    })

    // Before debounce, results should not have changed from the last setQuery effect
    // (the localLabels effect runs immediately for local mode, but the timer-based
    // search also runs)
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current.results).toHaveLength(2) // Cat and Catfish
    expect(result.current.query).toBe('cat')
  })
})
