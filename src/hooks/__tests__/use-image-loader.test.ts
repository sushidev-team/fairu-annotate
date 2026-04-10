import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

let mockImages: any[] = []

beforeEach(() => {
  mockImages = []
  vi.stubGlobal(
    'Image',
    class {
      crossOrigin = ''
      src = ''
      naturalWidth = 100
      naturalHeight = 100
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      constructor() {
        mockImages.push(this)
      }
    },
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useImageLoader', () => {
  // Use a unique src per test to avoid module-level imageCache conflicts
  let testCounter = 0
  function uniqueSrc(prefix = 'test') {
    return `https://example.com/${prefix}-${++testCounter}-${Date.now()}.png`
  }

  // Re-import the module for each test group to get a fresh cache
  async function importHook() {
    // Dynamic import with cache-busting is not practical, so we rely on unique src values
    const mod = await import('../use-image-loader')
    return mod.useImageLoader
  }

  it('returns null image and loading=false when src is undefined', async () => {
    const useImageLoader = await importHook()
    const { result } = renderHook(() => useImageLoader(undefined))

    expect(result.current.image).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sets loading=true initially for a new src', async () => {
    const useImageLoader = await importHook()
    const src = uniqueSrc('loading')
    const { result } = renderHook(() => useImageLoader(src))

    // Before the image fires onload, loading should be true
    expect(result.current.loading).toBe(true)
    expect(result.current.image).toBeNull()
  })

  it('sets image on successful load', async () => {
    const useImageLoader = await importHook()
    const src = uniqueSrc('success')
    const { result } = renderHook(() => useImageLoader(src))

    expect(result.current.loading).toBe(true)

    // Simulate the image loading successfully
    await act(async () => {
      const img = mockImages[mockImages.length - 1]
      img.onload?.()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.image).not.toBeNull()
    expect(result.current.image!.naturalWidth).toBe(100)
    expect(result.current.image!.naturalHeight).toBe(100)
    expect(result.current.error).toBeNull()
  })

  it('sets error on failed load', async () => {
    const useImageLoader = await importHook()
    const src = uniqueSrc('error')
    const { result } = renderHook(() => useImageLoader(src))

    expect(result.current.loading).toBe(true)

    // Simulate the image failing to load
    await act(async () => {
      const img = mockImages[mockImages.length - 1]
      img.onerror?.()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.image).toBeNull()
    expect(result.current.error).toBe(`Failed to load image: ${src}`)
  })

  it('returns cached image immediately without loading', async () => {
    const useImageLoader = await importHook()
    const src = uniqueSrc('cached')

    // First render: load the image
    const { result: result1, unmount } = renderHook(() => useImageLoader(src))

    await act(async () => {
      const img = mockImages[mockImages.length - 1]
      img.onload?.()
    })

    expect(result1.current.image).not.toBeNull()
    unmount()

    // Second render with same src: should be cached
    const imageCountBefore = mockImages.length
    const { result: result2 } = renderHook(() => useImageLoader(src))

    // Should not create a new Image since it's cached
    expect(mockImages.length).toBe(imageCountBefore)
    expect(result2.current.image).not.toBeNull()
    expect(result2.current.loading).toBe(false)
    expect(result2.current.error).toBeNull()
  })

  it('handles src changes by loading the new image', async () => {
    const useImageLoader = await importHook()
    const src1 = uniqueSrc('change-1')
    const src2 = uniqueSrc('change-2')

    const { result, rerender } = renderHook(
      ({ src }: { src: string }) => useImageLoader(src),
      { initialProps: { src: src1 } },
    )

    // Load first image
    await act(async () => {
      const img = mockImages[mockImages.length - 1]
      img.onload?.()
    })

    expect(result.current.image).not.toBeNull()
    expect(result.current.loading).toBe(false)

    // Change src
    rerender({ src: src2 })

    expect(result.current.loading).toBe(true)

    // Load second image
    await act(async () => {
      const img = mockImages[mockImages.length - 1]
      img.onload?.()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.image).not.toBeNull()
  })
})
