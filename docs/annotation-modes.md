# Annotation Modes

`@fairu/annotate` supports four annotation modes, matching common computer vision tasks.

## Bounding Boxes (Default)

Standard rectangular annotations for object detection.

```tsx
<ImageAnnotator
  images={images}
  labels={labels}
  annotationMode="box"
/>
```

**How to draw:** Select the Draw tool (`D`), click and drag on the image.

**YOLO output format (detection):**
```
<classId> <centerX> <centerY> <width> <height>
```
All values are normalized to `0–1` relative to the image dimensions.

---

## Polygons

Freeform polygon annotations for instance segmentation.

```tsx
<ImageAnnotator
  images={images}
  labels={labels}
  annotationMode="polygon"
/>
```

**How to draw:** Select the Polygon tool (`P`), click to place points. Click near the first point (within 12px) to close the shape, or press `Escape` to cancel.

**YOLO output format (segmentation):**
```
<classId> <x1> <y1> <x2> <y2> <x3> <y3> ...
```
Each point is normalized to `0–1`.

---

## Oriented Bounding Boxes (OBB)

Rotated rectangles defined by four corner points. Useful for objects at arbitrary angles (aerial imagery, documents, etc.).

```tsx
<ImageAnnotator
  images={images}
  labels={labels}
  annotationMode="obb"
/>
```

**How to draw:** Works like polygon mode, but automatically constrains to exactly 4 points forming a rotated rectangle.

**YOLO output format (OBB):**
```
<classId> <x1> <y1> <x2> <y2> <x3> <y3> <x4> <y4>
```

---

## Classification

Image-level labels (no spatial annotations). The user assigns one or more labels to the entire image.

```tsx
<ImageAnnotator
  images={images}
  labels={labels}
  mode="classify"
  labelKeyBindings={{
    'cat': 'q',
    'dog': 'w',
    'bird': 'e',
  }}
/>
```

Setting `mode="classify"` switches the UI:

- The drawing toolbar is replaced by a classification panel
- Labels appear as toggleable buttons
- Optional `labelKeyBindings` maps label IDs to keyboard keys for fast labeling

**YOLO output format (classification):**
```
<classId>
```
One line per assigned label.

---

## Choosing the YOLO Export Format

By default, the format is auto-detected based on annotation types. You can also set it explicitly:

```tsx
<ImageAnnotator
  images={images}
  labels={labels}
  yoloFormat="detection"      // or "segmentation", "obb", "auto"
/>
```

| Value          | Output Format                     | When to use                              |
| -------------- | --------------------------------- | ---------------------------------------- |
| `"detection"`  | `classId cx cy w h`              | Standard object detection (YOLOv5/v8)    |
| `"segmentation"` | `classId x1 y1 x2 y2 ...`     | Instance segmentation                    |
| `"obb"`        | `classId x1 y1 x2 y2 x3 y3 x4 y4` | Oriented bounding boxes (YOLOv8-OBB) |
| `"auto"`       | Depends on annotation type        | Mixed annotations in one project         |

---

## Mixing Modes

You can change `annotationMode` at any time. Previously drawn annotations are preserved — a bounding box stays a bounding box even if you switch to polygon mode.

The `yoloFormat="auto"` setting handles mixed annotation types by choosing the appropriate format per annotation during export.
