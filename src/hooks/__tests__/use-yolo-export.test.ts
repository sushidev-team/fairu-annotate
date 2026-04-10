import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { useYoloExport } from '../use-yolo-export'
import { StoreProvider } from '../../stores/provider'
import type { Annotation, ImageData } from '../../types/annotations'
import type { Label } from '../../types/labels'

const labels: Label[] = [
  { id: 'label-1', name: 'Cat', color: '#ff0000', classId: 0 },
  { id: 'label-2', name: 'Dog', color: '#00ff00', classId: 1 },
]

function makeBoxAnnotation(overrides: Partial<Annotation> & { id: string; imageId: string; labelId: string }): Annotation {
  return {
    type: 'box',
    box: { x: 10, y: 20, width: 100, height: 200 },
    ...overrides,
  }
}

function makePolygonAnnotation(overrides: Partial<Annotation> & { id: string; imageId: string; labelId: string }): Annotation {
  return {
    type: 'polygon',
    box: { x: 0, y: 0, width: 100, height: 100 },
    polygon: [
      { x: 10, y: 10 },
      { x: 90, y: 10 },
      { x: 90, y: 90 },
      { x: 10, y: 90 },
    ],
    ...overrides,
  }
}

function makeOBBAnnotation(overrides: Partial<Annotation> & { id: string; imageId: string; labelId: string }): Annotation {
  return {
    type: 'obb',
    box: { x: 0, y: 0, width: 100, height: 100 },
    polygon: [
      { x: 10, y: 10 },
      { x: 90, y: 10 },
      { x: 90, y: 90 },
      { x: 10, y: 90 },
    ],
    ...overrides,
  }
}

function makeClassificationAnnotation(overrides: Partial<Annotation> & { id: string; imageId: string; labelId: string }): Annotation {
  return {
    type: 'classification',
    box: { x: 0, y: 0, width: 0, height: 0 },
    ...overrides,
  }
}

function createWrapper(initialAnnotations?: Record<string, Annotation[]>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(StoreProvider, { initialAnnotations, children })
  }
}

const image1: ImageData = { id: 'img-1', src: 'test1.jpg', name: 'test1.jpg', naturalWidth: 1000, naturalHeight: 500 }
const image2: ImageData = { id: 'img-2', src: 'test2.jpg', name: 'test2.jpg', naturalWidth: 800, naturalHeight: 600 }

describe('useYoloExport', () => {
  it('returns empty array when no annotations', () => {
    const { result } = renderHook(
      () => useYoloExport({ images: [image1], labels }),
      { wrapper: createWrapper() },
    )

    const exported = result.current.exportAll()
    expect(exported).toEqual([])
  })

  it('exports detection format correctly', () => {
    const ann = makeBoxAnnotation({ id: 'a1', imageId: 'img-1', labelId: 'label-1' })
    const { result } = renderHook(
      () => useYoloExport({ images: [image1], labels, yoloFormat: 'detection' }),
      { wrapper: createWrapper({ 'img-1': [ann] }) },
    )

    const exported = result.current.exportAll()
    expect(exported).toHaveLength(1)
    expect(exported[0].imageId).toBe('img-1')
    expect(exported[0].imageName).toBe('test1.jpg')
    expect(exported[0].format).toBe('detection')
    expect(exported[0].annotations).toEqual([ann])

    // Detection format: classId centerX centerY width height
    const lines = exported[0].yoloTxt.split('\n')
    expect(lines).toHaveLength(1)
    const parts = lines[0].split(' ')
    expect(parts).toHaveLength(5)
    expect(parts[0]).toBe('0') // classId

    // centerX = (10 + 100/2) / 1000 = 0.06
    expect(parseFloat(parts[1])).toBeCloseTo(0.06, 4)
    // centerY = (20 + 200/2) / 500 = 0.24
    expect(parseFloat(parts[2])).toBeCloseTo(0.24, 4)
    // width = 100 / 1000 = 0.1
    expect(parseFloat(parts[3])).toBeCloseTo(0.1, 4)
    // height = 200 / 500 = 0.4
    expect(parseFloat(parts[4])).toBeCloseTo(0.4, 4)
  })

  it('exports segmentation format', () => {
    const ann = makePolygonAnnotation({ id: 'a1', imageId: 'img-1', labelId: 'label-1' })
    const { result } = renderHook(
      () => useYoloExport({ images: [image1], labels, yoloFormat: 'segmentation' }),
      { wrapper: createWrapper({ 'img-1': [ann] }) },
    )

    const exported = result.current.exportAll()
    expect(exported).toHaveLength(1)
    expect(exported[0].format).toBe('segmentation')

    // Segmentation format: classId x1 y1 x2 y2 ... (normalized points)
    const lines = exported[0].yoloTxt.split('\n')
    expect(lines).toHaveLength(1)
    const parts = lines[0].split(' ')
    // classId + 4 pairs of coordinates = 9 values
    expect(parts).toHaveLength(9)
    expect(parts[0]).toBe('0')
    // First point: 10/1000 = 0.01, 10/500 = 0.02
    expect(parseFloat(parts[1])).toBeCloseTo(0.01, 4)
    expect(parseFloat(parts[2])).toBeCloseTo(0.02, 4)
  })

  it('exports OBB format', () => {
    const ann = makeOBBAnnotation({ id: 'a1', imageId: 'img-1', labelId: 'label-1' })
    const { result } = renderHook(
      () => useYoloExport({ images: [image1], labels, yoloFormat: 'obb' }),
      { wrapper: createWrapper({ 'img-1': [ann] }) },
    )

    const exported = result.current.exportAll()
    expect(exported).toHaveLength(1)
    expect(exported[0].format).toBe('obb')

    // OBB format: classId x1 y1 x2 y2 x3 y3 x4 y4 (4 corner points, normalized)
    const lines = exported[0].yoloTxt.split('\n')
    expect(lines).toHaveLength(1)
    const parts = lines[0].split(' ')
    expect(parts).toHaveLength(9)
    expect(parts[0]).toBe('0')
  })

  it('auto format dispatches by annotation type', () => {
    const boxAnn = makeBoxAnnotation({ id: 'a1', imageId: 'img-1', labelId: 'label-1' })
    const polyAnn = makePolygonAnnotation({ id: 'a2', imageId: 'img-1', labelId: 'label-2' })
    const { result } = renderHook(
      () => useYoloExport({ images: [image1], labels, yoloFormat: 'auto' }),
      { wrapper: createWrapper({ 'img-1': [boxAnn, polyAnn] }) },
    )

    const exported = result.current.exportAll()
    expect(exported).toHaveLength(1)
    expect(exported[0].format).toBe('auto')

    // toYoloTxt auto-dispatches: box -> detection line (5 parts), polygon -> segmentation line (9 parts)
    const lines = exported[0].yoloTxt.split('\n')
    expect(lines).toHaveLength(2)

    // First line is the box annotation (detection format: 5 parts)
    const boxParts = lines[0].split(' ')
    expect(boxParts).toHaveLength(5)

    // Second line is the polygon annotation (segmentation format: 9 parts)
    const polyParts = lines[1].split(' ')
    expect(polyParts).toHaveLength(9)
  })

  it('filters out classification annotations', () => {
    const classAnn = makeClassificationAnnotation({ id: 'c1', imageId: 'img-1', labelId: 'label-1' })
    const boxAnn = makeBoxAnnotation({ id: 'a1', imageId: 'img-1', labelId: 'label-2' })
    const { result } = renderHook(
      () => useYoloExport({ images: [image1], labels }),
      { wrapper: createWrapper({ 'img-1': [classAnn, boxAnn] }) },
    )

    const exported = result.current.exportAll()
    expect(exported).toHaveLength(1)
    // Only the box annotation should remain
    expect(exported[0].annotations).toHaveLength(1)
    expect(exported[0].annotations[0].id).toBe('a1')
    expect(exported[0].annotations[0].type).toBe('box')
  })

  it('returns empty for images with only classification annotations', () => {
    const classAnn = makeClassificationAnnotation({ id: 'c1', imageId: 'img-1', labelId: 'label-1' })
    const { result } = renderHook(
      () => useYoloExport({ images: [image1], labels }),
      { wrapper: createWrapper({ 'img-1': [classAnn] }) },
    )

    const exported = result.current.exportAll()
    expect(exported).toEqual([])
  })

  it('handles multiple images', () => {
    const ann1 = makeBoxAnnotation({ id: 'a1', imageId: 'img-1', labelId: 'label-1' })
    const ann2 = makeBoxAnnotation({ id: 'a2', imageId: 'img-2', labelId: 'label-2', box: { x: 50, y: 50, width: 200, height: 300 } })
    const { result } = renderHook(
      () => useYoloExport({ images: [image1, image2], labels }),
      { wrapper: createWrapper({ 'img-1': [ann1], 'img-2': [ann2] }) },
    )

    const exported = result.current.exportAll()
    expect(exported).toHaveLength(2)

    expect(exported[0].imageId).toBe('img-1')
    expect(exported[0].imageName).toBe('test1.jpg')
    expect(exported[0].annotations).toEqual([ann1])

    expect(exported[1].imageId).toBe('img-2')
    expect(exported[1].imageName).toBe('test2.jpg')
    expect(exported[1].annotations).toEqual([ann2])
  })

  it('skips images with no annotations in the export', () => {
    const ann1 = makeBoxAnnotation({ id: 'a1', imageId: 'img-1', labelId: 'label-1' })
    const imageNoAnnotations: ImageData = { id: 'img-3', src: 'test3.jpg', name: 'test3.jpg', naturalWidth: 640, naturalHeight: 480 }
    const { result } = renderHook(
      () => useYoloExport({ images: [image1, imageNoAnnotations], labels }),
      { wrapper: createWrapper({ 'img-1': [ann1] }) },
    )

    const exported = result.current.exportAll()
    expect(exported).toHaveLength(1)
    expect(exported[0].imageId).toBe('img-1')
  })

  it('uses naturalWidth/naturalHeight, defaults to 1 if undefined', () => {
    const imageNoSize: ImageData = { id: 'img-no-size', src: 'test.jpg', name: 'test.jpg' }
    const ann = makeBoxAnnotation({
      id: 'a1',
      imageId: 'img-no-size',
      labelId: 'label-1',
      box: { x: 10, y: 20, width: 100, height: 200 },
    })

    const { result } = renderHook(
      () => useYoloExport({ images: [imageNoSize], labels, yoloFormat: 'detection' }),
      { wrapper: createWrapper({ 'img-no-size': [ann] }) },
    )

    const exported = result.current.exportAll()
    expect(exported).toHaveLength(1)

    // With w=1, h=1: centerX = (10 + 50) / 1 = 60, centerY = (20 + 100) / 1 = 120
    const parts = exported[0].yoloTxt.split(' ')
    expect(parseFloat(parts[1])).toBeCloseTo(60, 4)
    expect(parseFloat(parts[2])).toBeCloseTo(120, 4)
    expect(parseFloat(parts[3])).toBeCloseTo(100, 4)
    expect(parseFloat(parts[4])).toBeCloseTo(200, 4)
  })

  it('defaults yoloFormat to auto when not specified', () => {
    const ann = makeBoxAnnotation({ id: 'a1', imageId: 'img-1', labelId: 'label-1' })
    const { result } = renderHook(
      () => useYoloExport({ images: [image1], labels }),
      { wrapper: createWrapper({ 'img-1': [ann] }) },
    )

    const exported = result.current.exportAll()
    expect(exported).toHaveLength(1)
    expect(exported[0].format).toBe('auto')
  })
})
