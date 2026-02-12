import { useCallback, useRef, useState } from 'react'
import type { BoundingBox } from '../types/annotations'
import { normalizeBox, clampBox } from '../utils/geometry'

interface DrawingState {
  isDrawing: boolean
  startX: number
  startY: number
  currentBox: BoundingBox | null
}

interface UseCanvasDrawingOptions {
  zoom: number
  panX: number
  panY: number
  imageWidth: number
  imageHeight: number
  onDrawComplete: (box: BoundingBox) => void
}

export function useCanvasDrawing({
  zoom,
  panX,
  panY,
  imageWidth,
  imageHeight,
  onDrawComplete,
}: UseCanvasDrawingOptions) {
  const [currentBox, setCurrentBox] = useState<BoundingBox | null>(null)
  const drawingRef = useRef<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentBox: null,
  })

  const toImageCoords = useCallback(
    (clientX: number, clientY: number, rect: DOMRect) => {
      const canvasX = clientX - rect.left
      const canvasY = clientY - rect.top
      return {
        x: (canvasX - panX) / zoom,
        y: (canvasY - panY) / zoom,
      }
    },
    [zoom, panX, panY],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<Element>) => {
      if (e.button !== 0) return
      const rect = e.currentTarget.getBoundingClientRect()
      const { x, y } = toImageCoords(e.clientX, e.clientY, rect)

      drawingRef.current = {
        isDrawing: true,
        startX: x,
        startY: y,
        currentBox: null,
      }
      setCurrentBox(null)
    },
    [toImageCoords],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<Element>) => {
      if (!drawingRef.current.isDrawing) return
      const rect = e.currentTarget.getBoundingClientRect()
      const { x, y } = toImageCoords(e.clientX, e.clientY, rect)

      const box = normalizeBox(drawingRef.current.startX, drawingRef.current.startY, x, y)
      const clamped = clampBox(box, imageWidth, imageHeight)
      drawingRef.current.currentBox = clamped
      setCurrentBox(clamped)
    },
    [toImageCoords, imageWidth, imageHeight],
  )

  const handleMouseUp = useCallback(() => {
    if (!drawingRef.current.isDrawing) return
    drawingRef.current.isDrawing = false

    const box = drawingRef.current.currentBox
    if (box && box.width > 2 && box.height > 2) {
      onDrawComplete(box)
    }
    setCurrentBox(null)
  }, [onDrawComplete])

  return {
    currentBox,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
    },
    toImageCoords,
  }
}
