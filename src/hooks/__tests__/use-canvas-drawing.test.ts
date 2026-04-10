import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCanvasDrawing } from '../use-canvas-drawing'

function createOptions(overrides?: Partial<Parameters<typeof useCanvasDrawing>[0]>) {
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

describe('useCanvasDrawing', () => {
  describe('toImageCoords', () => {
    it('converts client coords to image coords with default zoom and pan', () => {
      const { result } = renderHook(() => useCanvasDrawing(createOptions()))
      const rect = { left: 0, top: 0 } as DOMRect

      const coords = result.current.toImageCoords(100, 200, rect)
      expect(coords.x).toBe(100)
      expect(coords.y).toBe(200)
    })

    it('accounts for zoom', () => {
      const { result } = renderHook(() =>
        useCanvasDrawing(createOptions({ zoom: 2 })),
      )
      const rect = { left: 0, top: 0 } as DOMRect

      const coords = result.current.toImageCoords(200, 400, rect)
      expect(coords.x).toBe(100)
      expect(coords.y).toBe(200)
    })

    it('accounts for pan offsets', () => {
      const { result } = renderHook(() =>
        useCanvasDrawing(createOptions({ panX: 50, panY: 100 })),
      )
      const rect = { left: 0, top: 0 } as DOMRect

      const coords = result.current.toImageCoords(150, 300, rect)
      expect(coords.x).toBe(100)
      expect(coords.y).toBe(200)
    })

    it('accounts for rect offset', () => {
      const { result } = renderHook(() => useCanvasDrawing(createOptions()))
      const rect = { left: 10, top: 20 } as DOMRect

      const coords = result.current.toImageCoords(110, 220, rect)
      expect(coords.x).toBe(100)
      expect(coords.y).toBe(200)
    })

    it('combines zoom, pan, and rect offset', () => {
      const { result } = renderHook(() =>
        useCanvasDrawing(createOptions({ zoom: 2, panX: 10, panY: 20 })),
      )
      const rect = { left: 5, top: 5 } as DOMRect

      // canvasX = 105 - 5 = 100, imageX = (100 - 10) / 2 = 45
      // canvasY = 225 - 5 = 220, imageY = (220 - 20) / 2 = 100
      const coords = result.current.toImageCoords(105, 225, rect)
      expect(coords.x).toBe(45)
      expect(coords.y).toBe(100)
    })
  })

  describe('mouse down', () => {
    it('only starts drawing on left button (button === 0)', () => {
      const { result } = renderHook(() => useCanvasDrawing(createOptions()))

      act(() => {
        result.current.handlers.onMouseDown(makeMouseEvent(100, 100, 0))
      })

      // Now move to create a box, confirming drawing started
      act(() => {
        result.current.handlers.onMouseMove(makeMouseEvent(200, 200))
      })

      expect(result.current.currentBox).not.toBeNull()
    })

    it('ignores right button click', () => {
      const { result } = renderHook(() => useCanvasDrawing(createOptions()))

      act(() => {
        result.current.handlers.onMouseDown(makeMouseEvent(100, 100, 2))
      })

      act(() => {
        result.current.handlers.onMouseMove(makeMouseEvent(200, 200))
      })

      expect(result.current.currentBox).toBeNull()
    })

    it('ignores middle button click', () => {
      const { result } = renderHook(() => useCanvasDrawing(createOptions()))

      act(() => {
        result.current.handlers.onMouseDown(makeMouseEvent(100, 100, 1))
      })

      act(() => {
        result.current.handlers.onMouseMove(makeMouseEvent(200, 200))
      })

      expect(result.current.currentBox).toBeNull()
    })
  })

  describe('drawing creates a box', () => {
    it('creates a normalized box during mouse move', () => {
      const { result } = renderHook(() => useCanvasDrawing(createOptions()))

      act(() => {
        result.current.handlers.onMouseDown(makeMouseEvent(100, 100))
      })

      act(() => {
        result.current.handlers.onMouseMove(makeMouseEvent(200, 250))
      })

      expect(result.current.currentBox).toEqual({
        x: 100,
        y: 100,
        width: 100,
        height: 150,
      })
    })

    it('normalizes box when drawing right-to-left', () => {
      const { result } = renderHook(() => useCanvasDrawing(createOptions()))

      act(() => {
        result.current.handlers.onMouseDown(makeMouseEvent(300, 300))
      })

      act(() => {
        result.current.handlers.onMouseMove(makeMouseEvent(100, 100))
      })

      expect(result.current.currentBox).toEqual({
        x: 100,
        y: 100,
        width: 200,
        height: 200,
      })
    })
  })

  describe('box clamping to image bounds', () => {
    it('clamps box that exceeds image width', () => {
      const { result } = renderHook(() =>
        useCanvasDrawing(createOptions({ imageWidth: 400, imageHeight: 300 })),
      )

      act(() => {
        result.current.handlers.onMouseDown(makeMouseEvent(350, 50))
      })

      act(() => {
        result.current.handlers.onMouseMove(makeMouseEvent(500, 200))
      })

      const box = result.current.currentBox!
      expect(box.x + box.width).toBeLessThanOrEqual(400)
    })

    it('clamps box that exceeds image height', () => {
      const { result } = renderHook(() =>
        useCanvasDrawing(createOptions({ imageWidth: 400, imageHeight: 300 })),
      )

      act(() => {
        result.current.handlers.onMouseDown(makeMouseEvent(50, 250))
      })

      act(() => {
        result.current.handlers.onMouseMove(makeMouseEvent(200, 400))
      })

      const box = result.current.currentBox!
      expect(box.y + box.height).toBeLessThanOrEqual(300)
    })

    it('clamps negative coordinates to zero', () => {
      const { result } = renderHook(() =>
        useCanvasDrawing(createOptions({ imageWidth: 400, imageHeight: 300 })),
      )

      act(() => {
        result.current.handlers.onMouseDown(makeMouseEvent(50, 50))
      })

      act(() => {
        result.current.handlers.onMouseMove(makeMouseEvent(-50, -50))
      })

      const box = result.current.currentBox!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.y).toBeGreaterThanOrEqual(0)
    })
  })

  describe('mouse up', () => {
    it('does not call onDrawComplete for small box (<= 2px)', () => {
      const onDrawComplete = vi.fn()
      const { result } = renderHook(() =>
        useCanvasDrawing(createOptions({ onDrawComplete })),
      )

      act(() => {
        result.current.handlers.onMouseDown(makeMouseEvent(100, 100))
      })

      act(() => {
        result.current.handlers.onMouseMove(makeMouseEvent(101, 101))
      })

      act(() => {
        result.current.handlers.onMouseUp()
      })

      expect(onDrawComplete).not.toHaveBeenCalled()
    })

    it('does not call onDrawComplete when width <= 2', () => {
      const onDrawComplete = vi.fn()
      const { result } = renderHook(() =>
        useCanvasDrawing(createOptions({ onDrawComplete })),
      )

      act(() => {
        result.current.handlers.onMouseDown(makeMouseEvent(100, 100))
      })

      act(() => {
        result.current.handlers.onMouseMove(makeMouseEvent(102, 200))
      })

      act(() => {
        result.current.handlers.onMouseUp()
      })

      expect(onDrawComplete).not.toHaveBeenCalled()
    })

    it('calls onDrawComplete for valid box (> 2x2)', () => {
      const onDrawComplete = vi.fn()
      const { result } = renderHook(() =>
        useCanvasDrawing(createOptions({ onDrawComplete })),
      )

      act(() => {
        result.current.handlers.onMouseDown(makeMouseEvent(100, 100))
      })

      act(() => {
        result.current.handlers.onMouseMove(makeMouseEvent(200, 200))
      })

      act(() => {
        result.current.handlers.onMouseUp()
      })

      expect(onDrawComplete).toHaveBeenCalledTimes(1)
      expect(onDrawComplete).toHaveBeenCalledWith({
        x: 100,
        y: 100,
        width: 100,
        height: 100,
      })
    })

    it('clears currentBox after mouse up', () => {
      const { result } = renderHook(() => useCanvasDrawing(createOptions()))

      act(() => {
        result.current.handlers.onMouseDown(makeMouseEvent(100, 100))
      })

      act(() => {
        result.current.handlers.onMouseMove(makeMouseEvent(200, 200))
      })

      expect(result.current.currentBox).not.toBeNull()

      act(() => {
        result.current.handlers.onMouseUp()
      })

      expect(result.current.currentBox).toBeNull()
    })
  })

  describe('mouse move without mouse down', () => {
    it('does nothing when not drawing', () => {
      const { result } = renderHook(() => useCanvasDrawing(createOptions()))

      act(() => {
        result.current.handlers.onMouseMove(makeMouseEvent(200, 200))
      })

      expect(result.current.currentBox).toBeNull()
    })
  })

  describe('mouse leave', () => {
    it('acts as mouse up and completes valid box', () => {
      const onDrawComplete = vi.fn()
      const { result } = renderHook(() =>
        useCanvasDrawing(createOptions({ onDrawComplete })),
      )

      act(() => {
        result.current.handlers.onMouseDown(makeMouseEvent(100, 100))
      })

      act(() => {
        result.current.handlers.onMouseMove(makeMouseEvent(200, 200))
      })

      act(() => {
        result.current.handlers.onMouseLeave()
      })

      expect(onDrawComplete).toHaveBeenCalledTimes(1)
      expect(result.current.currentBox).toBeNull()
    })

    it('acts as mouse up and discards small box', () => {
      const onDrawComplete = vi.fn()
      const { result } = renderHook(() =>
        useCanvasDrawing(createOptions({ onDrawComplete })),
      )

      act(() => {
        result.current.handlers.onMouseDown(makeMouseEvent(100, 100))
      })

      act(() => {
        result.current.handlers.onMouseMove(makeMouseEvent(101, 101))
      })

      act(() => {
        result.current.handlers.onMouseLeave()
      })

      expect(onDrawComplete).not.toHaveBeenCalled()
      expect(result.current.currentBox).toBeNull()
    })
  })
})
