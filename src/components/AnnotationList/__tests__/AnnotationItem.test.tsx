import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AnnotationItem } from '../AnnotationItem'
import type { Annotation } from '../../../types/annotations'
import type { Label } from '../../../types/labels'

const baseAnnotation: Annotation = {
  id: 'a1',
  imageId: 'img1',
  labelId: 'l1',
  type: 'box',
  box: { x: 10.4, y: 20.7, width: 100.3, height: 80.9 },
}

const label: Label = { id: 'l1', name: 'Cat', color: '#ff0000', classId: 0 }

describe('AnnotationItem', () => {
  it('renders label badge with name', () => {
    render(
      <AnnotationItem
        annotation={baseAnnotation}
        label={label}
        selected={false}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    expect(screen.getByText('Cat')).toBeInTheDocument()
  })

  it('shows rounded box dimensions', () => {
    render(
      <AnnotationItem
        annotation={baseAnnotation}
        label={label}
        selected={false}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    // x=10, y=21, width=100, height=81 (rounded)
    expect(screen.getByText(/10, 21/)).toBeInTheDocument()
    expect(screen.getByText(/100/)).toBeInTheDocument()
    expect(screen.getByText(/81/)).toBeInTheDocument()
  })

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn()
    render(
      <AnnotationItem
        annotation={baseAnnotation}
        label={label}
        selected={false}
        onSelect={onSelect}
        onDelete={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByText('Cat'))
    expect(onSelect).toHaveBeenCalledOnce()
  })

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn()
    const onSelect = vi.fn()
    render(
      <AnnotationItem
        annotation={baseAnnotation}
        label={label}
        selected={false}
        onSelect={onSelect}
        onDelete={onDelete}
      />,
    )

    const deleteButton = screen.getByTitle('Delete annotation')
    fireEvent.click(deleteButton)

    expect(onDelete).toHaveBeenCalledOnce()
    // stopPropagation should prevent onSelect from firing
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('hides delete button when locked', () => {
    render(
      <AnnotationItem
        annotation={baseAnnotation}
        label={label}
        selected={false}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        locked
      />,
    )

    expect(screen.queryByTitle('Delete annotation')).not.toBeInTheDocument()
  })

  it('applies selected styling class', () => {
    const { container } = render(
      <AnnotationItem
        annotation={baseAnnotation}
        label={label}
        selected={true}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    const item = container.firstElementChild as HTMLElement
    expect(item.className).toContain('bg-blue-50')
    expect(item.className).toContain('ring-blue-300')
  })

  it('handles undefined label (no badge shown)', () => {
    render(
      <AnnotationItem
        annotation={baseAnnotation}
        label={undefined}
        selected={false}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    expect(screen.queryByText('Cat')).not.toBeInTheDocument()
    // Dimensions should still render
    expect(screen.getByText(/10, 21/)).toBeInTheDocument()
  })
})
