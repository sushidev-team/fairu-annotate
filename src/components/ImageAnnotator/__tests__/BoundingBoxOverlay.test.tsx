import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BoundingBoxOverlay } from '../BoundingBoxOverlay'
import type { Annotation } from '../../../types/annotations'
import type { Label } from '../../../types/labels'

const labels: Label[] = [
  { id: 'cat', name: 'Cat', color: '#FF6B6B', classId: 0 },
  { id: 'dog', name: 'Dog', color: '#4ECDC4', classId: 1 },
]

const boxAnnotation: Annotation = {
  id: 'ann-1',
  imageId: 'img-1',
  labelId: 'cat',
  type: 'box',
  box: { x: 10, y: 20, width: 100, height: 80 },
}

const polygonAnnotation: Annotation = {
  id: 'ann-2',
  imageId: 'img-1',
  labelId: 'dog',
  type: 'polygon',
  box: { x: 50, y: 50, width: 120, height: 90 },
  polygon: [
    { x: 50, y: 50 },
    { x: 170, y: 60 },
    { x: 160, y: 140 },
    { x: 60, y: 130 },
  ],
}

const classificationAnnotation: Annotation = {
  id: 'ann-3',
  imageId: 'img-1',
  labelId: 'cat',
  type: 'classification',
  box: { x: 0, y: 0, width: 0, height: 0 },
}

const defaultProps = {
  annotations: [] as Annotation[],
  labels,
  selectedId: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  onSelect: vi.fn(),
  onUpdate: vi.fn(),
  tool: 'select',
  locked: false,
}

describe('BoundingBoxOverlay', () => {
  it('renders SVG element', () => {
    const { container } = render(<BoundingBoxOverlay {...defaultProps} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('renders rect for box annotations', () => {
    const { container } = render(
      <BoundingBoxOverlay {...defaultProps} annotations={[boxAnnotation]} />,
    )
    const rects = container.querySelectorAll('rect')
    // Should have at least one rect for the box annotation
    const boxRect = Array.from(rects).find(
      (r) =>
        r.getAttribute('x') === '10' &&
        r.getAttribute('y') === '20' &&
        r.getAttribute('width') === '100' &&
        r.getAttribute('height') === '80',
    )
    expect(boxRect).toBeTruthy()
  })

  it('renders polygon for polygon annotations', () => {
    const { container } = render(
      <BoundingBoxOverlay {...defaultProps} annotations={[polygonAnnotation]} />,
    )
    const polygon = container.querySelector('polygon')
    expect(polygon).toBeInTheDocument()
    expect(polygon!.getAttribute('points')).toBe('50,50 170,60 160,140 60,130')
  })

  it('shows label text', () => {
    render(
      <BoundingBoxOverlay {...defaultProps} annotations={[boxAnnotation]} />,
    )
    expect(screen.getByText('Cat')).toBeInTheDocument()
  })

  it('selected annotation has different stroke width', () => {
    const { container } = render(
      <BoundingBoxOverlay
        {...defaultProps}
        annotations={[boxAnnotation]}
        selectedId="ann-1"
      />,
    )
    const rects = container.querySelectorAll('rect')
    const boxRect = Array.from(rects).find(
      (r) =>
        r.getAttribute('x') === '10' &&
        r.getAttribute('width') === '100',
    )
    // Selected stroke-width is 2.5/zoom = 2.5, unselected is 1.5/zoom = 1.5
    expect(boxRect!.getAttribute('stroke-width')).toBe('2.5')
  })

  it('shows resize handles for selected box annotation', () => {
    const { container } = render(
      <BoundingBoxOverlay
        {...defaultProps}
        annotations={[boxAnnotation]}
        selectedId="ann-1"
        tool="select"
      />,
    )
    // 4 corner handles (nw, ne, sw, se) + 1 box rect = 5 rects total
    const rects = container.querySelectorAll('rect')
    expect(rects.length).toBe(5)
  })

  it('shows vertex circles for selected polygon annotation', () => {
    const { container } = render(
      <BoundingBoxOverlay
        {...defaultProps}
        annotations={[polygonAnnotation]}
        selectedId="ann-2"
        tool="select"
      />,
    )
    const circles = container.querySelectorAll('circle')
    // 4 vertices = 4 circles
    expect(circles.length).toBe(4)
  })

  it('click on annotation calls onSelect with id', () => {
    const onSelect = vi.fn()
    const { container } = render(
      <BoundingBoxOverlay
        {...defaultProps}
        annotations={[boxAnnotation]}
        onSelect={onSelect}
        tool="select"
      />,
    )
    const rects = container.querySelectorAll('rect')
    const boxRect = Array.from(rects).find(
      (r) =>
        r.getAttribute('x') === '10' &&
        r.getAttribute('width') === '100',
    )!
    // mouseDown on the annotation group triggers onSelect
    fireEvent.mouseDown(boxRect)
    expect(onSelect).toHaveBeenCalledWith('ann-1')
  })

  it('background click calls onSelect(null) in select mode', () => {
    const onSelect = vi.fn()
    const { container } = render(
      <BoundingBoxOverlay
        {...defaultProps}
        annotations={[boxAnnotation]}
        onSelect={onSelect}
        tool="select"
      />,
    )
    const svg = container.querySelector('svg')!
    // Click directly on the SVG (background)
    fireEvent.click(svg)
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('pointer events disabled when tool is not select', () => {
    const { container } = render(
      <BoundingBoxOverlay {...defaultProps} tool="draw" />,
    )
    const svg = container.querySelector('svg')!
    expect(svg.style.pointerEvents).toBe('none')
  })

  it('pointer events disabled when locked', () => {
    const { container } = render(
      <BoundingBoxOverlay {...defaultProps} tool="select" locked={true} />,
    )
    const svg = container.querySelector('svg')!
    expect(svg.style.pointerEvents).toBe('none')
  })

  it('SVG mousemove and mouseup handlers are set up correctly', () => {
    const onUpdate = vi.fn()
    const { container } = render(
      <BoundingBoxOverlay
        {...defaultProps}
        selectedId="ann-1"
        onUpdate={onUpdate}
      />,
    )
    const svg = container.querySelector('svg')!

    // SVG has mousemove, mouseup, mouseleave handlers
    // Fire mousemove on SVG without dragging state - should not call onUpdate
    fireEvent.mouseMove(svg, { clientX: 70, clientY: 80 })
    expect(onUpdate).not.toHaveBeenCalled()

    // Fire mouseup on SVG - should not error
    fireEvent.mouseUp(svg)

    // Fire mouseleave on SVG - should not error
    fireEvent.mouseLeave(svg)
  })

  it('filters out classification annotations', () => {
    render(
      <BoundingBoxOverlay
        {...defaultProps}
        annotations={[boxAnnotation, classificationAnnotation]}
      />,
    )
    // Only the box annotation label should appear, not a second "Cat" for the classification
    const catLabels = screen.getAllByText('Cat')
    expect(catLabels.length).toBe(1)
  })
})
