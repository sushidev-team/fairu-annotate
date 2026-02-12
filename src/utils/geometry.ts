import type { BoundingBox, PolygonPoint } from '../types/annotations'

export function normalizeBox(startX: number, startY: number, endX: number, endY: number): BoundingBox {
  return {
    x: Math.min(startX, endX),
    y: Math.min(startY, endY),
    width: Math.abs(endX - startX),
    height: Math.abs(endY - startY),
  }
}

export function clampBox(box: BoundingBox, maxWidth: number, maxHeight: number): BoundingBox {
  const x = Math.max(0, Math.min(box.x, maxWidth))
  const y = Math.max(0, Math.min(box.y, maxHeight))
  return {
    x,
    y,
    width: Math.min(box.width, maxWidth - x),
    height: Math.min(box.height, maxHeight - y),
  }
}

export function pointInBox(px: number, py: number, box: BoundingBox): boolean {
  return px >= box.x && px <= box.x + box.width && py >= box.y && py <= box.y + box.height
}

export function boxesIntersect(a: BoundingBox, b: BoundingBox): boolean {
  return !(a.x + a.width < b.x || b.x + b.width < a.x || a.y + a.height < b.y || b.y + b.height < a.y)
}

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'

export function getResizeHandle(
  px: number,
  py: number,
  box: BoundingBox,
  handleSize: number = 8,
): ResizeHandle | null {
  const half = handleSize / 2
  const { x, y, width, height } = box
  const right = x + width
  const bottom = y + height

  const onLeft = Math.abs(px - x) <= half
  const onRight = Math.abs(px - right) <= half
  const onTop = Math.abs(py - y) <= half
  const onBottom = Math.abs(py - bottom) <= half

  if (onTop && onLeft) return 'nw'
  if (onTop && onRight) return 'ne'
  if (onBottom && onLeft) return 'sw'
  if (onBottom && onRight) return 'se'
  if (onTop && px > x && px < right) return 'n'
  if (onBottom && px > x && px < right) return 's'
  if (onLeft && py > y && py < bottom) return 'w'
  if (onRight && py > y && py < bottom) return 'e'

  return null
}

export function applyResize(
  box: BoundingBox,
  handle: ResizeHandle,
  dx: number,
  dy: number,
): BoundingBox {
  const result = { ...box }

  switch (handle) {
    case 'nw':
      result.x += dx
      result.y += dy
      result.width -= dx
      result.height -= dy
      break
    case 'ne':
      result.y += dy
      result.width += dx
      result.height -= dy
      break
    case 'sw':
      result.x += dx
      result.width -= dx
      result.height += dy
      break
    case 'se':
      result.width += dx
      result.height += dy
      break
    case 'n':
      result.y += dy
      result.height -= dy
      break
    case 's':
      result.height += dy
      break
    case 'w':
      result.x += dx
      result.width -= dx
      break
    case 'e':
      result.width += dx
      break
  }

  // Ensure positive dimensions
  if (result.width < 1) {
    result.x = result.x + result.width - 1
    result.width = 1
  }
  if (result.height < 1) {
    result.y = result.y + result.height - 1
    result.height = 1
  }

  return result
}

export function moveBox(box: BoundingBox, dx: number, dy: number): BoundingBox {
  return { ...box, x: box.x + dx, y: box.y + dy }
}

/**
 * Determines if a point (px, py) is inside a polygon using the ray casting algorithm.
 */
export function pointInPolygon(px: number, py: number, points: PolygonPoint[]): boolean {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x
    const yi = points[i].y
    const xj = points[j].x
    const yj = points[j].y

    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

/**
 * Returns the axis-aligned bounding box that encloses the given polygon points.
 */
export function polygonBounds(points: PolygonPoint[]): BoundingBox {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/**
 * Ensures the polygon is closed (first and last point match).
 * Returns a new array with the closing point appended if needed.
 */
export function closePolygon(points: PolygonPoint[]): PolygonPoint[] {
  if (points.length < 2) return [...points]
  const first = points[0]
  const last = points[points.length - 1]
  if (first.x === last.x && first.y === last.y) {
    return [...points]
  }
  return [...points, { x: first.x, y: first.y }]
}

/**
 * Simplifies a polygon using the Douglas-Peucker algorithm.
 * @param points - The polygon points to simplify
 * @param tolerance - The maximum distance a point can deviate from the simplified line
 */
export function simplifyPolygon(points: PolygonPoint[], tolerance: number): PolygonPoint[] {
  if (points.length <= 2) return [...points]

  // Find the point with the maximum distance from the line between first and last
  let maxDist = 0
  let maxIndex = 0

  const first = points[0]
  const last = points[points.length - 1]

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last)
    if (dist > maxDist) {
      maxDist = dist
      maxIndex = i
    }
  }

  // If max distance exceeds tolerance, recursively simplify both halves
  if (maxDist > tolerance) {
    const left = simplifyPolygon(points.slice(0, maxIndex + 1), tolerance)
    const right = simplifyPolygon(points.slice(maxIndex), tolerance)
    // Combine, removing the duplicate point at the junction
    return [...left.slice(0, -1), ...right]
  }

  // All intermediate points are within tolerance; keep only endpoints
  return [first, last]
}

/**
 * Calculates the perpendicular distance from a point to a line defined by two points.
 */
function perpendicularDistance(
  point: PolygonPoint,
  lineStart: PolygonPoint,
  lineEnd: PolygonPoint,
): number {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y

  if (dx === 0 && dy === 0) {
    // lineStart and lineEnd are the same point
    return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2)
  }

  const numerator = Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x)
  const denominator = Math.sqrt(dx * dx + dy * dy)
  return numerator / denominator
}
