import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import {
  IconPencil,
  IconCursor,
  IconTrash,
  IconPlus,
  IconSearch,
  IconBoundingBox,
} from '../Icons'

const icons = [
  { name: 'IconPencil', Component: IconPencil },
  { name: 'IconCursor', Component: IconCursor },
  { name: 'IconTrash', Component: IconTrash },
  { name: 'IconPlus', Component: IconPlus },
  { name: 'IconSearch', Component: IconSearch },
  { name: 'IconBoundingBox', Component: IconBoundingBox },
]

describe('Icons', () => {
  icons.forEach(({ name, Component }) => {
    describe(name, () => {
      it('renders an SVG element', () => {
        const { container } = render(<Component />)
        const svg = container.querySelector('svg')
        expect(svg).toBeTruthy()
        expect(svg!.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg')
      })

      it('applies className prop', () => {
        const { container } = render(<Component className="w-5 h-5 text-red-500" />)
        const svg = container.querySelector('svg')
        expect(svg!.getAttribute('class')).toBe('w-5 h-5 text-red-500')
      })
    })
  })

  it('renders without className when none is provided', () => {
    const { container } = render(<IconPencil />)
    const svg = container.querySelector('svg')
    expect(svg!.getAttribute('class')).toBeNull()
  })

  it('all tested icons use stroke-based rendering by default', () => {
    icons.forEach(({ Component }) => {
      const { container } = render(<Component />)
      const svg = container.querySelector('svg')
      expect(svg!.getAttribute('fill')).toBe('none')
      expect(svg!.getAttribute('stroke')).toBe('currentColor')
    })
  })
})
