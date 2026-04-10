import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ClassificationList } from '../ClassificationList'
import { StoreProvider } from '../../../stores/provider'
import type { Label } from '../../../types/labels'
import type { Annotation } from '../../../types/annotations'

const labels: Label[] = [
  { id: 'l1', name: 'cat', color: '#f00', classId: 0 },
  { id: 'l2', name: 'dog', color: '#0f0', classId: 1 },
]

const classificationAnnotations: Record<string, Annotation[]> = {
  img1: [
    {
      id: 'c1',
      imageId: 'img1',
      labelId: 'l1',
      type: 'classification' as const,
      box: { x: 0, y: 0, width: 1, height: 1 },
    },
  ],
}

function renderWithStore(
  ui: React.ReactElement,
  initialAnnotations?: Record<string, Annotation[]>,
) {
  return render(
    <StoreProvider initialAnnotations={initialAnnotations}>
      {ui}
    </StoreProvider>,
  )
}

describe('ClassificationList', () => {
  it('shows "No labels defined." when labels empty', () => {
    renderWithStore(
      <ClassificationList
        imageId="img1"
        labels={[]}
        onToggle={vi.fn()}
      />,
    )

    expect(screen.getByText('No labels defined.')).toBeInTheDocument()
  })

  it('lists all labels with name', () => {
    renderWithStore(
      <ClassificationList
        imageId="img1"
        labels={labels}
        onToggle={vi.fn()}
      />,
    )

    expect(screen.getByText('cat')).toBeInTheDocument()
    expect(screen.getByText('dog')).toBeInTheDocument()
  })

  it('shows active state (checkmark) for labels with classification annotations', () => {
    const { container } = renderWithStore(
      <ClassificationList
        imageId="img1"
        labels={labels}
        onToggle={vi.fn()}
      />,
      classificationAnnotations,
    )

    // The "cat" label (l1) has a classification annotation so it should show a checkmark SVG
    const checkmarks = container.querySelectorAll('svg.text-blue-500, svg.text-blue-400')
    // Only one classification annotation exists (for l1/cat), so expect one checkmark
    expect(checkmarks.length).toBeGreaterThanOrEqual(1)

    // The "cat" button should have selected styling
    const catButton = screen.getByText('cat').closest('button') as HTMLElement
    expect(catButton.className).toContain('bg-blue-50')

    // The "dog" button should NOT have selected styling
    const dogButton = screen.getByText('dog').closest('button') as HTMLElement
    expect(dogButton.className).not.toContain('bg-blue-50')
  })

  it('calls onToggle with labelId when clicked', () => {
    const onToggle = vi.fn()
    renderWithStore(
      <ClassificationList
        imageId="img1"
        labels={labels}
        onToggle={onToggle}
      />,
    )

    fireEvent.click(screen.getByText('dog'))
    expect(onToggle).toHaveBeenCalledWith('l2')
  })

  it('disables buttons when locked', () => {
    renderWithStore(
      <ClassificationList
        imageId="img1"
        labels={labels}
        locked
        onToggle={vi.fn()}
      />,
    )

    const catButton = screen.getByText('cat').closest('button') as HTMLButtonElement
    const dogButton = screen.getByText('dog').closest('button') as HTMLButtonElement

    expect(catButton).toBeDisabled()
    expect(dogButton).toBeDisabled()
  })

  it('shows key hint from labelKeyBindings', () => {
    renderWithStore(
      <ClassificationList
        imageId="img1"
        labels={labels}
        labelKeyBindings={{ l1: 'a', l2: 'b' }}
        onToggle={vi.fn()}
      />,
    )

    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('shows classification count', () => {
    renderWithStore(
      <ClassificationList
        imageId="img1"
        labels={labels}
        onToggle={vi.fn()}
      />,
      classificationAnnotations,
    )

    // Header shows "Classification (1)" since one label is active
    expect(screen.getByText('Classification (1)')).toBeInTheDocument()
  })
})
