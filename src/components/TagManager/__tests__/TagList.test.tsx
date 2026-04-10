import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { TagList } from '../TagList'
import { StoreProvider } from '../../../stores/provider'
import type { Label } from '../../../types/labels'

const labels: Label[] = [
  { id: 'l1', name: 'cat', color: '#FF6B6B', classId: 0 },
  { id: 'l2', name: 'dog', color: '#4ECDC4', classId: 1 },
]

function Wrapper({ children }: { children: React.ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>
}

function renderWithStore(ui: React.ReactElement) {
  return render(ui, { wrapper: Wrapper })
}

describe('TagList', () => {
  it('shows "No labels found" for empty labels', () => {
    renderWithStore(
      <TagList labels={[]} activeLabelId={null} onSelect={vi.fn()} />,
    )

    expect(screen.getByText('No labels found')).toBeInTheDocument()
  })

  it('renders label names', () => {
    renderWithStore(
      <TagList labels={labels} activeLabelId={null} onSelect={vi.fn()} />,
    )

    expect(screen.getByText('cat')).toBeInTheDocument()
    expect(screen.getByText('dog')).toBeInTheDocument()
  })

  it('calls onSelect when clicking a label row', () => {
    const onSelect = vi.fn()
    renderWithStore(
      <TagList labels={labels} activeLabelId={null} onSelect={onSelect} />,
    )

    fireEvent.click(screen.getByText('cat'))
    expect(onSelect).toHaveBeenCalledWith('l1')
  })

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn()
    const onSelect = vi.fn()
    renderWithStore(
      <TagList
        labels={labels}
        activeLabelId={null}
        onSelect={onSelect}
        onDelete={onDelete}
      />,
    )

    const deleteButton = screen.getByTitle('Delete cat')
    fireEvent.click(deleteButton)

    expect(onDelete).toHaveBeenCalledWith('l1')
    // stopPropagation should prevent onSelect from firing
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('does not show delete button when onDelete is not provided', () => {
    renderWithStore(
      <TagList labels={labels} activeLabelId={null} onSelect={vi.fn()} />,
    )

    expect(screen.queryByTitle('Delete cat')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Delete dog')).not.toBeInTheDocument()
  })

  it('star button adds label to favorites', async () => {
    const user = userEvent.setup()
    renderWithStore(
      <TagList labels={labels} activeLabelId={null} onSelect={vi.fn()} />,
    )

    const starButtons = screen.getAllByTitle('Add to favorites')
    await user.click(starButtons[0])

    // After clicking, the first label should now be a favorite
    // The button title should change to "Remove from favorites"
    expect(screen.getAllByTitle('Remove from favorites')).toHaveLength(1)
  })

  it('active label has highlighted style', () => {
    const { container } = renderWithStore(
      <TagList labels={labels} activeLabelId="l1" onSelect={vi.fn()} />,
    )

    // The active label row should have the highlight classes
    const rows = container.querySelectorAll('.cursor-pointer')
    const activeRow = rows[0] as HTMLElement
    expect(activeRow.className).toContain('bg-blue-50')
    expect(activeRow.className).toContain('ring-blue-300')

    // The non-active label should not have those classes
    const inactiveRow = rows[1] as HTMLElement
    expect(inactiveRow.className).not.toContain('bg-blue-50')
  })

  it('star button removes label from favorites when already a favorite', async () => {
    const user = userEvent.setup()
    renderWithStore(
      <TagList labels={labels} activeLabelId={null} onSelect={vi.fn()} />,
    )

    // First, add to favorites
    const starButtons = screen.getAllByTitle('Add to favorites')
    await user.click(starButtons[0])

    // Now label should be a favorite
    const removeButton = screen.getByTitle('Remove from favorites')
    expect(removeButton).toBeInTheDocument()

    // Click again to remove from favorites
    await user.click(removeButton)

    // Should now have "Add to favorites" for both labels again
    const addButtons = screen.getAllByTitle('Add to favorites')
    expect(addButtons).toHaveLength(2)
  })
})
