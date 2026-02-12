import React, { useCallback, useRef, useState } from 'react'
import type { Annotation, BoundingBox } from '../../types/annotations'
import type { Label } from '../../types/labels'
import { getResizeHandle, applyResize, moveBox, type ResizeHandle } from '../../utils/geometry'

interface BoundingBoxOverlayProps {
  annotations: Annotation[]
  labels: Label[]
  selectedId: string | null
  zoom: number
  panX: number
  panY: number
  onSelect: (id: string | null) => void
  onUpdate: (id: string, imageId: string, box: BoundingBox) => void
  tool: string
  locked?: boolean
}

const HANDLE_SIZE = 8

export function BoundingBoxOverlay({
  annotations,
  labels,
  selectedId,
  zoom,
  panX,
  panY,
  onSelect,
  onUpdate,
  tool,
  locked = false,
}: BoundingBoxOverlayProps) {
  const labelMap = new Map(labels.map((l) => [l.id, l]))
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<{
    annotationId: string
    imageId: string
    type: 'move' | ResizeHandle
    startX: number
    startY: number
    originalBox: BoundingBox
  } | null>(null)

  const toImageCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return { x: 0, y: 0 }
      const rect = svgRef.current.getBoundingClientRect()
      return {
        x: (clientX - rect.left - panX) / zoom,
        y: (clientY - rect.top - panY) / zoom,
      }
    },
    [zoom, panX, panY],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, annotation: Annotation) => {
      if (tool !== 'select' || locked) return
      e.stopPropagation()

      onSelect(annotation.id)
      const { x, y } = toImageCoords(e.clientX, e.clientY)

      const handle = getResizeHandle(x, y, annotation.box, HANDLE_SIZE / zoom)
      setDragging({
        annotationId: annotation.id,
        imageId: annotation.imageId,
        type: handle ?? 'move',
        startX: x,
        startY: y,
        originalBox: { ...annotation.box },
      })
    },
    [tool, locked, toImageCoords, zoom, onSelect],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return
      const { x, y } = toImageCoords(e.clientX, e.clientY)
      const dx = x - dragging.startX
      const dy = y - dragging.startY

      let newBox: BoundingBox
      if (dragging.type === 'move') {
        newBox = moveBox(dragging.originalBox, dx, dy)
      } else {
        newBox = applyResize(dragging.originalBox, dragging.type, dx, dy)
      }
      onUpdate(dragging.annotationId, dragging.imageId, newBox)
    },
    [dragging, toImageCoords, onUpdate],
  )

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === svgRef.current && tool === 'select') {
        onSelect(null)
      }
    },
    [tool, onSelect],
  )

  const cursorForHandle = (handle: ResizeHandle | 'move'): string => {
    const map: Record<string, string> = {
      nw: 'nwse-resize',
      se: 'nwse-resize',
      ne: 'nesw-resize',
      sw: 'nesw-resize',
      n: 'ns-resize',
      s: 'ns-resize',
      e: 'ew-resize',
      w: 'ew-resize',
      move: 'move',
    }
    return map[handle] ?? 'default'
  }

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full"
      style={{
        pointerEvents: tool === 'select' && !locked ? 'auto' : 'none',
        cursor: dragging ? cursorForHandle(dragging.type) : tool === 'select' && !locked ? 'default' : 'none',
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleBackgroundClick}
    >
      <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
        {annotations.map((a) => {
          const label = labelMap.get(a.labelId)
          const color = label?.color ?? '#999'
          const isSelected = a.id === selectedId

          const isPolygon = a.type === 'polygon' && a.polygon && a.polygon.length >= 3

          // Polygon label position: top of bounding box
          const labelX = isPolygon ? a.box.x + 3 / zoom : a.box.x + 3 / zoom
          const labelY = isPolygon ? a.box.y - 4 / zoom : a.box.y - 4 / zoom

          return (
            <g key={a.id} onMouseDown={(e) => handleMouseDown(e, a)}>
              {isPolygon ? (
                <>
                  {/* Polygon fill + stroke */}
                  <polygon
                    points={a.polygon!.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill={color}
                    fillOpacity={isSelected ? 0.2 : 0.1}
                    stroke={color}
                    strokeWidth={isSelected ? 2.5 / zoom : 1.5 / zoom}
                    strokeLinejoin="round"
                    style={{ cursor: tool === 'select' ? 'move' : 'default' }}
                  />
                  {/* Vertex dots when selected and not locked */}
                  {isSelected && tool === 'select' && !locked &&
                    a.polygon!.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={3.5 / zoom}
                        fill="white"
                        stroke={color}
                        strokeWidth={1.5 / zoom}
                      />
                    ))}
                </>
              ) : (
                <>
                  {/* Box fill */}
                  <rect
                    x={a.box.x}
                    y={a.box.y}
                    width={a.box.width}
                    height={a.box.height}
                    fill={color}
                    fillOpacity={isSelected ? 0.2 : 0.1}
                    stroke={color}
                    strokeWidth={isSelected ? 2.5 / zoom : 1.5 / zoom}
                    style={{ cursor: tool === 'select' ? 'move' : 'default' }}
                  />
                  {/* Resize handles (only when selected and not locked) */}
                  {isSelected && tool === 'select' && !locked && (
                    <>
                      {(['nw', 'ne', 'sw', 'se'] as ResizeHandle[]).map((handle) => {
                        const hx =
                          handle.includes('w') ? a.box.x : a.box.x + a.box.width
                        const hy =
                          handle.includes('n') ? a.box.y : a.box.y + a.box.height
                        return (
                          <rect
                            key={handle}
                            x={hx - HANDLE_SIZE / 2 / zoom}
                            y={hy - HANDLE_SIZE / 2 / zoom}
                            width={HANDLE_SIZE / zoom}
                            height={HANDLE_SIZE / zoom}
                            fill="white"
                            stroke={color}
                            strokeWidth={1.5 / zoom}
                            style={{ cursor: cursorForHandle(handle) }}
                          />
                        )
                      })}
                    </>
                  )}
                </>
              )}
              {/* Label */}
              <text
                x={labelX}
                y={labelY}
                fill={color}
                fontSize={12 / zoom}
                fontWeight="600"
                fontFamily="system-ui, sans-serif"
              >
                {label?.name ?? '?'}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}
