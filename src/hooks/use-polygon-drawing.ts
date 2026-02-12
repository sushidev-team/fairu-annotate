import { useCallback, useRef, useState } from 'react'
import type { PolygonPoint, BoundingBox } from '../types/annotations'
import { polygonBounds } from '../utils/geometry'

const CLOSE_THRESHOLD = 12 // pixels distance to snap-close polygon

interface UsePolygonDrawingOptions {
  zoom: number
  panX: number
  panY: number
  imageWidth: number
  imageHeight: number
  onDrawComplete: (points: PolygonPoint[], bounds: BoundingBox) => void
}

export function usePolygonDrawing({
  zoom,
  panX,
  panY,
  imageWidth,
  imageHeight,
  onDrawComplete,
}: UsePolygonDrawingOptions) {
  const [points, setPoints] = useState<PolygonPoint[]>([])
  const [mousePos, setMousePos] = useState<PolygonPoint | null>(null)
  const isDrawingRef = useRef(false)

  const toImageCoords = useCallback(
    (clientX: number, clientY: number, rect: DOMRect): PolygonPoint => {
      const canvasX = clientX - rect.left
      const canvasY = clientY - rect.top
      return {
        x: Math.max(0, Math.min(imageWidth, (canvasX - panX) / zoom)),
        y: Math.max(0, Math.min(imageHeight, (canvasY - panY) / zoom)),
      }
    },
    [zoom, panX, panY, imageWidth, imageHeight],
  )

  const distancePx = useCallback(
    (a: PolygonPoint, b: PolygonPoint): number => {
      const dx = (a.x - b.x) * zoom
      const dy = (a.y - b.y) * zoom
      return Math.sqrt(dx * dx + dy * dy)
    },
    [zoom],
  )

  const finishPolygon = useCallback(
    (pts: PolygonPoint[]) => {
      if (pts.length >= 3) {
        const bounds = polygonBounds(pts)
        onDrawComplete(pts, bounds)
      }
      setPoints([])
      setMousePos(null)
      isDrawingRef.current = false
    },
    [onDrawComplete],
  )

  const handleClick = useCallback(
    (e: React.MouseEvent<Element>) => {
      if (e.button !== 0) return
      const rect = e.currentTarget.getBoundingClientRect()
      const pt = toImageCoords(e.clientX, e.clientY, rect)

      // If we have 3+ points and click near the first point, close the polygon
      if (points.length >= 3 && distancePx(pt, points[0]) < CLOSE_THRESHOLD) {
        finishPolygon(points)
        return
      }

      isDrawingRef.current = true
      setPoints((prev) => [...prev, pt])
    },
    [toImageCoords, points, distancePx, finishPolygon],
  )

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<Element>) => {
      e.preventDefault()
      // Finish polygon on double-click (don't add the double-click point again)
      if (points.length >= 3) {
        finishPolygon(points)
      }
    },
    [points, finishPolygon],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<Element>) => {
      if (points.length === 0) return
      const rect = e.currentTarget.getBoundingClientRect()
      const pt = toImageCoords(e.clientX, e.clientY, rect)
      setMousePos(pt)
    },
    [points.length, toImageCoords],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Cancel polygon drawing
        setPoints([])
        setMousePos(null)
        isDrawingRef.current = false
      } else if (e.key === 'Enter' && points.length >= 3) {
        // Finish with Enter
        finishPolygon(points)
      }
    },
    [points, finishPolygon],
  )

  const cancel = useCallback(() => {
    setPoints([])
    setMousePos(null)
    isDrawingRef.current = false
  }, [])

  return {
    points,
    mousePos,
    isDrawing: points.length > 0,
    handlers: {
      onClick: handleClick,
      onDoubleClick: handleDoubleClick,
      onMouseMove: handleMouseMove,
    },
    handleKeyDown,
    cancel,
  }
}
