import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePolygonDrawing } from '../use-polygon-drawing'
import type { PolygonPoint, BoundingBox } from '../../types/annotations'

function createOptions(overrides?: Partial<Parameters<typeof usePolygonDrawing>[0]>) {
  return {
    zoom: 1,
    panX: 0,
    panY: 0,
    imageWidth: 800,
    imageHeight: 600,
    onDrawComplete: vi.fn(),
    ...overrides,
  }
}

function makeMouseEvent(
  clientX: number,
  clientY: number,
  button = 0,
): React.MouseEvent<Element> {
  return {
    button,
    clientX,
    clientY,
    preventDefault: vi.fn(),
    currentTarget: {
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        right: 800,
        bottom: 600,
        width: 800,
        height: 600,
        x: 0,
        y: 0,
        toJSON: () => {},
      }),
    },
  } as unknown as React.MouseEvent<Element>
}

describe('usePolygonDrawing', () => {
  it('starts with no points and isDrawing false', () => {
    const { result } = renderHook(() => usePolygonDrawing(createOptions()))
    expect(result.current.points).toEqual([])
    expect(result.current.isDrawing).toBe(false)
    expect(result.current.mousePos).toBeNull()
  })

  it('adds a point on click', () => {
    const { result } = renderHook(() => usePolygonDrawing(createOptions()))

    act(() => {
      result.current.handlers.onClick(makeMouseEvent(100, 100))
    })

    expect(result.current.points).toHaveLength(1)
    expect(result.current.isDrawing).toBe(true)
  })

  it('adds multiple points on successive clicks', () => {
    const { result } = renderHook(() => usePolygonDrawing(createOptions()))

    act(() => {
      result.current.handlers.onClick(makeMouseEvent(100, 100))
    })
    act(() => {
      result.current.handlers.onClick(makeMouseEvent(200, 100))
    })
    act(() => {
      result.current.handlers.onClick(makeMouseEvent(200, 200))
    })

    expect(result.current.points).toHaveLength(3)
  })

  it('ignores non-left-button clicks', () => {
    const { result } = renderHook(() => usePolygonDrawing(createOptions()))

    act(() => {
      result.current.handlers.onClick(makeMouseEvent(100, 100, 2)) // right click
    })

    expect(result.current.points).toHaveLength(0)
  })

  it('tracks mouse position during drawing', () => {
    const { result } = renderHook(() => usePolygonDrawing(createOptions()))

    // No tracking when no points
    act(() => {
      result.current.handlers.onMouseMove(makeMouseEvent(50, 50))
    })
    expect(result.current.mousePos).toBeNull()

    // Start drawing
    act(() => {
      result.current.handlers.onClick(makeMouseEvent(100, 100))
    })

    // Now mouse pos is tracked
    act(() => {
      result.current.handlers.onMouseMove(makeMouseEvent(150, 150))
    })
    expect(result.current.mousePos).not.toBeNull()
  })

  it('finishes polygon on double-click with 3+ points', () => {
    const onDrawComplete = vi.fn()
    const { result } = renderHook(() => usePolygonDrawing(createOptions({ onDrawComplete })))

    // Add 3 points
    act(() => {
      result.current.handlers.onClick(makeMouseEvent(100, 100))
    })
    act(() => {
      result.current.handlers.onClick(makeMouseEvent(200, 100))
    })
    act(() => {
      result.current.handlers.onClick(makeMouseEvent(200, 200))
    })

    expect(result.current.points).toHaveLength(3)

    // Double-click to finish
    act(() => {
      result.current.handlers.onDoubleClick(makeMouseEvent(200, 200))
    })

    expect(onDrawComplete).toHaveBeenCalledTimes(1)
    const [points, bounds] = onDrawComplete.mock.calls[0]
    expect(points).toHaveLength(3)
    expect(bounds).toHaveProperty('x')
    expect(bounds).toHaveProperty('y')
    expect(bounds).toHaveProperty('width')
    expect(bounds).toHaveProperty('height')
    expect(result.current.points).toEqual([])
    expect(result.current.isDrawing).toBe(false)
  })

  it('does not finish polygon on double-click with fewer than 3 points', () => {
    const onDrawComplete = vi.fn()
    const { result } = renderHook(() => usePolygonDrawing(createOptions({ onDrawComplete })))

    act(() => {
      result.current.handlers.onClick(makeMouseEvent(100, 100))
    })
    act(() => {
      result.current.handlers.onClick(makeMouseEvent(200, 100))
    })

    act(() => {
      result.current.handlers.onDoubleClick(makeMouseEvent(200, 200))
    })

    expect(onDrawComplete).not.toHaveBeenCalled()
    // Points remain
    expect(result.current.points).toHaveLength(2)
  })

  it('finishes polygon via Enter key with 3+ points', () => {
    const onDrawComplete = vi.fn()
    const { result } = renderHook(() => usePolygonDrawing(createOptions({ onDrawComplete })))

    act(() => {
      result.current.handlers.onClick(makeMouseEvent(100, 100))
    })
    act(() => {
      result.current.handlers.onClick(makeMouseEvent(200, 100))
    })
    act(() => {
      result.current.handlers.onClick(makeMouseEvent(200, 200))
    })

    act(() => {
      result.current.handleKeyDown({ key: 'Enter' } as KeyboardEvent)
    })

    expect(onDrawComplete).toHaveBeenCalledTimes(1)
    expect(result.current.points).toEqual([])
  })

  it('cancels polygon drawing on Escape', () => {
    const onDrawComplete = vi.fn()
    const { result } = renderHook(() => usePolygonDrawing(createOptions({ onDrawComplete })))

    act(() => {
      result.current.handlers.onClick(makeMouseEvent(100, 100))
    })
    act(() => {
      result.current.handlers.onClick(makeMouseEvent(200, 100))
    })

    act(() => {
      result.current.handleKeyDown({ key: 'Escape' } as KeyboardEvent)
    })

    expect(onDrawComplete).not.toHaveBeenCalled()
    expect(result.current.points).toEqual([])
    expect(result.current.isDrawing).toBe(false)
  })

  it('cancels via cancel() method', () => {
    const { result } = renderHook(() => usePolygonDrawing(createOptions()))

    act(() => {
      result.current.handlers.onClick(makeMouseEvent(100, 100))
    })
    act(() => {
      result.current.handlers.onClick(makeMouseEvent(200, 100))
    })

    act(() => {
      result.current.cancel()
    })

    expect(result.current.points).toEqual([])
    expect(result.current.isDrawing).toBe(false)
  })

  it('snap-closes polygon when clicking near first point', () => {
    const onDrawComplete = vi.fn()
    const { result } = renderHook(() => usePolygonDrawing(createOptions({ onDrawComplete })))

    // Add 3 points
    act(() => {
      result.current.handlers.onClick(makeMouseEvent(100, 100))
    })
    act(() => {
      result.current.handlers.onClick(makeMouseEvent(200, 100))
    })
    act(() => {
      result.current.handlers.onClick(makeMouseEvent(200, 200))
    })

    // Click near the first point (within 12px threshold)
    act(() => {
      result.current.handlers.onClick(makeMouseEvent(105, 105))
    })

    expect(onDrawComplete).toHaveBeenCalledTimes(1)
    expect(result.current.points).toEqual([])
  })

  it('clamps points to image bounds', () => {
    const { result } = renderHook(() =>
      usePolygonDrawing(createOptions({ imageWidth: 400, imageHeight: 300 })),
    )

    // Click beyond image bounds
    act(() => {
      result.current.handlers.onClick(makeMouseEvent(500, 400))
    })

    const pt = result.current.points[0]
    expect(pt.x).toBeLessThanOrEqual(400)
    expect(pt.y).toBeLessThanOrEqual(300)
  })

  it('does not finish Enter with fewer than 3 points', () => {
    const onDrawComplete = vi.fn()
    const { result } = renderHook(() => usePolygonDrawing(createOptions({ onDrawComplete })))

    act(() => {
      result.current.handlers.onClick(makeMouseEvent(100, 100))
    })

    act(() => {
      result.current.handleKeyDown({ key: 'Enter' } as KeyboardEvent)
    })

    expect(onDrawComplete).not.toHaveBeenCalled()
    expect(result.current.points).toHaveLength(1)
  })
})
