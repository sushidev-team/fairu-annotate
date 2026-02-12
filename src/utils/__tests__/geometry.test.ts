import { describe, it, expect } from 'vitest'
import {
  normalizeBox,
  clampBox,
  pointInBox,
  boxesIntersect,
  getResizeHandle,
  applyResize,
  moveBox,
} from '../geometry'
import type { BoundingBox } from '../../types/annotations'

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
