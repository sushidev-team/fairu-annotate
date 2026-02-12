# fairu-annotate

React component library for annotating images in YOLO format (Object Detection, Segmentation, OBB).

## Features

- **Bounding Box, Polygon & OBB annotations** on images
- **YOLO format** import/export (Detection, Segmentation, Oriented Bounding Box)
- **Hybrid Canvas + SVG** architecture (Canvas for image rendering, SVG for interactive boxes)
- **Responsive canvas** — auto-fits to container with retina support
- **Undo/Redo** (50-step history via Zustand)
- **Keyboard shortcuts** (Draw, Select, Pan, Delete, Zoom, Quick Labels 1-9)
- **Tag management** with async search (endpoint-agnostic via callback props)
- **Multi-image pagination** with per-image annotations
- **Library build** — ES + CJS, React/ReactDOM as peerDependencies

## Tech Stack

| Area | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 6 (Library Mode) |
| Styling | TailwindCSS v4 (Catalyst style) |
| State | Zustand |
| Storybook | Storybook 10 |
| Icons | Streamline-style SVG |
| Testing | Vitest |

## Install

```bash
npm install fairu-annotate
```

## Usage

```tsx
import { ImageAnnotator } from 'fairu-annotate'
import 'fairu-annotate/styles.css'

const labels = [
  { id: 'cat', name: 'Cat', color: '#FF6B6B', classId: 0 },
  { id: 'dog', name: 'Dog', color: '#4ECDC4', classId: 1 },
]

const images = [
  { id: 'img-1', src: '/photo.jpg', name: 'Photo 1' },
]

function App() {
  return (
    <div style={{ height: '100vh' }}>
      <ImageAnnotator
        images={images}
        labels={labels}
        onAnnotationsChange={(imageId, annotations) => {
          console.log('Annotations changed:', imageId, annotations)
        }}
        onExport={(data) => {
          // data[].yoloTxt contains the YOLO format string
          console.log('Export:', data)
        }}
      />
    </div>
  )
}
```

## Props

| Prop | Type | Description |
|---|---|---|
| `images` | `{ id, src, name }[]` | Images to annotate |
| `labels` | `Label[]` | Available labels with `id`, `name`, `color`, `classId` |
| `initialAnnotations` | `Record<string, Annotation[]>` | Pre-loaded annotations keyed by imageId |
| `onAnnotationsChange` | `(imageId, annotations) => void` | Called when annotations change |
| `onExport` | `(data: ExportData[]) => void` | Called on export (Ctrl+S) |
| `onTagSearch` | `(params) => Promise<SearchResult>` | Remote tag search (optional) |
| `onTagCreate` | `(name, color?) => Promise<Label>` | Create new label (optional) |
| `onTagDelete` | `(id) => Promise<void>` | Delete label (optional) |
| `annotationMode` | `'box' \| 'polygon' \| 'obb'` | Annotation drawing mode |
| `yoloFormat` | `'detection' \| 'segmentation' \| 'obb' \| 'auto'` | YOLO export format |
| `keyboardShortcuts` | `KeyboardShortcutMap` | Override default shortcuts |

## YOLO Formats

```
# Detection (class_id center_x center_y width height)
0 0.500000 0.400000 0.250000 0.300000

# Segmentation (class_id x1 y1 x2 y2 x3 y3 ...)
0 0.1 0.2 0.3 0.1 0.5 0.4 0.3 0.6 0.1 0.4

# OBB (class_id x1 y1 x2 y2 x3 y3 x4 y4)
0 0.1 0.2 0.5 0.2 0.5 0.6 0.1 0.6
```

All values are normalized (0-1). Use `parseYoloAutoTxt()` for auto-format detection.

## Keyboard Shortcuts

| Action | Key |
|---|---|
| Draw Tool | `D` |
| Select Tool | `V` |
| Pan Tool | `H` |
| Delete Annotation | `Delete` / `Backspace` |
| Undo / Redo | `Ctrl+Z` / `Ctrl+Shift+Z` |
| Next / Previous Image | `Arrow Right` / `Arrow Left` |
| Zoom In / Out | `Ctrl+=` / `Ctrl+-` |
| Quick Label 1-9 | `1` - `9` |
| Export | `Ctrl+S` |

## Development

```bash
npm install
npm run storybook    # Component playground on localhost:6006
npm run test         # Run 125 tests
npm run build        # Library build to dist/
```

## License

MIT
