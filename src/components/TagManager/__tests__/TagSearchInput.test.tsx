import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TagSearchInput } from '../TagSearchInput'

describe('TagSearchInput', () => {
  it('renders input with placeholder "Search labels..."', () => {
    render(<TagSearchInput value="" onChange={vi.fn()} />)

    expect(screen.getByPlaceholderText('Search labels...')).toBeInTheDocument()
  })

  it('shows search icon', () => {
    const { container } = render(<TagSearchInput value="" onChange={vi.fn()} />)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('fires onChange when typing', () => {
    const onChange = vi.fn()
    render(<TagSearchInput value="" onChange={onChange} />)

    const input = screen.getByPlaceholderText('Search labels...')
    fireEvent.change(input, { target: { value: 'dog' } })

    expect(onChange).toHaveBeenCalledWith('dog')
  })

  it('shows loading spinner when loading=true', () => {
    const { container } = render(
      <TagSearchInput value="" onChange={vi.fn()} loading={true} />,
    )

    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('does not show spinner when loading=false', () => {
    const { container } = render(
      <TagSearchInput value="" onChange={vi.fn()} loading={false} />,
    )

    const spinner = container.querySelector('.animate-spin')
    expect(spinner).not.toBeInTheDocument()
  })
})
