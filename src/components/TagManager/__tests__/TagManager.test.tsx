import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { TagManager } from '../TagManager'
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

describe('TagManager', () => {
  it('renders "Labels" heading', () => {
    renderWithStore(<TagManager labels={labels} />)

    expect(screen.getByText('Labels')).toBeInTheDocument()
  })

  it('shows label list', () => {
    renderWithStore(<TagManager labels={labels} />)

    expect(screen.getByText('cat')).toBeInTheDocument()
    expect(screen.getByText('dog')).toBeInTheDocument()
  })

  it('shows "Add Label" button when onTagCreate is provided', () => {
    renderWithStore(<TagManager labels={labels} onTagCreate={vi.fn()} />)

    expect(screen.getByText('Add Label')).toBeInTheDocument()
  })

  it('does not show "Add Label" when onTagCreate is not provided', () => {
    renderWithStore(<TagManager labels={labels} />)

    expect(screen.queryByText('Add Label')).not.toBeInTheDocument()
  })

  it('opens create form on "Add Label" click', async () => {
    const user = userEvent.setup()
    renderWithStore(<TagManager labels={labels} onTagCreate={vi.fn()} />)

    await user.click(screen.getByText('Add Label'))

    expect(screen.getByText('New Label')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Color')).toBeInTheDocument()
    expect(screen.getByText('Create')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('cancel closes the create form', async () => {
    const user = userEvent.setup()
    renderWithStore(<TagManager labels={labels} onTagCreate={vi.fn()} />)

    await user.click(screen.getByText('Add Label'))
    expect(screen.getByText('New Label')).toBeInTheDocument()

    await user.click(screen.getByText('Cancel'))
    expect(screen.queryByText('New Label')).not.toBeInTheDocument()
    // "Add Label" button should be visible again
    expect(screen.getByText('Add Label')).toBeInTheDocument()
  })

  it('create calls onTagCreate with name', async () => {
    const onTagCreate = vi.fn().mockResolvedValue({ id: 'l3', name: 'bird', color: '#FF6B6B', classId: 2 })
    const user = userEvent.setup()
    renderWithStore(<TagManager labels={labels} onTagCreate={onTagCreate} />)

    await user.click(screen.getByText('Add Label'))

    const nameInput = screen.getByPlaceholderText('e.g. Cat, Person, Vehicle...')
    await user.type(nameInput, 'bird')
    await user.click(screen.getByText('Create'))

    expect(onTagCreate).toHaveBeenCalledWith('bird', '#FF6B6B')
  })

  it('pressing Enter in name input calls onTagCreate', async () => {
    const onTagCreate = vi.fn().mockResolvedValue({ id: 'l4', name: 'fish', color: '#FF6B6B', classId: 3 })
    const user = userEvent.setup()
    renderWithStore(<TagManager labels={labels} onTagCreate={onTagCreate} />)

    await user.click(screen.getByText('Add Label'))

    const nameInput = screen.getByPlaceholderText('e.g. Cat, Person, Vehicle...')
    await user.type(nameInput, 'fish')
    await user.keyboard('{Enter}')

    expect(onTagCreate).toHaveBeenCalledWith('fish', '#FF6B6B')
  })
})
