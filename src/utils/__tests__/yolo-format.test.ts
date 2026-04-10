import { describe, it, expect } from 'vitest'
import {
  toYoloAnnotation,
  fromYoloAnnotation,
  toYoloTxt,
  parseYoloTxt,
  toYoloSegmentation,
  fromYoloSegmentation,
  toYoloSegmentationTxt,
  parseYoloSegmentationTxt,
  toYoloOBB,
  fromYoloOBB,
  toYoloOBBTxt,
  parseYoloOBBTxt,
  detectYoloFormat,
  parseYoloAutoTxt,
  toYoloClassificationTxt,
} from '../yolo-format'
import type { Annotation, BoundingBox, PolygonPoint, YoloAnnotation, YoloSegmentation, YoloOBB } from '../../types/annotations'
import type { Label } from '../../types/labels'

const labels: Label[] = [
  { id: 'label-cat', name: 'cat', color: '#ff0000', classId: 0 },
  { id: 'label-dog', name: 'dog', color: '#00ff00', classId: 1 },
  { id: 'label-bird', name: 'bird', color: '#0000ff', classId: 2 },
]

describe('toYoloAnnotation', () => {
  it('converts a box in the middle of the image', () => {
    const box: BoundingBox = { x: 100, y: 100, width: 200, height: 100 }
    const result = toYoloAnnotation(box, 0, 800, 600)

    expect(result.classId).toBe(0)
    // center: (100 + 100) / 800 = 0.25
    expect(result.centerX).toBeCloseTo(0.25, 6)
    // center: (100 + 50) / 600 = 0.25
    expect(result.centerY).toBeCloseTo(0.25, 6)
    // width: 200 / 800 = 0.25
    expect(result.width).toBeCloseTo(0.25, 6)
    // height: 100 / 600 = 0.166667
    expect(result.height).toBeCloseTo(1 / 6, 5)
  })

  it('converts a box at origin (0, 0)', () => {
    const box: BoundingBox = { x: 0, y: 0, width: 50, height: 50 }
    const result = toYoloAnnotation(box, 1, 500, 500)

    // center: (0 + 25) / 500 = 0.05
    expect(result.centerX).toBeCloseTo(0.05, 6)
    // center: (0 + 25) / 500 = 0.05
    expect(result.centerY).toBeCloseTo(0.05, 6)
    // width: 50 / 500 = 0.1
    expect(result.width).toBeCloseTo(0.1, 6)
    // height: 50 / 500 = 0.1
    expect(result.height).toBeCloseTo(0.1, 6)
  })

  it('converts a box filling the entire image to 0.5 0.5 1.0 1.0', () => {
    const box: BoundingBox = { x: 0, y: 0, width: 1920, height: 1080 }
    const result = toYoloAnnotation(box, 0, 1920, 1080)

    expect(result.centerX).toBeCloseTo(0.5, 6)
    expect(result.centerY).toBeCloseTo(0.5, 6)
    expect(result.width).toBeCloseTo(1.0, 6)
    expect(result.height).toBeCloseTo(1.0, 6)
  })

  it('converts a small box in a large image', () => {
    const box: BoundingBox = { x: 1000, y: 2000, width: 10, height: 5 }
    const result = toYoloAnnotation(box, 2, 4000, 3000)

    // center: (1000 + 5) / 4000 = 0.25125
    expect(result.centerX).toBeCloseTo(0.25125, 6)
    // center: (2000 + 2.5) / 3000 = 0.667500
    expect(result.centerY).toBeCloseTo(2002.5 / 3000, 6)
    // width: 10 / 4000 = 0.0025
    expect(result.width).toBeCloseTo(0.0025, 6)
    // height: 5 / 3000 = 0.001667
    expect(result.height).toBeCloseTo(5 / 3000, 6)
  })
})

describe('fromYoloAnnotation', () => {
  it('round-trips through toYolo then fromYolo', () => {
    const originalBox: BoundingBox = { x: 150, y: 200, width: 300, height: 250 }
    const imageWidth = 1000
    const imageHeight = 800

    const yolo = toYoloAnnotation(originalBox, 1, imageWidth, imageHeight)
    const result = fromYoloAnnotation(yolo, imageWidth, imageHeight)

    expect(result.classId).toBe(1)
    expect(result.box.x).toBeCloseTo(originalBox.x, 4)
    expect(result.box.y).toBeCloseTo(originalBox.y, 4)
    expect(result.box.width).toBeCloseTo(originalBox.width, 4)
    expect(result.box.height).toBeCloseTo(originalBox.height, 4)
  })

  it('handles yolo values at boundaries (0 and 1)', () => {
    const yolo: YoloAnnotation = {
      classId: 0,
      centerX: 0.5,
      centerY: 0.5,
      width: 1.0,
      height: 1.0,
    }
    const result = fromYoloAnnotation(yolo, 800, 600)

    expect(result.box.x).toBeCloseTo(0, 4)
    expect(result.box.y).toBeCloseTo(0, 4)
    expect(result.box.width).toBeCloseTo(800, 4)
    expect(result.box.height).toBeCloseTo(600, 4)
  })

  it('converts a small centered yolo annotation', () => {
    const yolo: YoloAnnotation = {
      classId: 2,
      centerX: 0.5,
      centerY: 0.5,
      width: 0.1,
      height: 0.1,
    }
    const result = fromYoloAnnotation(yolo, 1000, 1000)

    expect(result.classId).toBe(2)
    expect(result.box.x).toBeCloseTo(450, 4)
    expect(result.box.y).toBeCloseTo(450, 4)
    expect(result.box.width).toBeCloseTo(100, 4)
    expect(result.box.height).toBeCloseTo(100, 4)
  })
})

describe('toYoloTxt', () => {
  it('generates YOLO text format for multiple annotations', () => {
    const annotations: Annotation[] = [
      { id: 'a1', imageId: 'img1', labelId: 'label-cat', type: 'box', box: { x: 0, y: 0, width: 400, height: 300 } },
      { id: 'a2', imageId: 'img1', labelId: 'label-dog', type: 'box', box: { x: 200, y: 150, width: 100, height: 80 } },
    ]
    const result = toYoloTxt(annotations, labels, 800, 600)
    const lines = result.split('\n')

    expect(lines).toHaveLength(2)

    // First annotation: cat (classId=0), center=(200/800, 150/600)=0.25,0.25 size=(400/800, 300/600)=0.5,0.5
    expect(lines[0]).toBe('0 0.250000 0.250000 0.500000 0.500000')

    // Second annotation: dog (classId=1), center=(250/800, 190/600)
    const parts = lines[1].split(' ')
    expect(parts[0]).toBe('1')
    expect(parseFloat(parts[1])).toBeCloseTo(0.3125, 6)
    expect(parseFloat(parts[2])).toBeCloseTo(190 / 600, 5)
  })

  it('skips annotations with unknown labelId', () => {
    const annotations: Annotation[] = [
      { id: 'a1', imageId: 'img1', labelId: 'label-cat', type: 'box', box: { x: 0, y: 0, width: 100, height: 100 } },
      { id: 'a2', imageId: 'img1', labelId: 'label-unknown', type: 'box', box: { x: 10, y: 10, width: 50, height: 50 } },
      { id: 'a3', imageId: 'img1', labelId: 'label-dog', type: 'box', box: { x: 200, y: 200, width: 100, height: 100 } },
    ]
    const result = toYoloTxt(annotations, labels, 800, 600)
    const lines = result.split('\n')

    expect(lines).toHaveLength(2)
    expect(lines[0]).toMatch(/^0 /)
    expect(lines[1]).toMatch(/^1 /)
  })

  it('returns empty string for empty annotations', () => {
    const result = toYoloTxt([], labels, 800, 600)
    expect(result).toBe('')
  })

  it('formats OBB annotation with type=obb and 4-point polygon', () => {
    const annotations: Annotation[] = [
      {
        id: 'a-obb',
        imageId: 'img1',
        labelId: 'label-cat',
        type: 'obb',
        box: { x: 100, y: 100, width: 200, height: 150 },
        polygon: [
          { x: 100, y: 100 },
          { x: 300, y: 100 },
          { x: 300, y: 250 },
          { x: 100, y: 250 },
        ],
      },
    ]
    const result = toYoloTxt(annotations, labels, 800, 600)
    const parts = result.split(' ')
    // OBB format: classId x1 y1 x2 y2 x3 y3 x4 y4 (9 values)
    expect(parts).toHaveLength(9)
    expect(parts[0]).toBe('0') // classId for cat
    // Verify the coordinates are normalized
    expect(parseFloat(parts[1])).toBeCloseTo(100 / 800, 5)
    expect(parseFloat(parts[2])).toBeCloseTo(100 / 600, 5)
    expect(parseFloat(parts[3])).toBeCloseTo(300 / 800, 5)
    expect(parseFloat(parts[4])).toBeCloseTo(100 / 600, 5)
  })

  it('formats values to 6 decimal places', () => {
    const annotations: Annotation[] = [
      { id: 'a1', imageId: 'img1', labelId: 'label-cat', type: 'box', box: { x: 100, y: 100, width: 200, height: 150 } },
    ]
    const result = toYoloTxt(annotations, labels, 800, 600)
    const parts = result.split(' ')

    // Each numeric value should have exactly 6 decimal places
    for (let i = 1; i < parts.length; i++) {
      const decimals = parts[i].split('.')[1]
      expect(decimals).toHaveLength(6)
    }
  })
})

describe('parseYoloTxt', () => {
  it('parses standard multi-line input', () => {
    const txt = '0 0.250000 0.250000 0.500000 0.500000\n1 0.625000 0.416667 0.250000 0.166667'
    const result = parseYoloTxt(txt, labels, 800, 600, 'img1')

    expect(result).toHaveLength(2)

    expect(result[0].id).toBe('imported-img1-0')
    expect(result[0].imageId).toBe('img1')
    expect(result[0].labelId).toBe('label-cat')
    expect(result[0].box.x).toBeCloseTo(0, 0)
    expect(result[0].box.y).toBeCloseTo(0, 0)
    expect(result[0].box.width).toBeCloseTo(400, 0)
    expect(result[0].box.height).toBeCloseTo(300, 0)

    expect(result[1].labelId).toBe('label-dog')
  })

  it('ignores empty lines', () => {
    const txt = '0 0.5 0.5 0.5 0.5\n\n\n1 0.5 0.5 0.25 0.25\n'
    const result = parseYoloTxt(txt, labels, 800, 600, 'img1')

    expect(result).toHaveLength(2)
  })

  it('skips invalid lines with less than 5 parts', () => {
    const txt = '0 0.5 0.5 0.5 0.5\n0 0.5 0.5\nbad line\n1 0.5 0.5 0.25 0.25'
    const result = parseYoloTxt(txt, labels, 800, 600, 'img1')

    expect(result).toHaveLength(2)
  })

  it('skips lines with unknown classId', () => {
    const txt = '0 0.5 0.5 0.5 0.5\n99 0.5 0.5 0.25 0.25\n1 0.3 0.3 0.1 0.1'
    const result = parseYoloTxt(txt, labels, 800, 600, 'img1')

    expect(result).toHaveLength(2)
    expect(result[0].labelId).toBe('label-cat')
    expect(result[1].labelId).toBe('label-dog')
  })
})

describe('round-trip: toYoloTxt -> parseYoloTxt', () => {
  it('preserves annotations within floating point tolerance', () => {
    const annotations: Annotation[] = [
      { id: 'a1', imageId: 'img1', labelId: 'label-cat', type: 'box', box: { x: 100, y: 50, width: 200, height: 150 } },
      { id: 'a2', imageId: 'img1', labelId: 'label-dog', type: 'box', box: { x: 400, y: 300, width: 150, height: 120 } },
      { id: 'a3', imageId: 'img1', labelId: 'label-bird', type: 'box', box: { x: 0, y: 0, width: 800, height: 600 } },
    ]
    const imageWidth = 800
    const imageHeight = 600

    const txt = toYoloTxt(annotations, labels, imageWidth, imageHeight)
    const parsed = parseYoloTxt(txt, labels, imageWidth, imageHeight, 'img1')

    expect(parsed).toHaveLength(3)

    for (let i = 0; i < annotations.length; i++) {
      expect(parsed[i].labelId).toBe(annotations[i].labelId)
      expect(parsed[i].box.x).toBeCloseTo(annotations[i].box.x, 1)
      expect(parsed[i].box.y).toBeCloseTo(annotations[i].box.y, 1)
      expect(parsed[i].box.width).toBeCloseTo(annotations[i].box.width, 1)
      expect(parsed[i].box.height).toBeCloseTo(annotations[i].box.height, 1)
    }
  })

  it('round-trips a single annotation with precise values', () => {
    const annotations: Annotation[] = [
      { id: 'a1', imageId: 'img1', labelId: 'label-cat', type: 'box', box: { x: 123, y: 456, width: 78, height: 90 } },
    ]
    const imageWidth = 1920
    const imageHeight = 1080

    const txt = toYoloTxt(annotations, labels, imageWidth, imageHeight)
    const parsed = parseYoloTxt(txt, labels, imageWidth, imageHeight, 'img1')

    expect(parsed).toHaveLength(1)
    expect(parsed[0].box.x).toBeCloseTo(123, 0)
    expect(parsed[0].box.y).toBeCloseTo(456, 0)
    expect(parsed[0].box.width).toBeCloseTo(78, 0)
    expect(parsed[0].box.height).toBeCloseTo(90, 0)
  })
})

// ---------------------------------------------------------------------------
// Segmentation format
// ---------------------------------------------------------------------------

describe('toYoloSegmentation', () => {
  it('normalizes polygon points to 0..1 range', () => {
    const polygon: PolygonPoint[] = [
      { x: 100, y: 50 },
      { x: 300, y: 50 },
      { x: 300, y: 200 },
      { x: 100, y: 200 },
    ]
    const result = toYoloSegmentation(polygon, 0, 800, 400)

    expect(result.classId).toBe(0)
    expect(result.points).toHaveLength(4)
    expect(result.points[0].x).toBeCloseTo(0.125, 6)
    expect(result.points[0].y).toBeCloseTo(0.125, 6)
    expect(result.points[1].x).toBeCloseTo(0.375, 6)
    expect(result.points[1].y).toBeCloseTo(0.125, 6)
    expect(result.points[2].x).toBeCloseTo(0.375, 6)
    expect(result.points[2].y).toBeCloseTo(0.5, 6)
    expect(result.points[3].x).toBeCloseTo(0.125, 6)
    expect(result.points[3].y).toBeCloseTo(0.5, 6)
  })

  it('handles a triangle polygon', () => {
    const polygon: PolygonPoint[] = [
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
      { x: 500, y: 1000 },
    ]
    const result = toYoloSegmentation(polygon, 2, 1000, 1000)

    expect(result.classId).toBe(2)
    expect(result.points).toHaveLength(3)
    expect(result.points[0]).toEqual({ x: 0, y: 0 })
    expect(result.points[1]).toEqual({ x: 1, y: 0 })
    expect(result.points[2]).toEqual({ x: 0.5, y: 1 })
  })

  it('handles polygon covering the full image', () => {
    const polygon: PolygonPoint[] = [
      { x: 0, y: 0 },
      { x: 800, y: 0 },
      { x: 800, y: 600 },
      { x: 0, y: 600 },
    ]
    const result = toYoloSegmentation(polygon, 1, 800, 600)

    expect(result.points[0]).toEqual({ x: 0, y: 0 })
    expect(result.points[1]).toEqual({ x: 1, y: 0 })
    expect(result.points[2]).toEqual({ x: 1, y: 1 })
    expect(result.points[3]).toEqual({ x: 0, y: 1 })
  })
})

describe('fromYoloSegmentation', () => {
  it('denormalizes points and computes bounding box', () => {
    const seg: YoloSegmentation = {
      classId: 1,
      points: [
        { x: 0.1, y: 0.2 },
        { x: 0.5, y: 0.2 },
        { x: 0.5, y: 0.8 },
        { x: 0.1, y: 0.8 },
      ],
    }
    const result = fromYoloSegmentation(seg, 1000, 500)

    expect(result.classId).toBe(1)
    expect(result.polygon).toHaveLength(4)
    expect(result.polygon[0]).toEqual({ x: 100, y: 100 })
    expect(result.polygon[1]).toEqual({ x: 500, y: 100 })
    expect(result.polygon[2]).toEqual({ x: 500, y: 400 })
    expect(result.polygon[3]).toEqual({ x: 100, y: 400 })

    // bounding box from polygonBounds
    expect(result.box.x).toBeCloseTo(100, 4)
    expect(result.box.y).toBeCloseTo(100, 4)
    expect(result.box.width).toBeCloseTo(400, 4)
    expect(result.box.height).toBeCloseTo(300, 4)
  })

  it('round-trips through toYoloSegmentation then fromYoloSegmentation', () => {
    const polygon: PolygonPoint[] = [
      { x: 50, y: 100 },
      { x: 250, y: 80 },
      { x: 300, y: 250 },
      { x: 200, y: 300 },
      { x: 40, y: 270 },
    ]
    const imageWidth = 800
    const imageHeight = 600

    const seg = toYoloSegmentation(polygon, 0, imageWidth, imageHeight)
    const result = fromYoloSegmentation(seg, imageWidth, imageHeight)

    expect(result.classId).toBe(0)
    expect(result.polygon).toHaveLength(5)
    for (let i = 0; i < polygon.length; i++) {
      expect(result.polygon[i].x).toBeCloseTo(polygon[i].x, 4)
      expect(result.polygon[i].y).toBeCloseTo(polygon[i].y, 4)
    }
  })
})

describe('toYoloSegmentationTxt', () => {
  it('generates segmentation text for polygon annotations', () => {
    const annotations: Annotation[] = [
      {
        id: 'a1',
        imageId: 'img1',
        labelId: 'label-cat',
        type: 'polygon',
        box: { x: 100, y: 50, width: 200, height: 150 },
        polygon: [
          { x: 100, y: 50 },
          { x: 300, y: 50 },
          { x: 300, y: 200 },
        ],
      },
    ]
    const result = toYoloSegmentationTxt(annotations, labels, 800, 400)
    const parts = result.split(' ')

    expect(parts[0]).toBe('0') // classId for cat
    expect(parseFloat(parts[1])).toBeCloseTo(0.125, 6)
    expect(parseFloat(parts[2])).toBeCloseTo(0.125, 6)
    expect(parseFloat(parts[3])).toBeCloseTo(0.375, 6)
    expect(parseFloat(parts[4])).toBeCloseTo(0.125, 6)
    expect(parseFloat(parts[5])).toBeCloseTo(0.375, 6)
    expect(parseFloat(parts[6])).toBeCloseTo(0.5, 6)
  })

  it('skips annotations with unknown labelId', () => {
    const annotations: Annotation[] = [
      {
        id: 'a1',
        imageId: 'img1',
        labelId: 'label-unknown',
        type: 'polygon',
        box: { x: 0, y: 0, width: 100, height: 100 },
        polygon: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
        ],
      },
    ]
    const result = toYoloSegmentationTxt(annotations, labels, 800, 600)
    expect(result).toBe('')
  })

  it('skips annotations with fewer than 3 polygon points', () => {
    const annotations: Annotation[] = [
      {
        id: 'a1',
        imageId: 'img1',
        labelId: 'label-cat',
        type: 'polygon',
        box: { x: 0, y: 0, width: 100, height: 100 },
        polygon: [
          { x: 0, y: 0 },
          { x: 100, y: 100 },
        ],
      },
    ]
    const result = toYoloSegmentationTxt(annotations, labels, 800, 600)
    expect(result).toBe('')
  })

  it('skips annotations with no polygon', () => {
    const annotations: Annotation[] = [
      {
        id: 'a1',
        imageId: 'img1',
        labelId: 'label-cat',
        type: 'polygon',
        box: { x: 0, y: 0, width: 100, height: 100 },
      },
    ]
    const result = toYoloSegmentationTxt(annotations, labels, 800, 600)
    expect(result).toBe('')
  })

  it('returns empty string for empty annotations', () => {
    const result = toYoloSegmentationTxt([], labels, 800, 600)
    expect(result).toBe('')
  })

  it('handles multiple annotations', () => {
    const annotations: Annotation[] = [
      {
        id: 'a1',
        imageId: 'img1',
        labelId: 'label-cat',
        type: 'polygon',
        box: { x: 0, y: 0, width: 100, height: 100 },
        polygon: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
        ],
      },
      {
        id: 'a2',
        imageId: 'img1',
        labelId: 'label-dog',
        type: 'polygon',
        box: { x: 200, y: 200, width: 100, height: 100 },
        polygon: [
          { x: 200, y: 200 },
          { x: 300, y: 200 },
          { x: 300, y: 300 },
          { x: 200, y: 300 },
        ],
      },
    ]
    const result = toYoloSegmentationTxt(annotations, labels, 800, 600)
    const lines = result.split('\n')

    expect(lines).toHaveLength(2)
    expect(lines[0]).toMatch(/^0 /)
    expect(lines[1]).toMatch(/^1 /)
  })
})

describe('parseYoloSegmentationTxt', () => {
  it('parses a valid segmentation line with 3 point pairs', () => {
    // classId + 3 pairs = 7 values
    const txt = '0 0.125000 0.125000 0.375000 0.125000 0.375000 0.500000'
    const result = parseYoloSegmentationTxt(txt, labels, 800, 400, 'img1')

    expect(result).toHaveLength(1)
    expect(result[0].labelId).toBe('label-cat')
    expect(result[0].type).toBe('polygon')
    expect(result[0].id).toBe('imported-seg-img1-0')
    expect(result[0].polygon).toHaveLength(3)
    expect(result[0].polygon![0].x).toBeCloseTo(100, 1)
    expect(result[0].polygon![0].y).toBeCloseTo(50, 1)
    expect(result[0].polygon![1].x).toBeCloseTo(300, 1)
    expect(result[0].polygon![1].y).toBeCloseTo(50, 1)
    expect(result[0].polygon![2].x).toBeCloseTo(300, 1)
    expect(result[0].polygon![2].y).toBeCloseTo(200, 1)
  })

  it('skips lines with even number of values (not classId + pairs)', () => {
    // 6 values = even => should be skipped
    const txt = '0 0.1 0.2 0.3 0.4 0.5'
    const result = parseYoloSegmentationTxt(txt, labels, 800, 600, 'img1')
    expect(result).toHaveLength(0)
  })

  it('skips lines with fewer than 7 values', () => {
    // 5 values (classId + 2 pairs) is too few
    const txt = '0 0.1 0.2 0.3 0.4'
    const result = parseYoloSegmentationTxt(txt, labels, 800, 600, 'img1')
    expect(result).toHaveLength(0)
  })

  it('skips lines with unknown classId', () => {
    const txt = '99 0.1 0.2 0.3 0.4 0.5 0.6'
    const result = parseYoloSegmentationTxt(txt, labels, 800, 600, 'img1')
    expect(result).toHaveLength(0)
  })

  it('ignores empty lines', () => {
    const txt = '0 0.1 0.2 0.3 0.4 0.5 0.6\n\n\n1 0.1 0.2 0.3 0.4 0.5 0.6\n'
    const result = parseYoloSegmentationTxt(txt, labels, 800, 600, 'img1')
    expect(result).toHaveLength(2)
  })

  it('computes bounding box from polygon points', () => {
    // Square polygon: (0, 0), (800, 0), (800, 600), (0, 600) normalized
    const txt = '0 0.000000 0.000000 1.000000 0.000000 1.000000 1.000000 0.000000 1.000000'
    const result = parseYoloSegmentationTxt(txt, labels, 800, 600, 'img1')

    expect(result).toHaveLength(1)
    expect(result[0].box.x).toBeCloseTo(0, 1)
    expect(result[0].box.y).toBeCloseTo(0, 1)
    expect(result[0].box.width).toBeCloseTo(800, 1)
    expect(result[0].box.height).toBeCloseTo(600, 1)
  })
})

describe('round-trip: toYoloSegmentationTxt -> parseYoloSegmentationTxt', () => {
  it('preserves polygon annotations within floating point tolerance', () => {
    const annotations: Annotation[] = [
      {
        id: 'a1',
        imageId: 'img1',
        labelId: 'label-cat',
        type: 'polygon',
        box: { x: 50, y: 100, width: 250, height: 200 },
        polygon: [
          { x: 50, y: 100 },
          { x: 300, y: 100 },
          { x: 300, y: 300 },
          { x: 50, y: 300 },
        ],
      },
      {
        id: 'a2',
        imageId: 'img1',
        labelId: 'label-dog',
        type: 'polygon',
        box: { x: 10, y: 20, width: 100, height: 80 },
        polygon: [
          { x: 10, y: 20 },
          { x: 110, y: 20 },
          { x: 60, y: 100 },
        ],
      },
    ]
    const imageWidth = 800
    const imageHeight = 600

    const txt = toYoloSegmentationTxt(annotations, labels, imageWidth, imageHeight)
    const parsed = parseYoloSegmentationTxt(txt, labels, imageWidth, imageHeight, 'img1')

    expect(parsed).toHaveLength(2)
    for (let i = 0; i < annotations.length; i++) {
      expect(parsed[i].labelId).toBe(annotations[i].labelId)
      expect(parsed[i].type).toBe('polygon')
      const origPoly = annotations[i].polygon!
      const parsedPoly = parsed[i].polygon!
      expect(parsedPoly).toHaveLength(origPoly.length)
      for (let j = 0; j < origPoly.length; j++) {
        expect(parsedPoly[j].x).toBeCloseTo(origPoly[j].x, 1)
        expect(parsedPoly[j].y).toBeCloseTo(origPoly[j].y, 1)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// OBB (Oriented Bounding Box) format
// ---------------------------------------------------------------------------

describe('toYoloOBB', () => {
  it('normalizes 4 polygon points', () => {
    const points: [PolygonPoint, PolygonPoint, PolygonPoint, PolygonPoint] = [
      { x: 100, y: 100 },
      { x: 300, y: 100 },
      { x: 300, y: 300 },
      { x: 100, y: 300 },
    ]
    const result = toYoloOBB(points, 0, 1000, 1000)

    expect(result.classId).toBe(0)
    expect(result.points).toHaveLength(4)
    expect(result.points[0]).toEqual({ x: 0.1, y: 0.1 })
    expect(result.points[1]).toEqual({ x: 0.3, y: 0.1 })
    expect(result.points[2]).toEqual({ x: 0.3, y: 0.3 })
    expect(result.points[3]).toEqual({ x: 0.1, y: 0.3 })
  })

  it('handles rotated rectangle points', () => {
    const points: [PolygonPoint, PolygonPoint, PolygonPoint, PolygonPoint] = [
      { x: 200, y: 100 },
      { x: 400, y: 200 },
      { x: 300, y: 400 },
      { x: 100, y: 300 },
    ]
    const result = toYoloOBB(points, 1, 800, 600)

    expect(result.classId).toBe(1)
    expect(result.points[0].x).toBeCloseTo(0.25, 6)
    expect(result.points[0].y).toBeCloseTo(1 / 6, 5)
    expect(result.points[1].x).toBeCloseTo(0.5, 6)
    expect(result.points[1].y).toBeCloseTo(1 / 3, 5)
  })
})

describe('fromYoloOBB', () => {
  it('denormalizes points and computes bounding box', () => {
    const obb: YoloOBB = {
      classId: 2,
      points: [
        { x: 0.1, y: 0.1 },
        { x: 0.5, y: 0.1 },
        { x: 0.5, y: 0.5 },
        { x: 0.1, y: 0.5 },
      ],
    }
    const result = fromYoloOBB(obb, 1000, 1000)

    expect(result.classId).toBe(2)
    expect(result.polygon).toHaveLength(4)
    expect(result.polygon[0]).toEqual({ x: 100, y: 100 })
    expect(result.polygon[1]).toEqual({ x: 500, y: 100 })
    expect(result.polygon[2]).toEqual({ x: 500, y: 500 })
    expect(result.polygon[3]).toEqual({ x: 100, y: 500 })

    expect(result.box.x).toBeCloseTo(100, 4)
    expect(result.box.y).toBeCloseTo(100, 4)
    expect(result.box.width).toBeCloseTo(400, 4)
    expect(result.box.height).toBeCloseTo(400, 4)
  })

  it('round-trips through toYoloOBB then fromYoloOBB', () => {
    const points: [PolygonPoint, PolygonPoint, PolygonPoint, PolygonPoint] = [
      { x: 150, y: 80 },
      { x: 350, y: 120 },
      { x: 330, y: 280 },
      { x: 130, y: 240 },
    ]
    const imageWidth = 800
    const imageHeight = 600

    const obb = toYoloOBB(points, 1, imageWidth, imageHeight)
    const result = fromYoloOBB(obb, imageWidth, imageHeight)

    expect(result.classId).toBe(1)
    expect(result.polygon).toHaveLength(4)
    for (let i = 0; i < 4; i++) {
      expect(result.polygon[i].x).toBeCloseTo(points[i].x, 4)
      expect(result.polygon[i].y).toBeCloseTo(points[i].y, 4)
    }
  })
})

describe('toYoloOBBTxt', () => {
  it('generates OBB text for annotations with exactly 4 polygon points', () => {
    const annotations: Annotation[] = [
      {
        id: 'a1',
        imageId: 'img1',
        labelId: 'label-cat',
        type: 'obb',
        box: { x: 100, y: 100, width: 200, height: 200 },
        polygon: [
          { x: 100, y: 100 },
          { x: 300, y: 100 },
          { x: 300, y: 300 },
          { x: 100, y: 300 },
        ],
      },
    ]
    const result = toYoloOBBTxt(annotations, labels, 1000, 1000)
    const parts = result.split(' ')

    expect(parts).toHaveLength(9)
    expect(parts[0]).toBe('0') // classId for cat
    expect(parseFloat(parts[1])).toBeCloseTo(0.1, 6)
    expect(parseFloat(parts[2])).toBeCloseTo(0.1, 6)
    expect(parseFloat(parts[3])).toBeCloseTo(0.3, 6)
    expect(parseFloat(parts[4])).toBeCloseTo(0.1, 6)
  })

  it('skips annotations with polygon not having exactly 4 points', () => {
    const annotations: Annotation[] = [
      {
        id: 'a1',
        imageId: 'img1',
        labelId: 'label-cat',
        type: 'obb',
        box: { x: 0, y: 0, width: 100, height: 100 },
        polygon: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
        ],
      },
    ]
    const result = toYoloOBBTxt(annotations, labels, 800, 600)
    expect(result).toBe('')
  })

  it('skips annotations with no polygon', () => {
    const annotations: Annotation[] = [
      {
        id: 'a1',
        imageId: 'img1',
        labelId: 'label-cat',
        type: 'obb',
        box: { x: 0, y: 0, width: 100, height: 100 },
      },
    ]
    const result = toYoloOBBTxt(annotations, labels, 800, 600)
    expect(result).toBe('')
  })

  it('skips annotations with unknown labelId', () => {
    const annotations: Annotation[] = [
      {
        id: 'a1',
        imageId: 'img1',
        labelId: 'label-unknown',
        type: 'obb',
        box: { x: 0, y: 0, width: 100, height: 100 },
        polygon: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 },
        ],
      },
    ]
    const result = toYoloOBBTxt(annotations, labels, 800, 600)
    expect(result).toBe('')
  })

  it('returns empty string for empty annotations', () => {
    const result = toYoloOBBTxt([], labels, 800, 600)
    expect(result).toBe('')
  })

  it('handles multiple annotations', () => {
    const annotations: Annotation[] = [
      {
        id: 'a1',
        imageId: 'img1',
        labelId: 'label-cat',
        type: 'obb',
        box: { x: 0, y: 0, width: 100, height: 100 },
        polygon: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 },
        ],
      },
      {
        id: 'a2',
        imageId: 'img1',
        labelId: 'label-dog',
        type: 'obb',
        box: { x: 200, y: 200, width: 100, height: 100 },
        polygon: [
          { x: 200, y: 200 },
          { x: 300, y: 200 },
          { x: 300, y: 300 },
          { x: 200, y: 300 },
        ],
      },
    ]
    const result = toYoloOBBTxt(annotations, labels, 800, 600)
    const lines = result.split('\n')

    expect(lines).toHaveLength(2)
    expect(lines[0]).toMatch(/^0 /)
    expect(lines[1]).toMatch(/^1 /)
  })
})

describe('parseYoloOBBTxt', () => {
  it('parses a valid OBB line with exactly 9 values', () => {
    const txt = '0 0.100000 0.100000 0.300000 0.100000 0.300000 0.300000 0.100000 0.300000'
    const result = parseYoloOBBTxt(txt, labels, 1000, 1000, 'img1')

    expect(result).toHaveLength(1)
    expect(result[0].labelId).toBe('label-cat')
    expect(result[0].type).toBe('obb')
    expect(result[0].id).toBe('imported-obb-img1-0')
    expect(result[0].polygon).toHaveLength(4)
    expect(result[0].polygon![0].x).toBeCloseTo(100, 1)
    expect(result[0].polygon![0].y).toBeCloseTo(100, 1)
    expect(result[0].polygon![2].x).toBeCloseTo(300, 1)
    expect(result[0].polygon![2].y).toBeCloseTo(300, 1)
  })

  it('skips lines without exactly 9 values', () => {
    const txt = '0 0.1 0.2 0.3 0.4 0.5 0.6 0.7' // 8 values
    const result = parseYoloOBBTxt(txt, labels, 800, 600, 'img1')
    expect(result).toHaveLength(0)
  })

  it('skips lines with 10 values', () => {
    const txt = '0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9'
    const result = parseYoloOBBTxt(txt, labels, 800, 600, 'img1')
    expect(result).toHaveLength(0)
  })

  it('skips lines with unknown classId', () => {
    const txt = '99 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8'
    const result = parseYoloOBBTxt(txt, labels, 800, 600, 'img1')
    expect(result).toHaveLength(0)
  })

  it('ignores empty lines', () => {
    const txt = '0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8\n\n1 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8\n'
    const result = parseYoloOBBTxt(txt, labels, 800, 600, 'img1')
    expect(result).toHaveLength(2)
  })

  it('computes bounding box from the 4 polygon points', () => {
    // Points: (0,0), (800,0), (800,600), (0,600) normalized
    const txt = '0 0.000000 0.000000 1.000000 0.000000 1.000000 1.000000 0.000000 1.000000'
    const result = parseYoloOBBTxt(txt, labels, 800, 600, 'img1')

    expect(result).toHaveLength(1)
    expect(result[0].box.x).toBeCloseTo(0, 1)
    expect(result[0].box.y).toBeCloseTo(0, 1)
    expect(result[0].box.width).toBeCloseTo(800, 1)
    expect(result[0].box.height).toBeCloseTo(600, 1)
  })
})

describe('round-trip: toYoloOBBTxt -> parseYoloOBBTxt', () => {
  it('preserves OBB annotations within floating point tolerance', () => {
    const annotations: Annotation[] = [
      {
        id: 'a1',
        imageId: 'img1',
        labelId: 'label-cat',
        type: 'obb',
        box: { x: 100, y: 80, width: 200, height: 200 },
        polygon: [
          { x: 150, y: 80 },
          { x: 350, y: 120 },
          { x: 330, y: 280 },
          { x: 130, y: 240 },
        ],
      },
      {
        id: 'a2',
        imageId: 'img1',
        labelId: 'label-bird',
        type: 'obb',
        box: { x: 400, y: 300, width: 100, height: 100 },
        polygon: [
          { x: 400, y: 300 },
          { x: 500, y: 300 },
          { x: 500, y: 400 },
          { x: 400, y: 400 },
        ],
      },
    ]
    const imageWidth = 800
    const imageHeight = 600

    const txt = toYoloOBBTxt(annotations, labels, imageWidth, imageHeight)
    const parsed = parseYoloOBBTxt(txt, labels, imageWidth, imageHeight, 'img1')

    expect(parsed).toHaveLength(2)
    for (let i = 0; i < annotations.length; i++) {
      expect(parsed[i].labelId).toBe(annotations[i].labelId)
      expect(parsed[i].type).toBe('obb')
      const origPoly = annotations[i].polygon!
      const parsedPoly = parsed[i].polygon!
      expect(parsedPoly).toHaveLength(4)
      for (let j = 0; j < 4; j++) {
        expect(parsedPoly[j].x).toBeCloseTo(origPoly[j].x, 1)
        expect(parsedPoly[j].y).toBeCloseTo(origPoly[j].y, 1)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// Format detection
// ---------------------------------------------------------------------------

describe('detectYoloFormat', () => {
  it('returns "detection" for 5 values', () => {
    expect(detectYoloFormat('0 0.5 0.5 0.25 0.25')).toBe('detection')
  })

  it('returns "obb" for 9 values', () => {
    expect(detectYoloFormat('0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8')).toBe('obb')
  })

  it('returns "segmentation" for >9 odd-count values', () => {
    // 11 values (classId + 5 pairs)
    expect(detectYoloFormat('0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 0.10')).toBe('segmentation')
    // 13 values (classId + 6 pairs)
    expect(detectYoloFormat('0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 0.10 0.11 0.12')).toBe('segmentation')
  })

  it('returns null for even count >9', () => {
    // 10 values = even => null
    expect(detectYoloFormat('0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9')).toBeNull()
    // 12 values = even => null
    expect(detectYoloFormat('0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 0.10 0.11')).toBeNull()
  })

  it('returns null for fewer than 5 values', () => {
    expect(detectYoloFormat('0 0.5 0.5')).toBeNull()
    expect(detectYoloFormat('0')).toBeNull()
    expect(detectYoloFormat('')).toBeNull()
  })

  it('returns null for 6, 7, 8 values (between detection and obb)', () => {
    expect(detectYoloFormat('0 0.1 0.2 0.3 0.4 0.5')).toBeNull()
    expect(detectYoloFormat('0 0.1 0.2 0.3 0.4 0.5 0.6')).toBeNull()
    expect(detectYoloFormat('0 0.1 0.2 0.3 0.4 0.5 0.6 0.7')).toBeNull()
  })

  it('handles lines with extra whitespace', () => {
    expect(detectYoloFormat('  0 0.5 0.5 0.25 0.25  ')).toBe('detection')
  })
})

// ---------------------------------------------------------------------------
// Auto-detect parsing
// ---------------------------------------------------------------------------

describe('parseYoloAutoTxt', () => {
  it('parses detection format lines', () => {
    const txt = '0 0.250000 0.250000 0.500000 0.500000'
    const result = parseYoloAutoTxt(txt, labels, 800, 600, 'img1')

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('box')
    expect(result[0].labelId).toBe('label-cat')
    expect(result[0].box.x).toBeCloseTo(0, 0)
    expect(result[0].box.y).toBeCloseTo(0, 0)
    expect(result[0].box.width).toBeCloseTo(400, 0)
    expect(result[0].box.height).toBeCloseTo(300, 0)
  })

  it('parses OBB format lines', () => {
    const txt = '1 0.100000 0.100000 0.300000 0.100000 0.300000 0.300000 0.100000 0.300000'
    const result = parseYoloAutoTxt(txt, labels, 1000, 1000, 'img1')

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('obb')
    expect(result[0].labelId).toBe('label-dog')
    expect(result[0].id).toBe('imported-obb-img1-0')
    expect(result[0].polygon).toHaveLength(4)
    expect(result[0].polygon![0].x).toBeCloseTo(100, 1)
  })

  it('parses segmentation format lines', () => {
    // 11 values = classId + 5 pairs
    const txt = '2 0.1 0.1 0.5 0.1 0.5 0.5 0.3 0.6 0.1 0.5'
    const result = parseYoloAutoTxt(txt, labels, 1000, 1000, 'img1')

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('polygon')
    expect(result[0].labelId).toBe('label-bird')
    expect(result[0].id).toBe('imported-seg-img1-0')
    expect(result[0].polygon).toHaveLength(5)
  })

  it('parses mixed format lines', () => {
    const txt = [
      '0 0.5 0.5 0.25 0.25',                                                    // detection
      '1 0.1 0.1 0.3 0.1 0.3 0.3 0.1 0.3',                                      // obb
      '2 0.1 0.1 0.5 0.1 0.5 0.5 0.3 0.6 0.1 0.5',                              // segmentation
    ].join('\n')
    const result = parseYoloAutoTxt(txt, labels, 1000, 1000, 'img1')

    expect(result).toHaveLength(3)
    expect(result[0].type).toBe('box')
    expect(result[0].labelId).toBe('label-cat')
    expect(result[1].type).toBe('obb')
    expect(result[1].labelId).toBe('label-dog')
    expect(result[2].type).toBe('polygon')
    expect(result[2].labelId).toBe('label-bird')
  })

  it('skips lines with undetectable format', () => {
    const txt = '0 0.5 0.5 0.25 0.25\nbad line\n1 0.5 0.5 0.25 0.25'
    const result = parseYoloAutoTxt(txt, labels, 800, 600, 'img1')
    expect(result).toHaveLength(2)
  })

  it('skips lines with unknown classId', () => {
    const txt = '99 0.5 0.5 0.25 0.25'
    const result = parseYoloAutoTxt(txt, labels, 800, 600, 'img1')
    expect(result).toHaveLength(0)
  })

  it('returns empty array for empty text', () => {
    const result = parseYoloAutoTxt('', labels, 800, 600, 'img1')
    expect(result).toHaveLength(0)
  })

  it('ignores empty lines', () => {
    const txt = '0 0.5 0.5 0.25 0.25\n\n\n1 0.5 0.5 0.25 0.25\n'
    const result = parseYoloAutoTxt(txt, labels, 800, 600, 'img1')
    expect(result).toHaveLength(2)
  })

  it('assigns correct ids with line-index based naming', () => {
    const txt = '0 0.5 0.5 0.25 0.25\n1 0.1 0.1 0.3 0.1 0.3 0.3 0.1 0.3'
    const result = parseYoloAutoTxt(txt, labels, 800, 600, 'img1')

    expect(result[0].id).toBe('imported-img1-0')      // detection prefix
    expect(result[1].id).toBe('imported-obb-img1-1')   // obb prefix
  })
})

// ---------------------------------------------------------------------------
// Classification format
// ---------------------------------------------------------------------------

describe('toYoloClassificationTxt', () => {
  it('outputs one classId per line for classification annotations', () => {
    const annotations: Annotation[] = [
      {
        id: 'a1',
        imageId: 'img1',
        labelId: 'label-cat',
        type: 'classification',
        box: { x: 0, y: 0, width: 0, height: 0 },
      },
      {
        id: 'a2',
        imageId: 'img1',
        labelId: 'label-dog',
        type: 'classification',
        box: { x: 0, y: 0, width: 0, height: 0 },
      },
    ]
    const result = toYoloClassificationTxt(annotations, labels)
    const lines = result.split('\n')

    expect(lines).toHaveLength(2)
    expect(lines[0]).toBe('0')
    expect(lines[1]).toBe('1')
  })

  it('filters out non-classification annotations', () => {
    const annotations: Annotation[] = [
      {
        id: 'a1',
        imageId: 'img1',
        labelId: 'label-cat',
        type: 'box',
        box: { x: 100, y: 100, width: 200, height: 200 },
      },
      {
        id: 'a2',
        imageId: 'img1',
        labelId: 'label-dog',
        type: 'classification',
        box: { x: 0, y: 0, width: 0, height: 0 },
      },
      {
        id: 'a3',
        imageId: 'img1',
        labelId: 'label-bird',
        type: 'polygon',
        box: { x: 0, y: 0, width: 100, height: 100 },
        polygon: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
        ],
      },
    ]
    const result = toYoloClassificationTxt(annotations, labels)

    expect(result).toBe('1')
  })

  it('skips classification annotations with unknown labelId', () => {
    const annotations: Annotation[] = [
      {
        id: 'a1',
        imageId: 'img1',
        labelId: 'label-unknown',
        type: 'classification',
        box: { x: 0, y: 0, width: 0, height: 0 },
      },
      {
        id: 'a2',
        imageId: 'img1',
        labelId: 'label-cat',
        type: 'classification',
        box: { x: 0, y: 0, width: 0, height: 0 },
      },
    ]
    const result = toYoloClassificationTxt(annotations, labels)

    expect(result).toBe('0')
  })

  it('returns empty string for empty annotations', () => {
    const result = toYoloClassificationTxt([], labels)
    expect(result).toBe('')
  })

  it('returns empty string when no classification annotations exist', () => {
    const annotations: Annotation[] = [
      {
        id: 'a1',
        imageId: 'img1',
        labelId: 'label-cat',
        type: 'box',
        box: { x: 100, y: 100, width: 200, height: 200 },
      },
    ]
    const result = toYoloClassificationTxt(annotations, labels)
    expect(result).toBe('')
  })
})
