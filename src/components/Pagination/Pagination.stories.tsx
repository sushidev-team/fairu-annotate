import type { Meta, StoryObj } from '@storybook/react-vite'
import { Pagination } from './Pagination'
import { StoreProvider } from '../../stores/provider'

const images = [
  { id: '1', name: 'photo_001.jpg' },
  { id: '2', name: 'photo_002.jpg' },
  { id: '3', name: 'photo_003.jpg' },
  { id: '4', name: 'photo_004.jpg' },
  { id: '5', name: 'photo_005.jpg' },
]

const meta: Meta<typeof Pagination> = {
  title: 'Components/Pagination',
  component: Pagination,
  decorators: [
    (Story) => (
      <StoreProvider>
        <Story />
      </StoreProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Pagination>

export const Default: Story = {
  args: { images },
}

export const SingleImage: Story = {
  args: { images: [{ id: '1', name: 'single.jpg' }] },
}
