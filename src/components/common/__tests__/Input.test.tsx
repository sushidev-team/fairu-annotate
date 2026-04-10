import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Input } from '../Input'

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input aria-label="test input" />)
    expect(screen.getByRole('textbox', { name: 'test input' })).toBeInTheDocument()
  })

  it('passes value prop', () => {
    render(<Input value="hello" onChange={() => {}} aria-label="test input" />)
    const input = screen.getByRole('textbox', { name: 'test input' })
    expect(input).toHaveValue('hello')
  })

  it('fires onChange', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Input onChange={handleChange} aria-label="test input" />)
    const input = screen.getByRole('textbox', { name: 'test input' })
    await user.type(input, 'a')
    expect(handleChange).toHaveBeenCalled()
  })

  it('passes placeholder', () => {
    render(<Input placeholder="Enter text..." />)
    expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument()
  })

  it('passes through additional attributes', () => {
    render(<Input data-testid="custom-input" name="email" type="email" />)
    const input = screen.getByTestId('custom-input')
    expect(input).toHaveAttribute('name', 'email')
    expect(input).toHaveAttribute('type', 'email')
  })

  it('applies custom className alongside default classes', () => {
    const { container } = render(<Input className="extra-class" />)
    const input = container.querySelector('input')
    expect(input!.className).toContain('extra-class')
    expect(input!.className).toContain('w-full')
  })
})
