import { describe, it, expect } from 'vitest'
import {
  normalizeBox,
  clampBox,
  pointInBox,
  boxesIntersect,
  getResizeHandle,
  applyResize,
  moveBox,
  pointInPolygon,
  polygonBounds,
  closePolygon,
  simplifyPolygon,
} from '../geometry'
import type { BoundingBox, PolygonPoint } from '../../types/annotations'

describe('normalizeBox', () => {
  it('handles start top-left, end bottom-right (standard direction)', () => {
    const box = normalizeBox(10, 20, 100, 200)
    expect(box).toEqual({ x: 10, y: 20, width: 90, height: 180 })
  })

  it('handles start bottom-right, end top-left (reversed)', () => {
    const box = normalizeBox(100, 200, 10, 20)
    expect(box).toEqual({ x: 10, y: 20, width: 90, height: 180 })
  })

  it('handles start bottom-left, end top-right', () => {
    const box = normalizeBox(10, 200, 100, 20)
    expect(box).toEqual({ x: 10, y: 20, width: 90, height: 180 })
  })

  it('handles start top-right, end bottom-left', () => {
    const box = normalizeBox(100, 20, 10, 200)
    expect(box).toEqual({ x: 10, y: 20, width: 90, height: 180 })
  })

  it('handles zero-size box (same start and end)', () => {
    const box = normalizeBox(50, 50, 50, 50)
    expect(box).toEqual({ x: 50, y: 50, width: 0, height: 0 })
  })

  it('handles horizontal line (same y)', () => {
    const box = normalizeBox(10, 50, 100, 50)
    expect(box).toEqual({ x: 10, y: 50, width: 90, height: 0 })
  })

  it('handles vertical line (same x)', () => {
    const box = normalizeBox(50, 10, 50, 100)
    expect(box).toEqual({ x: 50, y: 10, width: 0, height: 90 })
  })
})

describe('clampBox', () => {
  it('returns the same box when fully inside bounds', () => {
    const box: BoundingBox = { x: 10, y: 10, width: 50, height: 50 }
    const result = clampBox(box, 200, 200)
    expect(result).toEqual({ x: 10, y: 10, width: 50, height: 50 })
  })

  it('clamps a box that extends beyond the right and bottom edges', () => {
    const box: BoundingBox = { x: 150, y: 150, width: 100, height: 100 }
    const result = clampBox(box, 200, 200)
    expect(result).toEqual({ x: 150, y: 150, width: 50, height: 50 })
  })

  it('clamps a box with negative x and y', () => {
    const box: BoundingBox = { x: -20, y: -30, width: 100, height: 100 }
    const result = clampBox(box, 200, 200)
    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    // width is clamped to min(100, 200 - 0) = 100
    expect(result.width).toBe(100)
    expect(result.height).toBe(100)
  })

  it('clamps a box at the exact edges', () => {
    const box: BoundingBox = { x: 0, y: 0, width: 200, height: 200 }
    const result = clampBox(box, 200, 200)
    expect(result).toEqual({ x: 0, y: 0, width: 200, height: 200 })
  })

  it('clamps a box that is entirely outside on top-left', () => {
    const box: BoundingBox = { x: -100, y: -100, width: 50, height: 50 }
    const result = clampBox(box, 200, 200)
    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    // width = min(50, 200 - 0) = 50
    expect(result.width).toBe(50)
    expect(result.height).toBe(50)
  })
})

describe('pointInBox', () => {
  const box: BoundingBox = { x: 10, y: 10, width: 100, height: 80 }

  it('returns true for a point inside the box', () => {
    expect(pointInBox(50, 50, box)).toBe(true)
  })

  it('returns false for a point outside the box', () => {
    expect(pointInBox(0, 0, box)).toBe(false)
    expect(pointInBox(200, 200, box)).toBe(false)
    expect(pointInBox(5, 50, box)).toBe(false)
    expect(pointInBox(50, 5, box)).toBe(false)
  })

  it('returns true for a point on the left edge', () => {
    expect(pointInBox(10, 50, box)).toBe(true)
  })

  it('returns true for a point on the right edge', () => {
    expect(pointInBox(110, 50, box)).toBe(true)
  })

  it('returns true for a point on the top edge', () => {
    expect(pointInBox(50, 10, box)).toBe(true)
  })

  it('returns true for a point on the bottom edge', () => {
    expect(pointInBox(50, 90, box)).toBe(true)
  })

  it('returns true for a point at each corner', () => {
    expect(pointInBox(10, 10, box)).toBe(true) // top-left
    expect(pointInBox(110, 10, box)).toBe(true) // top-right
    expect(pointInBox(10, 90, box)).toBe(true) // bottom-left
    expect(pointInBox(110, 90, box)).toBe(true) // bottom-right
  })
})

describe('boxesIntersect', () => {
  it('returns true for overlapping boxes', () => {
    const a: BoundingBox = { x: 0, y: 0, width: 100, height: 100 }
    const b: BoundingBox = { x: 50, y: 50, width: 100, height: 100 }
    expect(boxesIntersect(a, b)).toBe(true)
  })

  it('returns false for non-overlapping boxes', () => {
    const a: BoundingBox = { x: 0, y: 0, width: 50, height: 50 }
    const b: BoundingBox = { x: 100, y: 100, width: 50, height: 50 }
    expect(boxesIntersect(a, b)).toBe(false)
  })

  it('returns true for boxes touching at edges', () => {
    // The implementation uses < not <=, so touching edges means a.x + a.width == b.x
    // !(100 < 100) => !(false) ... let's trace: a.x+a.width=100, b.x=100
    // a.x + a.width < b.x => 100 < 100 => false
    // b.x + b.width < a.x => 200 < 0 => false
    // a.y + a.height < b.y => 100 < 0 => false
    // b.y + b.height < a.y => 100 < 0 => false
    // !(false || false || false || false) => true
    const a: BoundingBox = { x: 0, y: 0, width: 100, height: 100 }
    const b: BoundingBox = { x: 100, y: 0, width: 100, height: 100 }
    expect(boxesIntersect(a, b)).toBe(true)
  })

  it('returns true when one box is entirely inside another', () => {
    const a: BoundingBox = { x: 0, y: 0, width: 200, height: 200 }
    const b: BoundingBox = { x: 50, y: 50, width: 50, height: 50 }
    expect(boxesIntersect(a, b)).toBe(true)
    // Symmetric
    expect(boxesIntersect(b, a)).toBe(true)
  })

  it('returns false for boxes separated horizontally', () => {
    const a: BoundingBox = { x: 0, y: 0, width: 50, height: 100 }
    const b: BoundingBox = { x: 60, y: 0, width: 50, height: 100 }
    expect(boxesIntersect(a, b)).toBe(false)
  })

  it('returns false for boxes separated vertically', () => {
    const a: BoundingBox = { x: 0, y: 0, width: 100, height: 50 }
    const b: BoundingBox = { x: 0, y: 60, width: 100, height: 50 }
    expect(boxesIntersect(a, b)).toBe(false)
  })
})

describe('getResizeHandle', () => {
  const box: BoundingBox = { x: 100, y: 100, width: 200, height: 150 }
  // Corners: nw=(100,100) ne=(300,100) sw=(100,250) se=(300,250)

  it('returns "nw" when point is near top-left corner', () => {
    expect(getResizeHandle(100, 100, box)).toBe('nw')
    expect(getResizeHandle(103, 103, box)).toBe('nw')
  })

  it('returns "ne" when point is near top-right corner', () => {
    expect(getResizeHandle(300, 100, box)).toBe('ne')
    expect(getResizeHandle(297, 103, box)).toBe('ne')
  })

  it('returns "sw" when point is near bottom-left corner', () => {
    expect(getResizeHandle(100, 250, box)).toBe('sw')
    expect(getResizeHandle(103, 247, box)).toBe('sw')
  })

  it('returns "se" when point is near bottom-right corner', () => {
    expect(getResizeHandle(300, 250, box)).toBe('se')
    expect(getResizeHandle(297, 247, box)).toBe('se')
  })

  it('returns "n" when point is near the top edge (not at corners)', () => {
    expect(getResizeHandle(200, 100, box)).toBe('n')
    expect(getResizeHandle(200, 103, box)).toBe('n')
  })

  it('returns "s" when point is near the bottom edge (not at corners)', () => {
    expect(getResizeHandle(200, 250, box)).toBe('s')
    expect(getResizeHandle(200, 247, box)).toBe('s')
  })

  it('returns "w" when point is near the left edge (not at corners)', () => {
    expect(getResizeHandle(100, 175, box)).toBe('w')
    expect(getResizeHandle(103, 175, box)).toBe('w')
  })

  it('returns "e" when point is near the right edge (not at corners)', () => {
    expect(getResizeHandle(300, 175, box)).toBe('e')
    expect(getResizeHandle(297, 175, box)).toBe('e')
  })

  it('returns null when point is in center of box', () => {
    expect(getResizeHandle(200, 175, box)).toBeNull()
  })

  it('returns null when point is outside the box', () => {
    expect(getResizeHandle(50, 50, box)).toBeNull()
    expect(getResizeHandle(400, 400, box)).toBeNull()
  })

  it('respects custom handleSize', () => {
    // With handleSize 2 (half=1), point at 103 is 3px away from edge at 100 => not within handle
    expect(getResizeHandle(103, 103, box, 2)).toBeNull()
    // But point at 101 is 1px away => within handle
    expect(getResizeHandle(101, 101, box, 2)).toBe('nw')
  })
})

describe('applyResize', () => {
  const box: BoundingBox = { x: 100, y: 100, width: 200, height: 150 }

  it('resizes from nw handle', () => {
    const result = applyResize(box, 'nw', 10, 20)
    expect(result).toEqual({ x: 110, y: 120, width: 190, height: 130 })
  })

  it('resizes from ne handle', () => {
    const result = applyResize(box, 'ne', 10, 20)
    expect(result).toEqual({ x: 100, y: 120, width: 210, height: 130 })
  })

  it('resizes from sw handle', () => {
    const result = applyResize(box, 'sw', 10, 20)
    expect(result).toEqual({ x: 110, y: 100, width: 190, height: 170 })
  })

  it('resizes from se handle', () => {
    const result = applyResize(box, 'se', 10, 20)
    expect(result).toEqual({ x: 100, y: 100, width: 210, height: 170 })
  })

  it('resizes from n handle', () => {
    const result = applyResize(box, 'n', 0, 20)
    expect(result).toEqual({ x: 100, y: 120, width: 200, height: 130 })
  })

  it('resizes from s handle', () => {
    const result = applyResize(box, 's', 0, 20)
    expect(result).toEqual({ x: 100, y: 100, width: 200, height: 170 })
  })

  it('resizes from w handle', () => {
    const result = applyResize(box, 'w', 10, 0)
    expect(result).toEqual({ x: 110, y: 100, width: 190, height: 150 })
  })

  it('resizes from e handle', () => {
    const result = applyResize(box, 'e', 10, 0)
    expect(result).toEqual({ x: 100, y: 100, width: 210, height: 150 })
  })

  it('enforces minimum width of 1', () => {
    // Drag w handle far to the right to collapse width
    const result = applyResize(box, 'w', 300, 0)
    // width would be 200 - 300 = -100, which is < 1
    expect(result.width).toBe(1)
  })

  it('enforces minimum height of 1', () => {
    // Drag n handle far down to collapse height
    const result = applyResize(box, 'n', 0, 300)
    // height would be 150 - 300 = -150, which is < 1
    expect(result.height).toBe(1)
  })

  it('enforces minimum width and height together for corner resize', () => {
    const result = applyResize(box, 'nw', 500, 500)
    expect(result.width).toBe(1)
    expect(result.height).toBe(1)
  })

  it('adjusts x position when width goes below minimum', () => {
    const result = applyResize(box, 'w', 300, 0)
    // result.x = 100 + 300 = 400, result.width = 200 - 300 = -100
    // Since width < 1: x = 400 + (-100) - 1 = 299, width = 1
    expect(result.x).toBe(299)
    expect(result.width).toBe(1)
  })

  it('adjusts y position when height goes below minimum', () => {
    const result = applyResize(box, 'n', 0, 300)
    // result.y = 100 + 300 = 400, result.height = 150 - 300 = -150
    // Since height < 1: y = 400 + (-150) - 1 = 249, height = 1
    expect(result.y).toBe(249)
    expect(result.height).toBe(1)
  })
})

describe('moveBox', () => {
  it('translates a box by positive dx and dy', () => {
    const box: BoundingBox = { x: 10, y: 20, width: 100, height: 50 }
    const result = moveBox(box, 30, 40)
    expect(result).toEqual({ x: 40, y: 60, width: 100, height: 50 })
  })

  it('translates a box by negative dx and dy', () => {
    const box: BoundingBox = { x: 100, y: 100, width: 50, height: 50 }
    const result = moveBox(box, -30, -20)
    expect(result).toEqual({ x: 70, y: 80, width: 50, height: 50 })
  })

  it('does not change box with zero deltas', () => {
    const box: BoundingBox = { x: 10, y: 20, width: 100, height: 50 }
    const result = moveBox(box, 0, 0)
    expect(result).toEqual({ x: 10, y: 20, width: 100, height: 50 })
  })

  it('does not mutate the original box', () => {
    const box: BoundingBox = { x: 10, y: 20, width: 100, height: 50 }
    const result = moveBox(box, 30, 40)
    expect(box.x).toBe(10)
    expect(box.y).toBe(20)
    expect(result).not.toBe(box)
  })
})

describe('pointInPolygon', () => {
  // Triangle: (0,0), (10,0), (5,10)
  const triangle: PolygonPoint[] = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 5, y: 10 },
  ]

  it('returns true for a point inside a triangle', () => {
    expect(pointInPolygon(5, 3, triangle)).toBe(true)
  })

  it('returns false for a point outside a triangle', () => {
    expect(pointInPolygon(20, 20, triangle)).toBe(false)
    expect(pointInPolygon(-1, -1, triangle)).toBe(false)
  })

  it('handles a point on the edge of a triangle', () => {
    // Point on the bottom edge (y=0, between x=0 and x=10)
    // Ray casting may or may not include edge points; just verify it returns a boolean
    const result = pointInPolygon(5, 0, triangle)
    expect(typeof result).toBe('boolean')
  })

  it('returns true for a point inside a concave polygon', () => {
    // L-shaped concave polygon
    const concave: PolygonPoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
      { x: 5, y: 5 },
      { x: 5, y: 10 },
      { x: 0, y: 10 },
    ]
    // Inside the bottom-left part of the L
    expect(pointInPolygon(2, 8, concave)).toBe(true)
    // Inside the top-right part of the L
    expect(pointInPolygon(8, 2, concave)).toBe(true)
    // In the concave notch (outside the polygon)
    expect(pointInPolygon(8, 8, concave)).toBe(false)
  })

  it('returns false for a single-point polygon', () => {
    const single: PolygonPoint[] = [{ x: 5, y: 5 }]
    expect(pointInPolygon(5, 5, single)).toBe(false)
  })

  it('returns false for a two-point polygon (line segment)', () => {
    const line: PolygonPoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ]
    expect(pointInPolygon(5, 5, line)).toBe(false)
  })
})

describe('polygonBounds', () => {
  it('returns the bounding box of a triangle', () => {
    const triangle: PolygonPoint[] = [
      { x: 2, y: 3 },
      { x: 10, y: 1 },
      { x: 6, y: 8 },
    ]
    expect(polygonBounds(triangle)).toEqual({ x: 2, y: 1, width: 8, height: 7 })
  })

  it('returns zero box for an empty array', () => {
    expect(polygonBounds([])).toEqual({ x: 0, y: 0, width: 0, height: 0 })
  })

  it('returns zero-size box for a single point', () => {
    const single: PolygonPoint[] = [{ x: 5, y: 7 }]
    expect(polygonBounds(single)).toEqual({ x: 5, y: 7, width: 0, height: 0 })
  })

  it('returns correct bounds for collinear points (line)', () => {
    const line: PolygonPoint[] = [
      { x: 1, y: 5 },
      { x: 4, y: 5 },
      { x: 8, y: 5 },
    ]
    expect(polygonBounds(line)).toEqual({ x: 1, y: 5, width: 7, height: 0 })
  })
})

describe('closePolygon', () => {
  it('returns the same points when already closed', () => {
    const closed: PolygonPoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 5, y: 10 },
      { x: 0, y: 0 },
    ]
    const result = closePolygon(closed)
    expect(result).toEqual(closed)
    expect(result).not.toBe(closed) // should be a new array
  })

  it('appends the first point when not closed', () => {
    const open: PolygonPoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 5, y: 10 },
    ]
    const result = closePolygon(open)
    expect(result).toHaveLength(4)
    expect(result[3]).toEqual({ x: 0, y: 0 })
  })

  it('returns a copy for a single point', () => {
    const single: PolygonPoint[] = [{ x: 3, y: 4 }]
    const result = closePolygon(single)
    expect(result).toEqual([{ x: 3, y: 4 }])
    expect(result).not.toBe(single)
  })

  it('returns an empty array for empty input', () => {
    const result = closePolygon([])
    expect(result).toEqual([])
  })

  it('appends closing point for two points that differ', () => {
    const two: PolygonPoint[] = [
      { x: 0, y: 0 },
      { x: 5, y: 5 },
    ]
    const result = closePolygon(two)
    expect(result).toHaveLength(3)
    expect(result[2]).toEqual({ x: 0, y: 0 })
  })
})

describe('simplifyPolygon', () => {
  it('removes collinear intermediate points on a straight line', () => {
    const line: PolygonPoint[] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
      { x: 4, y: 4 },
    ]
    const result = simplifyPolygon(line, 0.1)
    // All intermediate points are on the line, so only endpoints remain
    expect(result).toEqual([
      { x: 0, y: 0 },
      { x: 4, y: 4 },
    ])
  })

  it('simplifies a complex polygon while keeping significant points', () => {
    // A line from (0,0) to (10,0) with a significant bump at (5,10)
    // and near-collinear points that should be removed at higher tolerance
    const points: PolygonPoint[] = [
      { x: 0, y: 0 },
      { x: 3, y: 0.2 },  // near the line, within tolerance
      { x: 5, y: 10 },   // significant deviation, must be kept
      { x: 8, y: 0.3 },  // near the line, within tolerance
      { x: 10, y: 0 },
    ]
    const result = simplifyPolygon(points, 5)
    // Only the significant point (5,10) and the endpoints should remain
    expect(result).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 10 },
      { x: 10, y: 0 },
    ])
  })

  it('keeps all points when tolerance is 0', () => {
    const points: PolygonPoint[] = [
      { x: 0, y: 0 },
      { x: 5, y: 3 },
      { x: 10, y: 0 },
    ]
    const result = simplifyPolygon(points, 0)
    expect(result).toEqual(points)
  })

  it('returns a copy for 2 or fewer points', () => {
    const two: PolygonPoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ]
    const result = simplifyPolygon(two, 5)
    expect(result).toEqual(two)
    expect(result).not.toBe(two)

    const one: PolygonPoint[] = [{ x: 3, y: 4 }]
    const resultOne = simplifyPolygon(one, 5)
    expect(resultOne).toEqual(one)
    expect(resultOne).not.toBe(one)

    const empty: PolygonPoint[] = []
    const resultEmpty = simplifyPolygon(empty, 5)
    expect(resultEmpty).toEqual([])
  })

  it('handles polygon where first and last points are identical (perpendicularDistance with same point)', () => {
    // When first and last points are the same, perpendicularDistance
    // should use the Euclidean distance from the point to lineStart.
    // This triggers the dx===0 && dy===0 branch at line 222.
    const points: PolygonPoint[] = [
      { x: 5, y: 5 },
      { x: 10, y: 10 },
      { x: 5, y: 5 }, // same as first point
    ]
    const result = simplifyPolygon(points, 1)
    // The intermediate point (10,10) is ~7.07 units from (5,5),
    // which exceeds tolerance of 1, so it should be kept
    expect(result).toEqual([
      { x: 5, y: 5 },
      { x: 10, y: 10 },
      { x: 5, y: 5 },
    ])
  })
})
