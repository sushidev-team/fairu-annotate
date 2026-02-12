import type { Meta, StoryObj } from '@storybook/react-vite'
import { AnnotationList } from './AnnotationList'
import { StoreProvider } from '../../stores/provider'

const labels = [
  { id: 'cat', name: 'Cat', color: '#FF6B6B', classId: 0 },
  { id: 'dog', name: 'Dog', color: '#4ECDC4', classId: 1 },
]

const annotations = {
  'img-1': [
    { id: 'a1', imageId: 'img-1', labelId: 'cat', box: { x: 10, y: 20, width: 100, height: 80 } },
    { id: 'a2', imageId: 'img-1', labelId: 'dog', box: { x: 200, y: 150, width: 120, height: 90 } },
  ],
}

const meta: Meta<typeof AnnotationList> = {
  title: 'Components/AnnotationList',
  component: AnnotationList,
  decorators: [
    (Story) => (
      <StoreProvider initialAnnotations={annotations}>
        <div className="w-64 border border-gray-200 rounded-lg p-2">
          <Story />
        </div>
      </StoreProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof AnnotationList>

export const WithAnnotations: Story = {
  args: { imageId: 'img-1', labels },
}

export const Empty: Story = {
  args: { imageId: 'img-empty', labels },
}
