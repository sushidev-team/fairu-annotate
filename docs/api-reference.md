# API Reference

Complete reference for all exports of `@fairu/annotate`.

## Components

### `ImageAnnotator`

The main component. Renders the full annotation UI including canvas, toolbar, label selector, annotation list, and pagination.

```tsx
import { ImageAnnotator } from '@fairu/annotate'
```

#### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `images` | `{ id: string; src: string; name: string }[]` | **(required)** | Images to annotate |
| `labels` | `Label[]` | **(required)** | Available labels |
| `initialAnnotations` | `Record<string, Annotation[]>` | `{}` | Pre-loaded annotations keyed by image ID |
| `initialFavorites` | `string[]` | `[]` | Pre-selected favorite label IDs (max 9) |
| `onAnnotationsChange` | `(imageId: string, annotations: Annotation[]) => void` | — | Called when annotations change for an image |
| `onFavoritesChange` | `(favoriteIds: string[]) => void` | — | Called when favorites are reordered |
| `onExport` | `(data: ExportData[]) => void` | — | Called on Ctrl+S export |
| `onTagSearch` | `TagSearchFn` | — | Remote label search |
| `onTagCreate` | `TagCreateFn` | — | Create new label |
| `onTagDelete` | `TagDeleteFn` | — | Delete label |
| `onTagUpdate` | `TagUpdateFn` | — | Update label name/color |
| `keyboardShortcuts` | `KeyboardShortcutMap` | — | Override default shortcuts |
| `annotationMode` | `'box' \| 'polygon' \| 'obb' \| 'classification'` | `'box'` | Drawing mode |
| `yoloFormat` | `'detection' \| 'segmentation' \| 'obb' \| 'auto'` | `'auto'` | Export format |
| `mode` | `'annotate' \| 'classify'` | `'annotate'` | Spatial annotation vs. image classification |
| `readOnly` | `boolean` | `false` | Disable all editing |
| `showToolbarIcons` | `boolean` | `true` | Show icons in toolbar buttons |
| `showLabelDots` | `boolean` | `true` | Show color dots next to labels |
| `labelKeyBindings` | `Record<string, string>` | — | Key-to-label mapping for classification mode |
| `className` | `string` | — | CSS class for the root element |

---

### Sub-Components

These components are exported for advanced composition use cases. They must be rendered inside the `ImageAnnotator` component tree.

| Component | Description |
| --- | --- |
| `Toolbar` | Drawing tool buttons and zoom controls |
| `LabelSelector` | Label dropdown with favorites and search |
| `TagManager` | Label creation, search, and deletion panel |
| `AnnotationList` | List of annotations for the current image |
| `ClassificationList` | Classification label toggle buttons |
| `Pagination` | Image navigation controls |
| `DataPreview` | YOLO export format preview panel |

---

## Types

### Annotation

```ts
interface Annotation {
  id: string
  imageId: string
  labelId: string
  type?: 'box' | 'polygon' | 'obb' | 'classification'
  box: BoundingBox
  polygon?: PolygonPoint[]
}
```

### BoundingBox

```ts
interface BoundingBox {
  x: number       // left edge (pixels)
  y: number       // top edge (pixels)
  width: number   // width (pixels)
  height: number  // height (pixels)
}
```

### PolygonPoint

```ts
interface PolygonPoint {
  x: number
  y: number
}
```

### Label

```ts
interface Label {
  id: string       // unique identifier
  name: string     // display name
  color: string    // hex color (e.g. '#FF6B6B')
  classId: number  // YOLO class ID (0-based)
}
```

### ImageData

```ts
interface ImageData {
  id: string
  src: string
  name: string
  naturalWidth?: number
  naturalHeight?: number
}
```

### ExportData

```ts
interface ExportData {
  imageId: string
  imageName: string
  yoloTxt: string
  annotations: Annotation[]
  format: YoloFormat | 'auto'
}
```

### KeyboardShortcutMap

```ts
interface KeyboardShortcutMap {
  'tool.draw'?: string
  'tool.select'?: string
  'tool.polygon'?: string
  'tool.pan'?: string
  'annotation.delete'?: string
  'history.undo'?: string
  'history.redo'?: string
  'image.next'?: string
  'image.prev'?: string
  'zoom.in'?: string
  'zoom.out'?: string
  'label.quick'?: string
  'export'?: string
  'view.lock'?: string
  'image.confirm'?: string
}
```

### Tag Callback Types

```ts
type TagSearchFn = (params: TagSearchParams) => Promise<TagSearchResult>
type TagCreateFn = (name: string, color?: string) => Promise<Label>
type TagDeleteFn = (id: string) => Promise<void>
type TagUpdateFn = (id: string, updates: Partial<Pick<Label, 'name' | 'color'>>) => Promise<Label>

interface TagSearchParams {
  query: string
  page: number
  limit: number
}

interface TagSearchResult {
  labels: Label[]
  total: number
  hasMore: boolean
}
```

### Other Types

```ts
type Tool = 'draw' | 'polygon' | 'select' | 'pan'
type AnnotationType = 'box' | 'polygon' | 'obb' | 'classification'
type YoloFormat = 'detection' | 'segmentation' | 'obb'
type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'
```

---

## Hooks

### `useYoloExport`

Returns a function that exports all annotations in YOLO format. Must be used within the `ImageAnnotator` component tree.

```ts
const exportAll: () => ExportData[] = useYoloExport()
```

---

## Geometry Utilities

Utility functions for working with bounding boxes and polygons in pixel coordinates.

```ts
import {
  normalizeBox,
  clampBox,
  pointInBox,
  boxesIntersect,
  getResizeHandle,
  applyResize,
  moveBox,
  pointInPolygon,
  polygonBounds,
  closePolygon,
  simplifyPolygon,
} from '@fairu/annotate'
```

| Function | Description |
| --- | --- |
| `normalizeBox(box)` | Ensures positive width/height (flips negative dimensions) |
| `clampBox(box, maxW, maxH)` | Constrains box within image bounds |
| `pointInBox(point, box)` | Tests if a point is inside a bounding box |
| `boxesIntersect(a, b)` | Tests if two bounding boxes overlap |
| `getResizeHandle(point, box)` | Returns which resize handle (corner/edge) a point is near |
| `applyResize(box, handle, dx, dy)` | Returns a new box after resizing by a handle |
| `moveBox(box, dx, dy)` | Returns a new box offset by (dx, dy) |
| `pointInPolygon(point, polygon)` | Tests if a point is inside a polygon |
| `polygonBounds(points)` | Returns the axis-aligned bounding box of a polygon |
| `closePolygon(points)` | Ensures the first and last point match |
| `simplifyPolygon(points, tolerance)` | Reduces polygon complexity (Douglas-Peucker) |

---

## YOLO Format Utilities

See [YOLO Format Reference](./yolo-format.md) for detailed usage and examples.
