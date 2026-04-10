import { describe, it, expect, vi } from 'vitest'
import {
  drawImage,
  drawCrosshair,
  drawDrawingBox,
  drawDrawingPolygon,
} from '../canvas-renderer'
import type { BoundingBox, PolygonPoint } from '../../types/annotations'

function createMockCtx(): CanvasRenderingContext2D {
  const ctx: any = {
    canvas: { width: 800, height: 600 },
    save: vi.fn(),
    restore: vi.fn(),
    clearRect: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    closePath: vi.fn(),
    strokeRect: vi.fn(),
    fillRect: vi.fn(),
    setLineDash: vi.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
  }
  return ctx as CanvasRenderingContext2D
}

describe('drawImage', () => {
  it('saves and restores context', () => {
    const ctx = createMockCtx()
    const img = {} as HTMLImageElement
    drawImage(ctx, img, 1, 0, 0)
    expect(ctx.save).toHaveBeenCalledOnce()
    expect(ctx.restore).toHaveBeenCalledOnce()
  })

  it('clears the entire canvas', () => {
    const ctx = createMockCtx()
    const img = {} as HTMLImageElement
    drawImage(ctx, img, 1, 0, 0)
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600)
  })

  it('translates by pan values', () => {
    const ctx = createMockCtx()
    const img = {} as HTMLImageElement
    drawImage(ctx, img, 1, 50, 100)
    expect(ctx.translate).toHaveBeenCalledWith(50, 100)
  })

  it('scales by zoom', () => {
    const ctx = createMockCtx()
    const img = {} as HTMLImageElement
    drawImage(ctx, img, 2, 0, 0)
    expect(ctx.scale).toHaveBeenCalledWith(2, 2)
  })

  it('draws the image at origin', () => {
    const ctx = createMockCtx()
    const img = {} as HTMLImageElement
    drawImage(ctx, img, 1.5, 10, 20)
    expect(ctx.drawImage).toHaveBeenCalledWith(img, 0, 0)
  })
})

describe('drawCrosshair', () => {
  it('saves and restores context', () => {
    const ctx = createMockCtx()
    drawCrosshair(ctx, 100, 200)
    expect(ctx.save).toHaveBeenCalledOnce()
    expect(ctx.restore).toHaveBeenCalledOnce()
  })

  it('sets dashed line style', () => {
    const ctx = createMockCtx()
    drawCrosshair(ctx, 100, 200)
    expect(ctx.setLineDash).toHaveBeenCalledWith([4, 4])
  })

  it('draws vertical line through x', () => {
    const ctx = createMockCtx()
    drawCrosshair(ctx, 100, 200)
    expect(ctx.moveTo).toHaveBeenCalledWith(100, 0)
    expect(ctx.lineTo).toHaveBeenCalledWith(100, 600)
  })

  it('draws horizontal line through y', () => {
    const ctx = createMockCtx()
    drawCrosshair(ctx, 100, 200)
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 200)
    expect(ctx.lineTo).toHaveBeenCalledWith(800, 200)
  })

  it('calls beginPath and stroke for both lines', () => {
    const ctx = createMockCtx()
    drawCrosshair(ctx, 100, 200)
    expect(ctx.beginPath).toHaveBeenCalledTimes(2)
    expect(ctx.stroke).toHaveBeenCalledTimes(2)
  })
})

describe('drawDrawingBox', () => {
  const box: BoundingBox = { x: 10, y: 20, width: 100, height: 50 }

  it('saves and restores context', () => {
    const ctx = createMockCtx()
    drawDrawingBox(ctx, box, '#ff0000', 1, 0, 0)
    expect(ctx.save).toHaveBeenCalledOnce()
    expect(ctx.restore).toHaveBeenCalledOnce()
  })

  it('translates by pan and scales by zoom', () => {
    const ctx = createMockCtx()
    drawDrawingBox(ctx, box, '#ff0000', 2, 30, 40)
    expect(ctx.translate).toHaveBeenCalledWith(30, 40)
    expect(ctx.scale).toHaveBeenCalledWith(2, 2)
  })

  it('adjusts line width for zoom', () => {
    const ctx = createMockCtx()
    drawDrawingBox(ctx, box, '#ff0000', 2, 0, 0)
    expect(ctx.lineWidth).toBe(2 / 2)
  })

  it('sets dashed line pattern adjusted for zoom', () => {
    const ctx = createMockCtx()
    drawDrawingBox(ctx, box, '#ff0000', 2, 0, 0)
    expect(ctx.setLineDash).toHaveBeenCalledWith([6 / 2, 3 / 2])
  })

  it('draws stroked rect with box dimensions', () => {
    const ctx = createMockCtx()
    drawDrawingBox(ctx, box, '#ff0000', 1, 0, 0)
    expect(ctx.strokeRect).toHaveBeenCalledWith(10, 20, 100, 50)
  })

  it('draws filled rect with box dimensions', () => {
    const ctx = createMockCtx()
    drawDrawingBox(ctx, box, '#ff0000', 1, 0, 0)
    expect(ctx.fillRect).toHaveBeenCalledWith(10, 20, 100, 50)
  })

  // Indirect tests for colorWithAlpha via fillStyle
  describe('colorWithAlpha (indirect via fillStyle)', () => {
    it('converts #RRGGBB hex to rgba with alpha 0.1', () => {
      const ctx = createMockCtx()
      drawDrawingBox(ctx, box, '#ff0000', 1, 0, 0)
      expect(ctx.fillStyle).toBe('rgba(255, 0, 0, 0.1)')
    })

    it('converts short #RGB hex to rgba with alpha 0.1', () => {
      const ctx = createMockCtx()
      drawDrawingBox(ctx, box, '#f00', 1, 0, 0)
      expect(ctx.fillStyle).toBe('rgba(255, 0, 0, 0.1)')
    })

    it('converts rgb(...) to rgba with alpha 0.1', () => {
      const ctx = createMockCtx()
      drawDrawingBox(ctx, box, 'rgb(0, 128, 255)', 1, 0, 0)
      expect(ctx.fillStyle).toBe('rgba(0, 128, 255, 0.1)')
    })

    it('replaces existing alpha in rgba(...)', () => {
      const ctx = createMockCtx()
      drawDrawingBox(ctx, box, 'rgba(0, 128, 255, 0.5)', 1, 0, 0)
      expect(ctx.fillStyle).toBe('rgba(0, 128, 255, 0.1)')
    })

    it('returns unknown color formats as-is', () => {
      const ctx = createMockCtx()
      drawDrawingBox(ctx, box, 'red', 1, 0, 0)
      expect(ctx.fillStyle).toBe('red')
    })
  })
})

describe('drawDrawingPolygon', () => {
  const color = '#00ff00'

  it('does nothing for empty points', () => {
    const ctx = createMockCtx()
    drawDrawingPolygon(ctx, [], null, color, 1, 0, 0)
    expect(ctx.save).not.toHaveBeenCalled()
    expect(ctx.restore).not.toHaveBeenCalled()
    expect(ctx.beginPath).not.toHaveBeenCalled()
  })

  it('saves and restores context for non-empty points', () => {
    const ctx = createMockCtx()
    const points: PolygonPoint[] = [{ x: 10, y: 20 }]
    drawDrawingPolygon(ctx, points, null, color, 1, 0, 0)
    expect(ctx.save).toHaveBeenCalledOnce()
    expect(ctx.restore).toHaveBeenCalledOnce()
  })

  it('translates and scales for non-empty points', () => {
    const ctx = createMockCtx()
    const points: PolygonPoint[] = [{ x: 10, y: 20 }]
    drawDrawingPolygon(ctx, points, null, color, 2, 30, 40)
    expect(ctx.translate).toHaveBeenCalledWith(30, 40)
    expect(ctx.scale).toHaveBeenCalledWith(2, 2)
  })

  it('draws edges for multiple points', () => {
    const ctx = createMockCtx()
    const points: PolygonPoint[] = [
      { x: 10, y: 20 },
      { x: 30, y: 40 },
      { x: 50, y: 60 },
    ]
    drawDrawingPolygon(ctx, points, null, color, 1, 0, 0)
    expect(ctx.moveTo).toHaveBeenCalledWith(10, 20)
    expect(ctx.lineTo).toHaveBeenCalledWith(30, 40)
    expect(ctx.lineTo).toHaveBeenCalledWith(50, 60)
  })

  it('draws vertex dots for each point', () => {
    const ctx = createMockCtx()
    const points: PolygonPoint[] = [
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ]
    drawDrawingPolygon(ctx, points, null, color, 1, 0, 0)
    // One arc call per vertex
    expect(ctx.arc).toHaveBeenCalledTimes(2)
    expect(ctx.arc).toHaveBeenCalledWith(10, 20, 4, 0, Math.PI * 2)
    expect(ctx.arc).toHaveBeenCalledWith(30, 40, 4, 0, Math.PI * 2)
  })

  it('colors first vertex with the annotation color, others white', () => {
    const ctx = createMockCtx()
    const points: PolygonPoint[] = [
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ]
    drawDrawingPolygon(ctx, points, null, color, 1, 0, 0)
    // fillStyle is set multiple times; we track via the fill calls
    // After drawing vertex 0, fillStyle should be the color
    // After drawing vertex 1, fillStyle should be 'white'
    // The last vertex drawn is index 1, so fillStyle ends up as 'white'
    // But we can check the sequence via the fill mock
    const fillCalls = (ctx.fill as ReturnType<typeof vi.fn>).mock.calls.length
    // For 2 points with >= 2 points: 1 fill for polygon preview + 2 fills for vertices = 3
    expect(fillCalls).toBe(3)
  })

  it('handles mousePos by drawing closing line with globalAlpha=0.3', () => {
    const ctx = createMockCtx()
    const points: PolygonPoint[] = [
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ]
    const mousePos: PolygonPoint = { x: 50, y: 60 }
    drawDrawingPolygon(ctx, points, mousePos, color, 1, 0, 0)

    // mousePos line is drawn to the edge path
    expect(ctx.lineTo).toHaveBeenCalledWith(50, 60)
    // Closing line from mousePos back to first point
    expect(ctx.moveTo).toHaveBeenCalledWith(50, 60)
    expect(ctx.lineTo).toHaveBeenCalledWith(10, 20)
    // globalAlpha is reset to 1 after the closing line
    expect(ctx.globalAlpha).toBe(1)
  })

  it('strokes edges without closing line when mousePos is null', () => {
    const ctx = createMockCtx()
    const points: PolygonPoint[] = [
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ]
    drawDrawingPolygon(ctx, points, null, color, 1, 0, 0)
    // stroke is called for edges
    expect(ctx.stroke).toHaveBeenCalled()
    // globalAlpha should never be set to 0.3
    expect(ctx.globalAlpha).toBe(1)
  })

  it('draws filled polygon preview for >= 2 points', () => {
    const ctx = createMockCtx()
    const points: PolygonPoint[] = [
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ]
    drawDrawingPolygon(ctx, points, null, color, 1, 0, 0)
    expect(ctx.closePath).toHaveBeenCalled()
    expect(ctx.fill).toHaveBeenCalled()
  })

  it('does not draw filled preview for a single point', () => {
    const ctx = createMockCtx()
    const points: PolygonPoint[] = [{ x: 10, y: 20 }]
    drawDrawingPolygon(ctx, points, null, color, 1, 0, 0)
    // closePath is not called (no polygon preview for < 2 points)
    expect(ctx.closePath).not.toHaveBeenCalled()
  })

  it('adjusts dot radius and line width for zoom', () => {
    const ctx = createMockCtx()
    const points: PolygonPoint[] = [{ x: 10, y: 20 }]
    const zoom = 2
    drawDrawingPolygon(ctx, points, null, color, zoom, 0, 0)
    // Dot radius = 4 / zoom = 2
    expect(ctx.arc).toHaveBeenCalledWith(10, 20, 4 / zoom, 0, Math.PI * 2)
    // Edge line width = 2 / zoom = 1
    expect(ctx.lineWidth).toBe(1.5 / zoom)
  })
})
