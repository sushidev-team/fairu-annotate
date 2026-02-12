import type { Annotation, AnnotationType } from './annotations'
import type { Label } from './labels'
import type { YoloFormat } from '../utils/yolo-format'

export type Tool = 'draw' | 'polygon' | 'select' | 'pan'

export interface AnnotationChangeEvent {
  imageId: string
  annotations: Annotation[]
}

export interface ExportData {
  imageId: string
  imageName: string
  yoloTxt: string
  annotations: Annotation[]
  format: YoloFormat | 'auto'
}

export type OnAnnotationsChange = (imageId: string, annotations: Annotation[]) => void
export type OnExport = (data: ExportData[]) => void

export interface KeyboardShortcutMap {
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
}

export interface ImageAnnotatorProps {
  images: { id: string; src: string; name: string }[]
  labels: Label[]
  initialAnnotations?: Record<string, Annotation[]>
  initialFavorites?: string[]
  onAnnotationsChange?: OnAnnotationsChange
  onFavoritesChange?: (favoriteIds: string[]) => void
  onExport?: OnExport
  onTagSearch?: import('./labels').TagSearchFn
  onTagCreate?: import('./labels').TagCreateFn
  onTagDelete?: import('./labels').TagDeleteFn
  onTagUpdate?: import('./labels').TagUpdateFn
  keyboardShortcuts?: KeyboardShortcutMap
  className?: string
  annotationMode?: AnnotationType
  yoloFormat?: 'detection' | 'segmentation' | 'obb' | 'auto'
  readOnly?: boolean
  showToolbarIcons?: boolean
  showLabelDots?: boolean
}
