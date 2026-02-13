import type {
  Annotation,
  BoundingBox,
  PolygonPoint,
  YoloAnnotation,
  YoloOBB,
  YoloSegmentation,
} from '../types/annotations'
import type { Label } from '../types/labels'
import { polygonBounds } from './geometry'

// ---------------------------------------------------------------------------
// Detection format (existing)
// ---------------------------------------------------------------------------

export function toYoloAnnotation(
  box: BoundingBox,
  classId: number,
  imageWidth: number,
  imageHeight: number,
): YoloAnnotation {
  return {
    classId,
    centerX: (box.x + box.width / 2) / imageWidth,
    centerY: (box.y + box.height / 2) / imageHeight,
    width: box.width / imageWidth,
    height: box.height / imageHeight,
  }
}

export function fromYoloAnnotation(
  yolo: YoloAnnotation,
  imageWidth: number,
  imageHeight: number,
): { box: BoundingBox; classId: number } {
  const w = yolo.width * imageWidth
  const h = yolo.height * imageHeight
  return {
    classId: yolo.classId,
    box: {
      x: yolo.centerX * imageWidth - w / 2,
      y: yolo.centerY * imageHeight - h / 2,
      width: w,
      height: h,
    },
  }
}

export function toYoloTxt(
  annotations: Annotation[],
  labels: Label[],
  imageWidth: number,
  imageHeight: number,
): string {
  const labelMap = new Map(labels.map((l) => [l.id, l.classId]))
  return annotations
    .map((a) => {
      const classId = labelMap.get(a.labelId)
      if (classId === undefined) return null

      // Dispatch based on annotation type
      const type = a.type ?? 'box'
      if (type === 'polygon' && a.polygon) {
        return formatSegmentationLine(classId, a.polygon, imageWidth, imageHeight)
      }
      if (type === 'obb' && a.polygon && a.polygon.length === 4) {
        return formatOBBLine(classId, a.polygon, imageWidth, imageHeight)
      }
      // Default: detection format
      const yolo = toYoloAnnotation(a.box, classId, imageWidth, imageHeight)
      return `${yolo.classId} ${yolo.centerX.toFixed(6)} ${yolo.centerY.toFixed(6)} ${yolo.width.toFixed(6)} ${yolo.height.toFixed(6)}`
    })
    .filter(Boolean)
    .join('\n')
}

export function parseYoloTxt(
  txt: string,
  labels: Label[],
  imageWidth: number,
  imageHeight: number,
  imageId: string,
): Annotation[] {
  const classIdMap = new Map(labels.map((l) => [l.classId, l.id]))
  const results: Annotation[] = []
  const lines = txt.trim().split('\n').filter((line) => line.trim())
  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].trim().split(/\s+/)
    if (parts.length < 5) continue
    const yolo: YoloAnnotation = {
      classId: parseInt(parts[0], 10),
      centerX: parseFloat(parts[1]),
      centerY: parseFloat(parts[2]),
      width: parseFloat(parts[3]),
      height: parseFloat(parts[4]),
    }
    const labelId = classIdMap.get(yolo.classId)
    if (!labelId) continue
    const { box } = fromYoloAnnotation(yolo, imageWidth, imageHeight)
    results.push({
      id: `imported-${imageId}-${i}`,
      imageId,
      labelId,
      type: 'box',
      box,
    })
  }
  return results
}

// ---------------------------------------------------------------------------
// Segmentation format
// ---------------------------------------------------------------------------

export function toYoloSegmentation(
  polygon: PolygonPoint[],
  classId: number,
  imageWidth: number,
  imageHeight: number,
): YoloSegmentation {
  return {
    classId,
    points: polygon.map((p) => ({
      x: p.x / imageWidth,
      y: p.y / imageHeight,
    })),
  }
}

export function fromYoloSegmentation(
  seg: YoloSegmentation,
  imageWidth: number,
  imageHeight: number,
): { polygon: PolygonPoint[]; box: BoundingBox; classId: number } {
  const polygon = seg.points.map((p) => ({
    x: p.x * imageWidth,
    y: p.y * imageHeight,
  }))
  const box = polygonBounds(polygon)
  return { polygon, box, classId: seg.classId }
}

function formatSegmentationLine(
  classId: number,
  polygon: PolygonPoint[],
  imageWidth: number,
  imageHeight: number,
): string {
  const coords = polygon.map((p) => `${(p.x / imageWidth).toFixed(6)} ${(p.y / imageHeight).toFixed(6)}`).join(' ')
  return `${classId} ${coords}`
}

export function toYoloSegmentationTxt(
  annotations: Annotation[],
  labels: Label[],
  imageWidth: number,
  imageHeight: number,
): string {
  const labelMap = new Map(labels.map((l) => [l.id, l.classId]))
  return annotations
    .map((a) => {
      const classId = labelMap.get(a.labelId)
      if (classId === undefined) return null
      if (!a.polygon || a.polygon.length < 3) return null
      return formatSegmentationLine(classId, a.polygon, imageWidth, imageHeight)
    })
    .filter(Boolean)
    .join('\n')
}

export function parseYoloSegmentationTxt(
  txt: string,
  labels: Label[],
  imageWidth: number,
  imageHeight: number,
  imageId: string,
): Annotation[] {
  const classIdMap = new Map(labels.map((l) => [l.classId, l.id]))
  const results: Annotation[] = []
  const lines = txt.trim().split('\n').filter((line) => line.trim())
  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].trim().split(/\s+/)
    // Need at least classId + 3 pairs of coordinates (7 values)
    if (parts.length < 7 || parts.length % 2 === 0) continue
    const classId = parseInt(parts[0], 10)
    const labelId = classIdMap.get(classId)
    if (!labelId) continue

    const points: PolygonPoint[] = []
    for (let j = 1; j < parts.length; j += 2) {
      points.push({
        x: parseFloat(parts[j]) * imageWidth,
        y: parseFloat(parts[j + 1]) * imageHeight,
      })
    }

    const box = polygonBounds(points)
    results.push({
      id: `imported-seg-${imageId}-${i}`,
      imageId,
      labelId,
      type: 'polygon',
      box,
      polygon: points,
    })
  }
  return results
}

// ---------------------------------------------------------------------------
// OBB (Oriented Bounding Box) format
// ---------------------------------------------------------------------------

export function toYoloOBB(
  points: [PolygonPoint, PolygonPoint, PolygonPoint, PolygonPoint],
  classId: number,
  imageWidth: number,
  imageHeight: number,
): YoloOBB {
  return {
    classId,
    points: points.map((p) => ({
      x: p.x / imageWidth,
      y: p.y / imageHeight,
    })) as YoloOBB['points'],
  }
}

export function fromYoloOBB(
  obb: YoloOBB,
  imageWidth: number,
  imageHeight: number,
): { polygon: PolygonPoint[]; box: BoundingBox; classId: number } {
  const polygon = obb.points.map((p) => ({
    x: p.x * imageWidth,
    y: p.y * imageHeight,
  }))
  const box = polygonBounds(polygon)
  return { polygon, box, classId: obb.classId }
}

function formatOBBLine(
  classId: number,
  points: PolygonPoint[],
  imageWidth: number,
  imageHeight: number,
): string {
  const coords = points
    .slice(0, 4)
    .map((p) => `${(p.x / imageWidth).toFixed(6)} ${(p.y / imageHeight).toFixed(6)}`)
    .join(' ')
  return `${classId} ${coords}`
}

export function toYoloOBBTxt(
  annotations: Annotation[],
  labels: Label[],
  imageWidth: number,
  imageHeight: number,
): string {
  const labelMap = new Map(labels.map((l) => [l.id, l.classId]))
  return annotations
    .map((a) => {
      const classId = labelMap.get(a.labelId)
      if (classId === undefined) return null
      if (!a.polygon || a.polygon.length !== 4) return null
      return formatOBBLine(classId, a.polygon, imageWidth, imageHeight)
    })
    .filter(Boolean)
    .join('\n')
}

export function parseYoloOBBTxt(
  txt: string,
  labels: Label[],
  imageWidth: number,
  imageHeight: number,
  imageId: string,
): Annotation[] {
  const classIdMap = new Map(labels.map((l) => [l.classId, l.id]))
  const results: Annotation[] = []
  const lines = txt.trim().split('\n').filter((line) => line.trim())
  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].trim().split(/\s+/)
    // classId + 4 pairs of coordinates = 9 values
    if (parts.length !== 9) continue
    const classId = parseInt(parts[0], 10)
    const labelId = classIdMap.get(classId)
    if (!labelId) continue

    const points: PolygonPoint[] = []
    for (let j = 1; j < 9; j += 2) {
      points.push({
        x: parseFloat(parts[j]) * imageWidth,
        y: parseFloat(parts[j + 1]) * imageHeight,
      })
    }

    const box = polygonBounds(points)
    results.push({
      id: `imported-obb-${imageId}-${i}`,
      imageId,
      labelId,
      type: 'obb',
      box,
      polygon: points,
    })
  }
  return results
}

// ---------------------------------------------------------------------------
// Auto-detect format
// ---------------------------------------------------------------------------

export type YoloFormat = 'detection' | 'segmentation' | 'obb'

/**
 * Detects the YOLO format of a single line based on the number of values.
 * - 5 values (classId + 4) = detection
 * - 9 values (classId + 8) = OBB (4 corner points)
 * - >9 values with odd count (classId + pairs) = segmentation
 */
export function detectYoloFormat(line: string): YoloFormat | null {
  const parts = line.trim().split(/\s+/)
  const count = parts.length
  if (count === 5) return 'detection'
  if (count === 9) return 'obb'
  if (count > 9 && count % 2 === 1) return 'segmentation'
  return null
}

/**
 * Parses YOLO annotation text that may contain mixed formats.
 * Each line is auto-detected and parsed according to its format.
 */
export function parseYoloAutoTxt(
  txt: string,
  labels: Label[],
  imageWidth: number,
  imageHeight: number,
  imageId: string,
): Annotation[] {
  const classIdMap = new Map(labels.map((l) => [l.classId, l.id]))
  const results: Annotation[] = []
  const lines = txt.trim().split('\n').filter((line) => line.trim())
  for (let i = 0; i < lines.length; i++) {
    const format = detectYoloFormat(lines[i])
    if (!format) continue

    const parts = lines[i].trim().split(/\s+/)
    const classId = parseInt(parts[0], 10)
    const labelId = classIdMap.get(classId)
    if (!labelId) continue

    if (format === 'detection') {
      const yolo: YoloAnnotation = {
        classId,
        centerX: parseFloat(parts[1]),
        centerY: parseFloat(parts[2]),
        width: parseFloat(parts[3]),
        height: parseFloat(parts[4]),
      }
      const { box } = fromYoloAnnotation(yolo, imageWidth, imageHeight)
      results.push({
        id: `imported-${imageId}-${i}`,
        imageId,
        labelId,
        type: 'box',
        box,
      })
      continue
    }

    // Parse polygon points for both OBB and segmentation
    const points: PolygonPoint[] = []
    for (let j = 1; j < parts.length; j += 2) {
      points.push({
        x: parseFloat(parts[j]) * imageWidth,
        y: parseFloat(parts[j + 1]) * imageHeight,
      })
    }
    const box = polygonBounds(points)

    if (format === 'obb') {
      results.push({
        id: `imported-obb-${imageId}-${i}`,
        imageId,
        labelId,
        type: 'obb',
        box,
        polygon: points,
      })
    } else {
      // segmentation
      results.push({
        id: `imported-seg-${imageId}-${i}`,
        imageId,
        labelId,
        type: 'polygon',
        box,
        polygon: points,
      })
    }
  }
  return results
}

// ---------------------------------------------------------------------------
// Classification format
// ---------------------------------------------------------------------------

/**
 * Converts classification annotations to YOLO classification format.
 * Outputs one class ID per line.
 */
export function toYoloClassificationTxt(
  annotations: Annotation[],
  labels: Label[],
): string {
  const labelMap = new Map(labels.map((l) => [l.id, l.classId]))
  return annotations
    .filter((a) => a.type === 'classification')
    .map((a) => {
      const classId = labelMap.get(a.labelId)
      if (classId === undefined) return null
      return `${classId}`
    })
    .filter(Boolean)
    .join('\n')
}
