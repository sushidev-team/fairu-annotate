export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface PolygonPoint {
  x: number
  y: number
}

export interface Polygon {
  points: PolygonPoint[]
}

export interface YoloAnnotation {
  classId: number
  centerX: number
  centerY: number
  width: number
  height: number
}

export interface YoloSegmentation {
  classId: number
  points: { x: number; y: number }[]
}

export interface YoloOBB {
  classId: number
  points: [
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
  ]
}

export type AnnotationType = 'box' | 'polygon' | 'obb'

export interface Annotation {
  id: string
  imageId: string
  labelId: string
  /** Defaults to 'box' when not specified, for backwards compatibility */
  type?: AnnotationType
  box: BoundingBox
  polygon?: PolygonPoint[]
}

export interface ImageData {
  id: string
  src: string
  name: string
  naturalWidth?: number
  naturalHeight?: number
}
