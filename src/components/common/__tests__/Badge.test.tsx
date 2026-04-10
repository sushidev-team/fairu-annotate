import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Badge } from '../Badge'

describe('Badge', () => {
  it('renders as a <span> by default', () => {
    const { container } = render(<Badge color="#ff0000">Label</Badge>)
    const badge = container.firstElementChild
    expect(badge!.tagName).toBe('SPAN')
  })

  it('renders as a <button> when onClick is provided', () => {
    const { container } = render(
      <Badge color="#ff0000" onClick={() => {}}>
        Clickable
      </Badge>,
    )
    const badge = container.firstElementChild
    expect(badge!.tagName).toBe('BUTTON')
  })

  it('shows children text', () => {
    render(<Badge color="#00ff00">Status</Badge>)
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('shows a color dot with the correct background color', () => {
    const { container } = render(<Badge color="#3b82f6">Info</Badge>)
    const dot = container.querySelector('.h-2.w-2.rounded-full')
    expect(dot).toBeTruthy()
    expect(dot!.getAttribute('style')).toContain('background-color: rgb(59, 130, 246)')
  })

  it('fires onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(
      <Badge color="#ff0000" onClick={handleClick}>
        Click me
      </Badge>,
    )
    await user.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies custom className', () => {
    const { container } = render(
      <Badge color="#ff0000" className="my-custom-class">
        Styled
      </Badge>,
    )
    const badge = container.firstElementChild
    expect(badge!.className).toContain('my-custom-class')
  })
})
