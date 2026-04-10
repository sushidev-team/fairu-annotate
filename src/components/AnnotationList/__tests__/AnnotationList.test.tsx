import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { AnnotationList } from '../AnnotationList'
import { StoreProvider } from '../../../stores/provider'
import type { Annotation } from '../../../types/annotations'
import type { Label } from '../../../types/labels'

function wrapper(initialAnnotations?: Record<string, Annotation[]>, initialFavorites?: string[]) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <StoreProvider initialAnnotations={initialAnnotations} initialFavorites={initialFavorites}>
        {children}
      </StoreProvider>
    )
  }
}

const labels: Label[] = [
  { id: 'label-1', name: 'Car', color: '#ff0000', classId: 0 },
  { id: 'label-2', name: 'Person', color: '#00ff00', classId: 1 },
]

const imageId = 'img-1'

const sampleAnnotations: Annotation[] = [
  {
    id: 'ann-1',
    imageId,
    labelId: 'label-1',
    type: 'box',
    box: { x: 10, y: 20, width: 100, height: 50 },
  },
  {
    id: 'ann-2',
    imageId,
    labelId: 'label-2',
    type: 'box',
    box: { x: 200, y: 150, width: 80, height: 120 },
  },
]

const classificationAnnotation: Annotation = {
  id: 'ann-cls',
  imageId,
  labelId: 'label-1',
  type: 'classification',
  box: { x: 0, y: 0, width: 0, height: 0 },
}

describe('AnnotationList', () => {
  it('shows "No annotations yet" when empty', () => {
    render(
      <AnnotationList imageId={imageId} labels={labels} />,
      { wrapper: wrapper() },
    )
    expect(screen.getByText(/No annotations yet/)).toBeInTheDocument()
  })

  it('shows annotation count', () => {
    const initial = { [imageId]: sampleAnnotations }
    render(
      <AnnotationList imageId={imageId} labels={labels} />,
      { wrapper: wrapper(initial) },
    )
    expect(screen.getByText('Annotations (2)')).toBeInTheDocument()
  })

  it('lists annotations with label badge', () => {
    const initial = { [imageId]: sampleAnnotations }
    render(
      <AnnotationList imageId={imageId} labels={labels} />,
      { wrapper: wrapper(initial) },
    )
    expect(screen.getByText('Car')).toBeInTheDocument()
    expect(screen.getByText('Person')).toBeInTheDocument()
  })

  it('shows annotation dimensions', () => {
    const initial = { [imageId]: [sampleAnnotations[0]] }
    render(
      <AnnotationList imageId={imageId} labels={labels} />,
      { wrapper: wrapper(initial) },
    )
    // The AnnotationItem renders: x, y — width×height
    // 10, 20 — 100×50  (uses &mdash; and &times; entities)
    expect(screen.getByText(/10, 20/)).toBeInTheDocument()
  })

  it('click selects annotation', async () => {
    const user = userEvent.setup()
    const initial = { [imageId]: sampleAnnotations }
    render(
      <AnnotationList imageId={imageId} labels={labels} />,
      { wrapper: wrapper(initial) },
    )
    const carItem = screen.getByText('Car').closest('div[class*="cursor-pointer"]')!
    await user.click(carItem)
    // After click, the item should have the selected styling
    expect(carItem.className).toContain('bg-blue-50')
  })

  it('delete button removes annotation', async () => {
    const user = userEvent.setup()
    const initial = { [imageId]: [sampleAnnotations[0]] }
    render(
      <AnnotationList imageId={imageId} labels={labels} />,
      { wrapper: wrapper(initial) },
    )
    expect(screen.getByText('Annotations (1)')).toBeInTheDocument()
    const deleteButton = screen.getByTitle('Delete annotation')
    await user.click(deleteButton)
    expect(screen.getByText('Annotations (0)')).toBeInTheDocument()
    expect(screen.getByText(/No annotations yet/)).toBeInTheDocument()
  })

  it('delete button is hidden when locked', () => {
    const initial = { [imageId]: sampleAnnotations }
    render(
      <AnnotationList imageId={imageId} labels={labels} locked />,
      { wrapper: wrapper(initial) },
    )
    expect(screen.queryByTitle('Delete annotation')).not.toBeInTheDocument()
  })

  it('filters out classification-type annotations', () => {
    const initial = { [imageId]: [...sampleAnnotations, classificationAnnotation] }
    render(
      <AnnotationList imageId={imageId} labels={labels} />,
      { wrapper: wrapper(initial) },
    )
    // Only 2 box annotations should be counted, classification is filtered out
    expect(screen.getByText('Annotations (2)')).toBeInTheDocument()
  })

  it('shows zero count when only classification annotations exist', () => {
    const initial = { [imageId]: [classificationAnnotation] }
    render(
      <AnnotationList imageId={imageId} labels={labels} />,
      { wrapper: wrapper(initial) },
    )
    expect(screen.getByText('Annotations (0)')).toBeInTheDocument()
    expect(screen.getByText(/No annotations yet/)).toBeInTheDocument()
  })
})
