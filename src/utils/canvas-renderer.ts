import type { BoundingBox, PolygonPoint } from '../types/annotations'

function colorWithAlpha(color: string, alpha: number): string {
  // Handle hex colors (#RGB, #RRGGBB, #RRGGBBAA)
  if (color.startsWith('#')) {
    let hex = color.slice(1)
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  // Handle rgb(...)
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)
  }
  // Handle rgba(...) — replace existing alpha
  if (color.startsWith('rgba(')) {
    return color.replace(/,\s*[\d.]+\)$/, `, ${alpha})`)
  }
  return color
}

export function drawImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  zoom: number,
  panX: number,
  panY: number,
): void {
  ctx.save()
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.translate(panX, panY)
  ctx.scale(zoom, zoom)
  ctx.drawImage(image, 0, 0)
  ctx.restore()
}

export function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): void {
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])

  ctx.beginPath()
  ctx.moveTo(x, 0)
  ctx.lineTo(x, ctx.canvas.height)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(0, y)
  ctx.lineTo(ctx.canvas.width, y)
  ctx.stroke()

  ctx.restore()
}

export function drawDrawingBox(
  ctx: CanvasRenderingContext2D,
  box: BoundingBox,
  color: string,
  zoom: number,
  panX: number,
  panY: number,
): void {
  ctx.save()
  ctx.translate(panX, panY)
  ctx.scale(zoom, zoom)
  ctx.strokeStyle = color
  ctx.lineWidth = 2 / zoom
  ctx.setLineDash([6 / zoom, 3 / zoom])
  ctx.strokeRect(box.x, box.y, box.width, box.height)
  ctx.fillStyle = colorWithAlpha(color, 0.1)
  ctx.fillRect(box.x, box.y, box.width, box.height)
  ctx.restore()
}

export function drawDrawingPolygon(
  ctx: CanvasRenderingContext2D,
  points: PolygonPoint[],
  mousePos: PolygonPoint | null,
  color: string,
  zoom: number,
  panX: number,
  panY: number,
): void {
  if (points.length === 0) return

  ctx.save()
  ctx.translate(panX, panY)
  ctx.scale(zoom, zoom)

  const lw = 2 / zoom
  const dotRadius = 4 / zoom

  // Draw filled polygon preview
  if (points.length >= 2) {
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    if (mousePos) {
      ctx.lineTo(mousePos.x, mousePos.y)
    }
    ctx.closePath()
    ctx.fillStyle = colorWithAlpha(color, 0.1)
    ctx.fill()
  }

  // Draw edges
  ctx.strokeStyle = color
  ctx.lineWidth = lw
  ctx.setLineDash([6 / zoom, 3 / zoom])
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  if (mousePos) {
    ctx.lineTo(mousePos.x, mousePos.y)
    // Draw closing line from mouse back to first point (faint)
    ctx.stroke()
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.moveTo(mousePos.x, mousePos.y)
    ctx.lineTo(points[0].x, points[0].y)
    ctx.stroke()
    ctx.globalAlpha = 1
  } else {
    ctx.stroke()
  }

  // Draw vertex dots
  ctx.setLineDash([])
  for (let i = 0; i < points.length; i++) {
    ctx.beginPath()
    ctx.arc(points[i].x, points[i].y, dotRadius, 0, Math.PI * 2)
    ctx.fillStyle = i === 0 ? color : 'white'
    ctx.fill()
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5 / zoom
    ctx.stroke()
  }

  ctx.restore()
}
