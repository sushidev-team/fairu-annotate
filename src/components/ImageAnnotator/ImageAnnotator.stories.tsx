import type { Meta, StoryObj } from '@storybook/react-vite'
import { ImageAnnotator } from './ImageAnnotator'
import type { Label } from '../../types/labels'
import { fn } from 'storybook/test'

const labels: Label[] = [
  { id: 'cat', name: 'Cat', color: '#FF6B6B', classId: 0 },
  { id: 'dog', name: 'Dog', color: '#4ECDC4', classId: 1 },
  { id: 'bird', name: 'Bird', color: '#45B7D1', classId: 2 },
  { id: 'car', name: 'Car', color: '#96CEB4', classId: 3 },
  { id: 'person', name: 'Person', color: '#FFEAA7', classId: 4 },
]

const images = [
  { id: 'img-1', src: 'https://files.fairu.app/9fad6214-3c0e-4f02-a0dd-16e9d42d302b/demo.jpg?width=800', name: 'demo.jpg' },
  { id: 'img-2', src: 'https://picsum.photos/seed/anno2/800/600', name: 'photo_002.jpg' },
  { id: 'img-3', src: 'https://picsum.photos/seed/anno3/800/600', name: 'photo_003.jpg' },
]

const meta: Meta<typeof ImageAnnotator> = {
  title: 'ImageAnnotator',
  component: ImageAnnotator,
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof ImageAnnotator>

export const Default: Story = {
  args: {
    images,
    labels,
    onAnnotationsChange: fn(),
    onExport: fn(),
  },
  render: (args) => (
    <div style={{ height: '100vh' }}>
      <ImageAnnotator {...args} />
    </div>
  ),
}

export const WithInitialAnnotations: Story = {
  args: {
    images,
    labels,
    initialAnnotations: {
      'img-1': [
        { id: 'a1', imageId: 'img-1', labelId: 'cat', box: { x: 100, y: 100, width: 200, height: 150 } },
        { id: 'a2', imageId: 'img-1', labelId: 'dog', box: { x: 400, y: 250, width: 180, height: 200 } },
      ],
    },
    onAnnotationsChange: fn(),
    onExport: fn(),
  },
  render: (args) => (
    <div style={{ height: '100vh' }}>
      <ImageAnnotator {...args} />
    </div>
  ),
}

export const WithTagManagement: Story = {
  args: {
    images,
    labels,
    onAnnotationsChange: fn(),
    onExport: fn(),
    onTagCreate: async (name, color) => {
      await new Promise((r) => setTimeout(r, 300))
      return { id: `new-${Date.now()}`, name, color: color ?? '#999', classId: labels.length }
    },
    onTagDelete: async (id) => {
      await new Promise((r) => setTimeout(r, 200))
    },
    onTagSearch: async ({ query }) => {
      await new Promise((r) => setTimeout(r, 300))
      const filtered = labels.filter((l) => l.name.toLowerCase().includes(query.toLowerCase()))
      return { labels: filtered, total: filtered.length, hasMore: false }
    },
  },
  render: (args) => (
    <div style={{ height: '100vh' }}>
      <ImageAnnotator {...args} />
    </div>
  ),
}

export const PolygonDrawing: Story = {
  args: {
    images,
    labels,
    initialAnnotations: {
      'img-1': [
        {
          id: 'poly-1',
          imageId: 'img-1',
          labelId: 'cat',
          type: 'polygon',
          box: { x: 80, y: 60, width: 250, height: 200 },
          polygon: [
            { x: 200, y: 60 },
            { x: 330, y: 120 },
            { x: 300, y: 260 },
            { x: 150, y: 240 },
            { x: 80, y: 150 },
          ],
        },
        {
          id: 'poly-2',
          imageId: 'img-1',
          labelId: 'dog',
          type: 'polygon',
          box: { x: 400, y: 150, width: 200, height: 180 },
          polygon: [
            { x: 500, y: 150 },
            { x: 600, y: 200 },
            { x: 580, y: 330 },
            { x: 450, y: 310 },
            { x: 400, y: 230 },
          ],
        },
        {
          id: 'box-1',
          imageId: 'img-1',
          labelId: 'car',
          box: { x: 50, y: 350, width: 180, height: 120 },
        },
      ],
    },
    onAnnotationsChange: fn(),
    onExport: (data) => {
      // Log the YOLO output to show the export format
      for (const d of data) {
        console.log(`--- ${d.imageName} (format: ${d.format}) ---`)
        console.log(d.yoloTxt)
        console.log('Annotations:', d.annotations)
      }
    },
  },
  render: (args) => (
    <div style={{ height: '100vh' }}>
      <ImageAnnotator {...args} />
    </div>
  ),
}

export const SingleImage: Story = {
  args: {
    images: [images[0]],
    labels,
    onAnnotationsChange: fn(),
  },
  render: (args) => (
    <div style={{ height: '100vh' }}>
      <ImageAnnotator {...args} />
    </div>
  ),
}

export const ReadOnly: Story = {
  args: {
    images,
    labels,
    readOnly: true,
    initialAnnotations: {
      'img-1': [
        { id: 'a1', imageId: 'img-1', labelId: 'cat', box: { x: 100, y: 100, width: 200, height: 150 } },
        { id: 'a2', imageId: 'img-1', labelId: 'dog', box: { x: 400, y: 250, width: 180, height: 200 } },
      ],
    },
    onAnnotationsChange: fn(),
    onExport: fn(),
  },
  render: (args) => (
    <div style={{ height: '100vh' }}>
      <ImageAnnotator {...args} />
    </div>
  ),
}

export const WithFavorites: Story = {
  args: {
    images,
    labels,
    initialFavorites: ['cat', 'dog', 'bird'],
    onAnnotationsChange: fn(),
    onFavoritesChange: fn(),
    onExport: fn(),
  },
  render: (args) => (
    <div style={{ height: '100vh' }}>
      <ImageAnnotator {...args} />
    </div>
  ),
}

const manyLabels: Label[] = Array.from({ length: 1000 }, (_, i) => ({
  id: `label-${i}`,
  name: `Label ${String(i).padStart(4, '0')}`,
  color: `hsl(${(i * 137) % 360}, 70%, 50%)`,
  classId: i,
}))

export const ManyLabels: Story = {
  args: {
    images,
    labels: manyLabels,
    onAnnotationsChange: fn(),
    onExport: fn(),
  },
  render: (args) => (
    <div style={{ height: '100vh' }}>
      <ImageAnnotator {...args} />
    </div>
  ),
}

export const ManyLabelsWithFavorites: Story = {
  args: {
    images,
    labels: manyLabels,
    initialFavorites: ['label-0', 'label-42', 'label-99'],
    onAnnotationsChange: fn(),
    onFavoritesChange: fn(),
    onExport: fn(),
  },
  render: (args) => (
    <div style={{ height: '100vh' }}>
      <ImageAnnotator {...args} />
    </div>
  ),
}

export const NoIcons: Story = {
  args: {
    images,
    labels,
    showToolbarIcons: false,
    showLabelDots: false,
    onAnnotationsChange: fn(),
    onExport: fn(),
  },
  render: (args) => (
    <div style={{ height: '100vh' }}>
      <ImageAnnotator {...args} />
    </div>
  ),
}

export const WithDataPreview: Story = {
  args: {
    images,
    labels,
    initialAnnotations: {
      'img-1': [
        {
          id: 'poly-1',
          imageId: 'img-1',
          labelId: 'cat',
          type: 'polygon' as const,
          box: { x: 80, y: 60, width: 250, height: 200 },
          polygon: [
            { x: 200, y: 60 },
            { x: 330, y: 120 },
            { x: 300, y: 260 },
            { x: 150, y: 240 },
            { x: 80, y: 150 },
          ],
        },
        { id: 'box-1', imageId: 'img-1', labelId: 'car', box: { x: 50, y: 350, width: 180, height: 120 } },
        { id: 'box-2', imageId: 'img-1', labelId: 'dog', box: { x: 400, y: 250, width: 180, height: 200 } },
      ],
    },
    onAnnotationsChange: fn(),
    onExport: fn(),
  },
  render: (args) => (
    <div style={{ height: '100vh' }}>
      <ImageAnnotator {...args} />
    </div>
  ),
}
