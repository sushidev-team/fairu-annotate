// Components
export { ImageAnnotator } from './components/ImageAnnotator/ImageAnnotator'
export { TagManager } from './components/TagManager/TagManager'
export { AnnotationList } from './components/AnnotationList/AnnotationList'
export { Toolbar } from './components/Toolbar/Toolbar'
export { Pagination } from './components/Pagination/Pagination'
export { DataPreview } from './components/DataPreview/DataPreview'
export { LabelSelector } from './components/Toolbar/LabelSelector'

// Hooks
export { useYoloExport } from './hooks/use-yolo-export'

// Utils — YOLO format
export {
  toYoloTxt,
  parseYoloTxt,
  toYoloAnnotation,
  fromYoloAnnotation,
  toYoloSegmentationTxt,
  parseYoloSegmentationTxt,
  toYoloSegmentation,
  fromYoloSegmentation,
  toYoloOBBTxt,
  parseYoloOBBTxt,
  toYoloOBB,
  fromYoloOBB,
  detectYoloFormat,
  parseYoloAutoTxt,
} from './utils/yolo-format'

// Utils — Geometry
export {
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
} from './utils/geometry'

// Types
export type {
  BoundingBox,
  PolygonPoint,
  Polygon,
  YoloAnnotation,
  YoloSegmentation,
  YoloOBB,
  AnnotationType,
  Annotation,
  ImageData,
} from './types/annotations'
export type { Label, TagSearchParams, TagSearchResult, TagSearchFn, TagCreateFn, TagDeleteFn, TagUpdateFn } from './types/labels'
export type { Tool, ExportData, OnAnnotationsChange, OnExport, KeyboardShortcutMap, ImageAnnotatorProps } from './types/events'
export type { YoloFormat } from './utils/yolo-format'
export type { ResizeHandle } from './utils/geometry'
