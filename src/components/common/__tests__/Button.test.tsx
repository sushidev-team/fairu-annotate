import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '../Button'

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('applies variant classes and renders a button element', () => {
    const { container } = render(<Button variant="primary">Primary</Button>)
    const button = container.querySelector('button')
    expect(button).toBeTruthy()
    expect(button!.className).toContain('bg-blue-600')
  })

  it('applies default variant when no variant is specified', () => {
    const { container } = render(<Button>Default</Button>)
    const button = container.querySelector('button')
    expect(button!.className).toContain('bg-white')
  })

  it('handles click events', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    await user.click(screen.getByRole('button', { name: 'Click' }))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disabled state prevents interaction and applies opacity', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Disabled' })
    expect(button).toBeDisabled()
    expect(button.className).toContain('disabled:opacity-50')
    await user.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('active state adds active styling class', () => {
    render(<Button active>Active</Button>)
    const button = screen.getByRole('button', { name: 'Active' })
    expect(button.className).toContain('bg-blue-50')
    expect(button.className).toContain('ring-blue-400')
  })

  it('does not add active styling when active is false', () => {
    render(<Button active={false}>Inactive</Button>)
    const button = screen.getByRole('button', { name: 'Inactive' })
    expect(button.className).not.toContain('bg-blue-50')
  })

  it('passes through additional HTML attributes', () => {
    render(<Button title="my tooltip">With title</Button>)
    const button = screen.getByRole('button', { name: 'With title' })
    expect(button).toHaveAttribute('title', 'my tooltip')
  })

  it('applies size classes', () => {
    const { container } = render(<Button size="sm">Small</Button>)
    const button = container.querySelector('button')
    expect(button!.className).toContain('text-xs')
  })
})
