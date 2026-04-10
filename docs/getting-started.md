# Getting Started

A step-by-step guide to integrating `@fairu/annotate` into your React project.

## Installation

```bash
npm install @fairu/annotate
```

**Peer dependencies** (must already be in your project):

- `react` >= 18.0.0
- `react-dom` >= 18.0.0

## Minimal Example

```tsx
import { ImageAnnotator } from '@fairu/annotate'
import '@fairu/annotate/styles.css'

const labels = [
  { id: 'cat', name: 'Cat', color: '#FF6B6B', classId: 0 },
  { id: 'dog', name: 'Dog', color: '#4ECDC4', classId: 1 },
]

const images = [
  { id: 'img-1', src: '/photos/sample.jpg', name: 'Sample' },
]

export default function App() {
  return (
    <div style={{ height: '100vh' }}>
      <ImageAnnotator images={images} labels={labels} />
    </div>
  )
}
```

> **Important:** The component fills its parent container. Make sure the parent has a defined height (e.g. `height: 100vh` or a fixed pixel value).

## Handling Annotation Changes

Use `onAnnotationsChange` to react whenever the user creates, moves, resizes, or deletes an annotation:

```tsx
<ImageAnnotator
  images={images}
  labels={labels}
  onAnnotationsChange={(imageId, annotations) => {
    console.log(`Image ${imageId} now has ${annotations.length} annotations`)
    // Persist to your backend, state, etc.
  }}
/>
```

## Exporting in YOLO Format

The user can press `Ctrl+S` to trigger an export. Provide an `onExport` callback to receive the data:

```tsx
<ImageAnnotator
  images={images}
  labels={labels}
  onExport={(exportData) => {
    exportData.forEach(({ imageName, yoloTxt }) => {
      console.log(`${imageName}.txt:\n${yoloTxt}`)
    })
  }}
/>
```

Each item in the `exportData` array contains:

| Field         | Type           | Description                                      |
| ------------- | -------------- | ------------------------------------------------ |
| `imageId`     | `string`       | ID of the image                                  |
| `imageName`   | `string`       | Name of the image                                |
| `yoloTxt`     | `string`       | YOLO-formatted text (one annotation per line)    |
| `annotations` | `Annotation[]` | Raw annotation objects                           |
| `format`      | `string`       | The YOLO format used (`detection`, `segmentation`, `obb`, `auto`) |

## Loading Existing Annotations

Pass previously saved annotations via `initialAnnotations`, keyed by image ID:

```tsx
<ImageAnnotator
  images={images}
  labels={labels}
  initialAnnotations={{
    'img-1': [
      {
        id: 'ann-1',
        imageId: 'img-1',
        labelId: 'cat',
        type: 'box',
        box: { x: 50, y: 30, width: 200, height: 150 },
      },
    ],
  }}
/>
```

## Multiple Images

Pass an array of images. The component renders a pagination bar automatically:

```tsx
const images = [
  { id: '1', src: '/photo-1.jpg', name: 'Photo 1' },
  { id: '2', src: '/photo-2.jpg', name: 'Photo 2' },
  { id: '3', src: '/photo-3.jpg', name: 'Photo 3' },
]

<ImageAnnotator images={images} labels={labels} />
```

Users can navigate with the pagination controls or `Arrow Left` / `Arrow Right` keys.

## Next Steps

- [Annotation Modes](./annotation-modes.md) — Bounding boxes, polygons, OBB, and classification
- [Tag Management](./tag-management.md) — Dynamic label creation, search, and deletion
- [Keyboard Shortcuts](./keyboard-shortcuts.md) — Default shortcuts and how to customize them
- [YOLO Format Reference](./yolo-format.md) — Detection, segmentation, OBB, and auto-detection
- [API Reference](./api-reference.md) — Full props, types, and utility functions
