import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { Pagination } from '../Pagination'
import { StoreProvider } from '../../../stores/provider'
import type { Annotation } from '../../../types/annotations'

function wrapper(initialAnnotations?: Record<string, Annotation[]>, initialFavorites?: string[]) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <StoreProvider initialAnnotations={initialAnnotations} initialFavorites={initialFavorites}>
        {children}
      </StoreProvider>
    )
  }
}

const twoImages = [
  { id: 'img-1', name: 'photo1.jpg' },
  { id: 'img-2', name: 'photo2.jpg' },
]

const threeImages = [
  { id: 'img-1', name: 'alpha.png' },
  { id: 'img-2', name: 'beta.png' },
  { id: 'img-3', name: 'gamma.png' },
]

describe('Pagination', () => {
  it('returns null for a single image', () => {
    const { container } = render(
      <Pagination images={[{ id: 'img-1', name: 'only.jpg' }]} />,
      { wrapper: wrapper() },
    )
    expect(container.innerHTML).toBe('')
  })

  it('returns null for an empty images array', () => {
    const { container } = render(<Pagination images={[]} />, { wrapper: wrapper() })
    expect(container.innerHTML).toBe('')
  })

  it('shows "1 / N" format', () => {
    render(<Pagination images={twoImages} />, { wrapper: wrapper() })
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })

  it('shows current image name', () => {
    render(<Pagination images={twoImages} />, { wrapper: wrapper() })
    expect(screen.getByText('photo1.jpg')).toBeInTheDocument()
  })

  it('previous button is disabled on first image', () => {
    render(<Pagination images={twoImages} />, { wrapper: wrapper() })
    const prevButton = screen.getByTitle('Previous image')
    expect(prevButton).toBeDisabled()
  })

  it('next button is disabled on last image', async () => {
    const user = userEvent.setup()
    render(<Pagination images={twoImages} />, { wrapper: wrapper() })
    // Navigate to the last image
    await user.click(screen.getByTitle('Next image'))
    const nextButton = screen.getByTitle('Next image')
    expect(nextButton).toBeDisabled()
  })

  it('click next updates index and shows next image', async () => {
    const user = userEvent.setup()
    render(<Pagination images={threeImages} />, { wrapper: wrapper() })
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    expect(screen.getByText('alpha.png')).toBeInTheDocument()

    await user.click(screen.getByTitle('Next image'))

    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    expect(screen.getByText('beta.png')).toBeInTheDocument()
  })

  it('click prev updates index and shows previous image', async () => {
    const user = userEvent.setup()
    render(<Pagination images={threeImages} />, { wrapper: wrapper() })

    // Go to second image
    await user.click(screen.getByTitle('Next image'))
    expect(screen.getByText('2 / 3')).toBeInTheDocument()

    // Go back to first
    await user.click(screen.getByTitle('Previous image'))
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    expect(screen.getByText('alpha.png')).toBeInTheDocument()
  })

  it('next button is not disabled on first image with multiple images', () => {
    render(<Pagination images={twoImages} />, { wrapper: wrapper() })
    const nextButton = screen.getByTitle('Next image')
    expect(nextButton).not.toBeDisabled()
  })
})
