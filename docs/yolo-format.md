# YOLO Format Reference

`@fairu/annotate` exports annotations in standard YOLO text format. This page documents the formats and the utility functions available for conversion.

## Supported Formats

### Detection

Standard bounding box format used by YOLOv5, YOLOv8, and others.

```
<classId> <centerX> <centerY> <width> <height>
```

All values are normalized to `0–1` relative to image dimensions.

**Example** (class 0, centered at 50%/40%, 30% wide, 20% tall):
```
0 0.500000 0.400000 0.300000 0.200000
```

### Segmentation

Polygon-based instance segmentation format.

```
<classId> <x1> <y1> <x2> <y2> <x3> <y3> ...
```

All coordinates are normalized to `0–1`. The number of points is variable.

**Example** (class 1, triangle):
```
1 0.100000 0.200000 0.500000 0.100000 0.900000 0.200000
```

### OBB (Oriented Bounding Box)

Rotated rectangle defined by four corner points. Used by YOLOv8-OBB.

```
<classId> <x1> <y1> <x2> <y2> <x3> <y3> <x4> <y4>
```

Always exactly 4 points (8 coordinate values), normalized to `0–1`.

### Classification

One class ID per line, representing image-level labels.

```
<classId>
```

---

## Utility Functions

All utility functions are exported from the package and can be used independently of the UI component.

```ts
import {
  toYoloTxt,
  parseYoloTxt,
  toYoloSegmentationTxt,
  parseYoloSegmentationTxt,
  toYoloOBBTxt,
  parseYoloOBBTxt,
  detectYoloFormat,
  parseYoloAutoTxt,
  toYoloClassificationTxt,
} from '@fairu/annotate'
```

### Detection

```ts
// Annotation + image dimensions → YOLO text line
toYoloTxt(annotation, imageWidth, imageHeight): string

// YOLO text line → YoloAnnotation
parseYoloTxt(line): YoloAnnotation

// Annotation → normalized YoloAnnotation object
toYoloAnnotation(annotation, imageWidth, imageHeight): YoloAnnotation

// YoloAnnotation → pixel Annotation
fromYoloAnnotation(yolo, imageWidth, imageHeight, labelId, imageId): Annotation
```

### Segmentation

```ts
toYoloSegmentationTxt(annotation, imageWidth, imageHeight): string
parseYoloSegmentationTxt(line): YoloSegmentation
toYoloSegmentation(annotation, imageWidth, imageHeight): YoloSegmentation
fromYoloSegmentation(yolo, imageWidth, imageHeight, labelId, imageId): Annotation
```

### OBB

```ts
toYoloOBBTxt(annotation, imageWidth, imageHeight): string
parseYoloOBBTxt(line): YoloOBB
toYoloOBB(annotation, imageWidth, imageHeight): YoloOBB
fromYoloOBB(yolo, imageWidth, imageHeight, labelId, imageId): Annotation
```

### Classification

```ts
toYoloClassificationTxt(classIds: number[]): string
```

### Auto-Detection

```ts
// Detect the format of a YOLO text line
detectYoloFormat(line): 'detection' | 'segmentation' | 'obb'

// Parse a line regardless of format
parseYoloAutoTxt(line): YoloAnnotation | YoloSegmentation | YoloOBB
```

---

## Using the Export Hook

The `useYoloExport` hook provides programmatic access to YOLO export outside of the `onExport` callback:

```tsx
import { useYoloExport } from '@fairu/annotate'

function ExportButton() {
  const exportAll = useYoloExport()

  return (
    <button onClick={() => {
      const data = exportAll()
      // data: ExportData[]
    }}>
      Export YOLO
    </button>
  )
}
```

> **Note:** This hook must be used within the `ImageAnnotator` component tree (it reads from the internal Zustand store).

---

## Importing Existing YOLO Files

To load annotations from existing `.txt` files, parse them and pass as `initialAnnotations`:

```ts
import { parseYoloTxt, fromYoloAnnotation } from '@fairu/annotate'

const yoloContent = `0 0.500000 0.400000 0.300000 0.200000
1 0.200000 0.600000 0.100000 0.150000`

const imageWidth = 1920
const imageHeight = 1080

const annotations = yoloContent
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const yolo = parseYoloTxt(line)
    // Map classId back to your label
    const label = labels.find((l) => l.classId === yolo.classId)
    return fromYoloAnnotation(yolo, imageWidth, imageHeight, label.id, 'img-1')
  })
```

Then pass to the component:

```tsx
<ImageAnnotator
  images={images}
  labels={labels}
  initialAnnotations={{ 'img-1': annotations }}
/>
```
