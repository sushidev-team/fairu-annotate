import type { Meta, StoryObj } from '@storybook/react-vite'
import { TagManager } from './TagManager'
import { StoreProvider } from '../../stores/provider'
import type { Label } from '../../types/labels'
import { useState } from 'react'

const defaultLabels: Label[] = [
  { id: 'cat', name: 'Cat', color: '#FF6B6B', classId: 0 },
  { id: 'dog', name: 'Dog', color: '#4ECDC4', classId: 1 },
  { id: 'bird', name: 'Bird', color: '#45B7D1', classId: 2 },
  { id: 'car', name: 'Car', color: '#96CEB4', classId: 3 },
]

const meta: Meta<typeof TagManager> = {
  title: 'Components/TagManager',
  component: TagManager,
  decorators: [
    (Story) => (
      <StoreProvider>
        <div className="w-64 border border-gray-200 rounded-lg p-2">
          <Story />
        </div>
      </StoreProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof TagManager>

export const Default: Story = {
  args: { labels: defaultLabels },
}

export const WithCreate: Story = {
  args: {
    labels: defaultLabels,
    onTagCreate: async (name, color) => {
      await new Promise((r) => setTimeout(r, 300))
      return { id: `new-${Date.now()}`, name, color: color ?? '#999', classId: defaultLabels.length }
    },
    onTagDelete: async (id) => {
      await new Promise((r) => setTimeout(r, 200))
    },
  },
}

export const WithRemoteSearch: Story = {
  args: {
    labels: [],
    onTagSearch: async ({ query, page, limit }) => {
      await new Promise((r) => setTimeout(r, 500))
      const all = defaultLabels.filter((l) => l.name.toLowerCase().includes(query.toLowerCase()))
      return { labels: all.slice(0, limit), total: all.length, hasMore: false }
    },
    onTagCreate: async (name, color) => {
      await new Promise((r) => setTimeout(r, 300))
      return { id: `new-${Date.now()}`, name, color: color ?? '#999', classId: 99 }
    },
  },
}
