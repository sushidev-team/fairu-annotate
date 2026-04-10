import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Canvas } from '../Canvas'
import type { BoundingBox, PolygonPoint } from '../../../types/annotations'

const mockCtx = {
  canvas: { width: 800, height: 600 },
  save: vi.fn(),
  restore: vi.fn(),
  clearRect: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  drawImage: vi.fn(),
  setTransform: vi.fn(),
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

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx)
  Object.values(mockCtx).forEach((v) => {
    if (typeof v === 'function') v.mockClear?.()
  })
  // Reset non-function properties
  mockCtx.strokeStyle = ''
  mockCtx.fillStyle = ''
  mockCtx.lineWidth = 0
  mockCtx.globalAlpha = 1
})

const defaultProps = {
  image: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  drawingBox: null,
  drawingColor: '#FF0000',
  containerWidth: 800,
  containerHeight: 600,
  showCrosshair: false,
}

describe('Canvas', () => {
  it('renders a canvas element', () => {
    const { container } = render(<Canvas {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
  })

  it('sets canvas width/height based on containerWidth * devicePixelRatio', () => {
    const dpr = window.devicePixelRatio || 1
    const { container } = render(
      <Canvas {...defaultProps} containerWidth={400} containerHeight={300} />,
    )
    const canvas = container.querySelector('canvas')!
    expect(canvas.width).toBe(400 * dpr)
    expect(canvas.height).toBe(300 * dpr)
  })

  it('calls drawImage when image is provided', () => {
    const fakeImage = new Image()
    render(<Canvas {...defaultProps} image={fakeImage} />)
    // drawImage is called via canvas-renderer, which calls ctx.save, ctx.drawImage, etc.
    expect(mockCtx.drawImage).toHaveBeenCalled()
  })

  it('does not call drawImage when image is null', () => {
    render(<Canvas {...defaultProps} image={null} />)
    expect(mockCtx.drawImage).not.toHaveBeenCalled()
  })

  it('calls drawDrawingBox when drawingBox is provided', () => {
    const drawingBox: BoundingBox = { x: 10, y: 20, width: 100, height: 80 }
    render(<Canvas {...defaultProps} drawingBox={drawingBox} />)
    // drawDrawingBox calls ctx.strokeRect
    expect(mockCtx.strokeRect).toHaveBeenCalled()
  })

  it('does not call drawDrawingBox when drawingBox is null', () => {
    render(<Canvas {...defaultProps} drawingBox={null} />)
    expect(mockCtx.strokeRect).not.toHaveBeenCalled()
  })

  it('calls drawDrawingPolygon for polygon points', () => {
    const polygonPoints: PolygonPoint[] = [
      { x: 10, y: 10 },
      { x: 50, y: 10 },
      { x: 30, y: 50 },
    ]
    render(<Canvas {...defaultProps} polygonPoints={polygonPoints} />)
    // drawDrawingPolygon calls ctx.arc for each vertex dot
    expect(mockCtx.arc).toHaveBeenCalled()
    expect(mockCtx.moveTo).toHaveBeenCalled()
    expect(mockCtx.lineTo).toHaveBeenCalled()
  })

  it('mouse move triggers crosshair re-render when showCrosshair=true', () => {
    const { container } = render(<Canvas {...defaultProps} showCrosshair={true} />)
    const canvas = container.querySelector('canvas')!

    // Clear mocks after initial render
    mockCtx.setTransform.mockClear()
    mockCtx.clearRect.mockClear()
    mockCtx.setLineDash.mockClear()

    fireEvent.mouseMove(canvas, { clientX: 100, clientY: 200 })

    // After mouse move with showCrosshair=true, render() is called again
    // which calls setTransform and clearRect
    expect(mockCtx.setTransform).toHaveBeenCalled()
    expect(mockCtx.clearRect).toHaveBeenCalled()
    // drawCrosshair calls setLineDash
    expect(mockCtx.setLineDash).toHaveBeenCalled()
  })

  it('mouse leave clears crosshair', () => {
    const { container } = render(<Canvas {...defaultProps} showCrosshair={true} />)
    const canvas = container.querySelector('canvas')!

    // First move to set mousePos
    fireEvent.mouseMove(canvas, { clientX: 100, clientY: 200 })

    // Clear mocks
    mockCtx.setTransform.mockClear()
    mockCtx.clearRect.mockClear()
    mockCtx.setLineDash.mockClear()

    // Mouse leave should clear mousePos and re-render
    fireEvent.mouseLeave(canvas)

    // render() is called but drawCrosshair is not since mousePos is null
    expect(mockCtx.setTransform).toHaveBeenCalled()
    expect(mockCtx.clearRect).toHaveBeenCalled()
  })

  it('sets pixelated rendering when zoom > 2', () => {
    const { container } = render(<Canvas {...defaultProps} zoom={3} />)
    const canvas = container.querySelector('canvas')!
    expect(canvas.style.imageRendering).toBe('pixelated')
  })

  it('sets auto rendering when zoom <= 2', () => {
    const { container } = render(<Canvas {...defaultProps} zoom={1.5} />)
    const canvas = container.querySelector('canvas')!
    expect(canvas.style.imageRendering).toBe('auto')
  })
})
