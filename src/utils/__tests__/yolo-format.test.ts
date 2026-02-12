import { describe, it, expect } from 'vitest'
import { toYoloAnnotation, fromYoloAnnotation, toYoloTxt, parseYoloTxt } from '../yolo-format'
import type { Annotation, BoundingBox, YoloAnnotation } from '../../types/annotations'
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
