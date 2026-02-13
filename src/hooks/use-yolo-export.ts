import { useCallback } from 'react'
import { useAnnotationStoreApi } from '../stores/provider'
import type { Label } from '../types/labels'
import type { ExportData } from '../types/events'
import type { ImageData } from '../types/annotations'
import {
  toYoloTxt,
  toYoloSegmentationTxt,
  toYoloOBBTxt,
  type YoloFormat,
} from '../utils/yolo-format'

interface UseYoloExportOptions {
  images: ImageData[]
  labels: Label[]
  yoloFormat?: YoloFormat | 'auto'
}

export function useYoloExport({ images, labels, yoloFormat = 'auto' }: UseYoloExportOptions) {
  const annotationStore = useAnnotationStoreApi()

  const exportAll = useCallback((): ExportData[] => {
    const state = annotationStore.getState()
    return images
      .map((img) => {
        const allAnnotations = state.getAnnotations(img.id)
        // Filter out classification annotations from spatial export
        const annotations = allAnnotations.filter((a) => a.type !== 'classification')
        if (annotations.length === 0) return null
        const w = img.naturalWidth ?? 1
        const h = img.naturalHeight ?? 1

        let yoloTxt: string
        if (yoloFormat === 'segmentation') {
          yoloTxt = toYoloSegmentationTxt(annotations, labels, w, h)
        } else if (yoloFormat === 'obb') {
          yoloTxt = toYoloOBBTxt(annotations, labels, w, h)
        } else {
          // 'auto' or 'detection': toYoloTxt auto-dispatches by annotation type
          yoloTxt = toYoloTxt(annotations, labels, w, h)
        }

        return {
          imageId: img.id,
          imageName: img.name,
          yoloTxt,
          annotations,
          format: yoloFormat,
        }
      })
      .filter((d): d is ExportData => d !== null)
  }, [images, labels, annotationStore, yoloFormat])

  return { exportAll }
}
