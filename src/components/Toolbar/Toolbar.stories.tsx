import type { Meta, StoryObj } from '@storybook/react-vite'
import { Toolbar } from './Toolbar'
import { StoreProvider } from '../../stores/provider'
import { fn } from 'storybook/test'
import type { Label } from '../../types/labels'

const manyLabels: Label[] = Array.from({ length: 1000 }, (_, i) => ({
  id: `label-${i}`,
  name: `Label ${String(i).padStart(4, '0')}`,
  color: `hsl(${(i * 137) % 360}, 70%, 50%)`,
  classId: i,
}))

const meta: Meta<typeof Toolbar> = {
  title: 'Components/Toolbar',
  component: Toolbar,
  decorators: [
    (Story) => (
      <StoreProvider>
        <Story />
      </StoreProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Toolbar>

export const Default: Story = {
  args: {},
}

export const WithExport: Story = {
  args: {
    onExport: fn(),
  },
}

export const WithManyLabels: Story = {
  args: {
    labels: manyLabels,
    onExport: fn(),
  },
}

export const WithFavorites: Story = {
  decorators: [
    (Story) => (
      <StoreProvider initialFavorites={['label-0', 'label-42', 'label-99']}>
        <Story />
      </StoreProvider>
    ),
  ],
  args: {
    labels: manyLabels,
    onExport: fn(),
  },
}
