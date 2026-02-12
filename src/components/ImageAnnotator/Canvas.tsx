import React, { useCallback, useEffect, useRef } from 'react'
import type { BoundingBox, PolygonPoint } from '../../types/annotations'
import { drawImage, drawCrosshair, drawDrawingBox, drawDrawingPolygon } from '../../utils/canvas-renderer'

interface CanvasProps {
  image: HTMLImageElement | null
  zoom: number
  panX: number
  panY: number
  drawingBox: BoundingBox | null
  drawingColor: string
  containerWidth: number
  containerHeight: number
  showCrosshair: boolean
  polygonPoints?: PolygonPoint[]
  polygonMousePos?: PolygonPoint | null
}

export function Canvas({
  image,
  zoom,
  panX,
  panY,
  drawingBox,
  drawingColor,
  containerWidth,
  containerHeight,
  showCrosshair,
  polygonPoints = [],
  polygonMousePos = null,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mousePos = useRef<{ x: number; y: number } | null>(null)

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, containerWidth, containerHeight)

    if (image) {
      drawImage(ctx, image, zoom, panX, panY)
    }

    if (drawingBox) {
      drawDrawingBox(ctx, drawingBox, drawingColor, zoom, panX, panY)
    }

    if (polygonPoints.length > 0) {
      drawDrawingPolygon(ctx, polygonPoints, polygonMousePos, drawingColor, zoom, panX, panY)
    }

    if (showCrosshair && mousePos.current) {
      drawCrosshair(ctx, mousePos.current.x, mousePos.current.y)
    }
  }, [image, zoom, panX, panY, drawingBox, drawingColor, showCrosshair, containerWidth, containerHeight, dpr, polygonPoints, polygonMousePos])

  useEffect(() => {
    render()
  }, [render])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      mousePos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      if (showCrosshair) render()
    },
    [showCrosshair, render],
  )

  const handleMouseLeave = useCallback(() => {
    mousePos.current = null
    if (showCrosshair) render()
  }, [showCrosshair, render])

  return (
    <canvas
      ref={canvasRef}
      width={containerWidth * dpr}
      height={containerHeight * dpr}
      className="absolute inset-0"
      style={{
        width: containerWidth,
        height: containerHeight,
        imageRendering: zoom > 2 ? 'pixelated' : 'auto',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  )
}
