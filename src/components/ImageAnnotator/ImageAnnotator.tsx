import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ImageAnnotatorProps } from '../../types/events'
import type { Annotation, BoundingBox, PolygonPoint, ImageData } from '../../types/annotations'
import {
  StoreProvider,
  useAnnotationStore,
  useAnnotationStoreApi,
  useUIStore,
  useUIStoreApi,
} from '../../stores/provider'
import { useImageLoader } from '../../hooks/use-image-loader'
import { useCanvasDrawing } from '../../hooks/use-canvas-drawing'
import { usePolygonDrawing } from '../../hooks/use-polygon-drawing'
import { useKeyboardShortcuts } from '../../hooks/use-keyboard-shortcuts'
import { useYoloExport } from '../../hooks/use-yolo-export'
import { toYoloTxt, toYoloSegmentationTxt, toYoloOBBTxt } from '../../utils/yolo-format'
import { Canvas } from './Canvas'
import { BoundingBoxOverlay } from './BoundingBoxOverlay'
import { Toolbar } from '../Toolbar/Toolbar'
import { AnnotationList } from '../AnnotationList/AnnotationList'
import { TagManager } from '../TagManager/TagManager'
import { Pagination } from '../Pagination/Pagination'
import { DataPreview } from '../DataPreview/DataPreview'

const EMPTY_ANNOTATIONS: Annotation[] = []

let annotationCounter = 0
function nextId() {
  return `ann-${Date.now()}-${++annotationCounter}`
}

function ImageAnnotatorInner({
  images: imagesProp,
  labels,
  onAnnotationsChange,
  onFavoritesChange,
  onExport,
  onTagSearch,
  onTagCreate,
  onTagDelete,
  onTagUpdate,
  keyboardShortcuts,
  yoloFormat = 'auto',
  className = '',
  readOnly = false,
  showToolbarIcons = true,
  showLabelDots = true,
}: ImageAnnotatorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const currentIndex = useUIStore((s) => s.currentImageIndex)
  const tool = useUIStore((s) => s.tool)
  const activeLabelId = useUIStore((s) => s.activeLabelId)
  const setActiveLabel = useUIStore((s) => s.setActiveLabel)
  const selectedId = useUIStore((s) => s.selectedAnnotationId)
  const setSelected = useUIStore((s) => s.setSelectedAnnotation)
  const zoom = useUIStore((s) => s.zoom)
  const panX = useUIStore((s) => s.panX)
  const panY = useUIStore((s) => s.panY)
  const setPan = useUIStore((s) => s.setPan)
  const uiStoreApi = useUIStoreApi()

  const favoriteLabelIds = useUIStore((s) => s.favoriteLabelIds)

  // Sync favorites to parent callback
  const onFavoritesChangeRef = useRef(onFavoritesChange)
  onFavoritesChangeRef.current = onFavoritesChange
  const isFirstFavoritesRender = useRef(true)
  useEffect(() => {
    // Skip the initial render to avoid calling back with the initial value
    if (isFirstFavoritesRender.current) {
      isFirstFavoritesRender.current = false
      return
    }
    onFavoritesChangeRef.current?.(favoriteLabelIds)
  }, [favoriteLabelIds])

  const userLocked = useUIStore((s) => s.locked)
  const showDataPreview = useUIStore((s) => s.showDataPreview)
  const isLocked = userLocked || readOnly

  const annotationStoreApi = useAnnotationStoreApi()
  const addAnnotation = useAnnotationStore((s) => s.addAnnotation)
  const updateAnnotation = useAnnotationStore((s) => s.updateAnnotation)
  const currentAnnotations = useAnnotationStore(
    (s) => s.annotations[imagesProp[currentIndex]?.id] ?? EMPTY_ANNOTATIONS,
  )

  const currentImage = imagesProp[currentIndex]
  const { image: loadedImage, loading: imageLoading } = useImageLoader(currentImage?.src)

  const images: ImageData[] = useMemo(
    () =>
      imagesProp.map((img) => ({
        ...img,
        naturalWidth: undefined,
        naturalHeight: undefined,
      })),
    [imagesProp],
  )

  // Update images with natural dimensions when loaded
  const imagesWithDimensions: ImageData[] = useMemo(() => {
    return images.map((img, i) => {
      if (i === currentIndex && loadedImage) {
        return {
          ...img,
          naturalWidth: loadedImage.naturalWidth,
          naturalHeight: loadedImage.naturalHeight,
        }
      }
      return img
    })
  }, [images, currentIndex, loadedImage])

  // Auto-select first label if none active
  useEffect(() => {
    if (!activeLabelId && labels.length > 0) {
      setActiveLabel(labels[0].id)
    }
  }, [activeLabelId, labels, setActiveLabel])

  // Notify parent on annotation changes
  useEffect(() => {
    if (onAnnotationsChange && currentImage) {
      onAnnotationsChange(currentImage.id, currentAnnotations)
    }
  }, [currentAnnotations, currentImage, onAnnotationsChange])

  const { exportAll } = useYoloExport({ images: imagesWithDimensions, labels, yoloFormat })

  const handleExport = useCallback(() => {
    const data = exportAll()
    onExport?.(data)
  }, [exportAll, onExport])

  useKeyboardShortcuts({
    shortcuts: keyboardShortcuts,
    labels,
    imageCount: imagesProp.length,
    onExport: onExport ? handleExport : undefined,
    locked: isLocked,
  })

  const imageWidth = loadedImage?.naturalWidth ?? 800
  const imageHeight = loadedImage?.naturalHeight ?? 600

  // Responsive container sizing via ResizeObserver
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 800,
    height: 600,
  })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setContainerSize({ width, height })
        }
      }
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Calculate fit-to-container scale
  const fitScale = Math.min(
    containerSize.width / imageWidth,
    containerSize.height / imageHeight,
  )

  // Effective zoom = fitScale * user zoom
  const effectiveZoom = fitScale * zoom

  // Center the image in the container
  const centeredPanX = (containerSize.width - imageWidth * effectiveZoom) / 2 + panX * fitScale
  const centeredPanY = (containerSize.height - imageHeight * effectiveZoom) / 2 + panY * fitScale

  const handleDrawComplete = useCallback(
    (box: BoundingBox) => {
      if (isLocked) return
      const labelId = uiStoreApi.getState().activeLabelId
      if (!labelId || !currentImage) return
      addAnnotation({
        id: nextId(),
        imageId: currentImage.id,
        labelId,
        box,
      })
    },
    [addAnnotation, currentImage, uiStoreApi, isLocked],
  )

  const handlePolygonDrawComplete = useCallback(
    (points: PolygonPoint[], bounds: BoundingBox) => {
      if (isLocked) return
      const labelId = uiStoreApi.getState().activeLabelId
      if (!labelId || !currentImage) return
      addAnnotation({
        id: nextId(),
        imageId: currentImage.id,
        labelId,
        type: 'polygon',
        box: bounds,
        polygon: points,
      })
    },
    [addAnnotation, currentImage, uiStoreApi, isLocked],
  )

  const { currentBox: drawingBox, handlers: drawHandlers } = useCanvasDrawing({
    zoom: effectiveZoom,
    panX: centeredPanX,
    panY: centeredPanY,
    imageWidth,
    imageHeight,
    onDrawComplete: handleDrawComplete,
  })

  const {
    points: polygonPoints,
    mousePos: polygonMousePos,
    isDrawing: isDrawingPolygon,
    handlers: polygonHandlers,
    handleKeyDown: polygonKeyDown,
    cancel: cancelPolygon,
  } = usePolygonDrawing({
    zoom: effectiveZoom,
    panX: centeredPanX,
    panY: centeredPanY,
    imageWidth,
    imageHeight,
    onDrawComplete: handlePolygonDrawComplete,
  })

  // Register polygon keyboard handler (Escape/Enter)
  useEffect(() => {
    if (tool !== 'polygon' || isLocked) return
    window.addEventListener('keydown', polygonKeyDown)
    return () => window.removeEventListener('keydown', polygonKeyDown)
  }, [tool, polygonKeyDown, isLocked])

  // Cancel polygon drawing when switching away from polygon tool
  useEffect(() => {
    if (tool !== 'polygon' && isDrawingPolygon) {
      cancelPolygon()
    }
  }, [tool, isDrawingPolygon, cancelPolygon])

  // Switch to select/pan if locked while on draw/polygon tool
  useEffect(() => {
    if (isLocked && (tool === 'draw' || tool === 'polygon')) {
      uiStoreApi.getState().setTool('select')
    }
  }, [isLocked, tool, uiStoreApi])

  const handleBoxUpdate = useCallback(
    (id: string, imageId: string, box: BoundingBox) => {
      if (isLocked) return
      updateAnnotation(id, imageId, { box })
    },
    [updateAnnotation, isLocked],
  )

  // Pan handling
  const panRef = useRef<{ isPanning: boolean; lastX: number; lastY: number }>({
    isPanning: false,
    lastX: 0,
    lastY: 0,
  })

  // Polygon click timer: delays single-click to distinguish from double-click
  const polygonClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingClickEvent = useRef<React.MouseEvent | null>(null)

  const handleContainerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (tool === 'pan') {
        panRef.current = { isPanning: true, lastX: e.clientX, lastY: e.clientY }
      } else if (tool === 'draw' && !isLocked) {
        drawHandlers.onMouseDown(e)
      }
    },
    [tool, drawHandlers, isLocked],
  )

  const handleContainerMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (tool === 'pan' && panRef.current.isPanning) {
        const dx = e.clientX - panRef.current.lastX
        const dy = e.clientY - panRef.current.lastY
        setPan(panX + dx / fitScale, panY + dy / fitScale)
        panRef.current.lastX = e.clientX
        panRef.current.lastY = e.clientY
      } else if (tool === 'draw' && !isLocked) {
        drawHandlers.onMouseMove(e)
      } else if (tool === 'polygon' && !isLocked) {
        polygonHandlers.onMouseMove(e)
      }
    },
    [tool, panX, panY, setPan, drawHandlers, polygonHandlers, fitScale, isLocked],
  )

  const handleContainerMouseUp = useCallback(() => {
    panRef.current.isPanning = false
    drawHandlers.onMouseUp()
  }, [drawHandlers])

  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      if (tool !== 'polygon' || isLocked) return
      // Delay single-click to distinguish from double-click
      if (polygonClickTimer.current) {
        clearTimeout(polygonClickTimer.current)
        polygonClickTimer.current = null
      }
      // Store the event data we need (React reuses synthetic events)
      const clickData = {
        button: e.button,
        clientX: e.clientX,
        clientY: e.clientY,
        currentTarget: e.currentTarget,
      }
      polygonClickTimer.current = setTimeout(() => {
        polygonClickTimer.current = null
        polygonHandlers.onClick(clickData as unknown as React.MouseEvent<Element>)
      }, 200)
    },
    [tool, polygonHandlers, isLocked],
  )

  const handleContainerDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (tool === 'polygon' && !isLocked) {
        // Cancel the pending single-click
        if (polygonClickTimer.current) {
          clearTimeout(polygonClickTimer.current)
          polygonClickTimer.current = null
        }
        polygonHandlers.onDoubleClick(e)
      }
    },
    [tool, polygonHandlers, isLocked],
  )

  // Wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        uiStoreApi.getState().setZoom(zoom * delta)
      }
    },
    [zoom, uiStoreApi],
  )

  const activeLabel = labels.find((l) => l.id === activeLabelId)
  const drawingColor = activeLabel?.color ?? '#3B82F6'

  const cursorClass =
    !isLocked && (tool === 'draw' || tool === 'polygon') ? 'cursor-crosshair' : tool === 'pan' ? 'cursor-grab' : 'cursor-default'

  // Make component focusable for keyboard shortcuts
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // Auto-focus the annotator so keyboard shortcuts work immediately
    rootRef.current?.focus()
  }, [])

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      className={`flex h-full bg-zinc-50 rounded-lg ring-1 ring-inset ring-zinc-200 overflow-hidden outline-none dark:bg-zinc-950 dark:ring-zinc-700 ${className}`}
    >
      {/* Left Sidebar */}
      <div className="w-56 border-r border-zinc-200 bg-white overflow-y-auto flex flex-col gap-3 p-2 shrink-0 dark:border-zinc-700 dark:bg-zinc-900">
        <TagManager
          labels={labels}
          onTagSearch={onTagSearch}
          onTagCreate={onTagCreate}
          onTagDelete={onTagDelete}
        />
        {currentImage && (
          <AnnotationList imageId={currentImage.id} labels={labels} locked={isLocked} />
        )}
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="flex items-center gap-2 p-2 border-b border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <Toolbar
            onExport={onExport ? handleExport : undefined}
            labels={labels}
            locked={isLocked}
            readOnly={readOnly}
            showIcons={showToolbarIcons}
            showLabelDots={showLabelDots}
          />
          <div className="flex-1" />
          <Pagination images={imagesProp} />
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden bg-zinc-100 dark:bg-zinc-950">
          {imageLoading ? (
            <div className="flex items-center justify-center h-full text-zinc-400 dark:text-zinc-500">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500 dark:border-zinc-600 dark:border-t-blue-400" />
            </div>
          ) : !currentImage ? (
            <div className="flex items-center justify-center h-full text-zinc-400 dark:text-zinc-500 text-sm">
              No images provided
            </div>
          ) : (
            <div
              ref={containerRef}
              className={`relative w-full h-full ${cursorClass}`}
              onMouseDown={handleContainerMouseDown}
              onMouseMove={handleContainerMouseMove}
              onMouseUp={handleContainerMouseUp}
              onMouseLeave={handleContainerMouseUp}
              onClick={handleContainerClick}
              onDoubleClick={handleContainerDoubleClick}
              onWheel={handleWheel}
            >
              <Canvas
                image={loadedImage?.element ?? null}
                zoom={effectiveZoom}
                panX={centeredPanX}
                panY={centeredPanY}
                drawingBox={!isLocked ? drawingBox : null}
                drawingColor={drawingColor}
                containerWidth={containerSize.width}
                containerHeight={containerSize.height}
                showCrosshair={!isLocked && (tool === 'draw' || tool === 'polygon')}
                polygonPoints={!isLocked && tool === 'polygon' ? polygonPoints : undefined}
                polygonMousePos={!isLocked && tool === 'polygon' ? polygonMousePos : undefined}
              />
              <BoundingBoxOverlay
                annotations={currentAnnotations}
                labels={labels}
                selectedId={selectedId}
                zoom={effectiveZoom}
                panX={centeredPanX}
                panY={centeredPanY}
                onSelect={setSelected}
                onUpdate={handleBoxUpdate}
                tool={tool}
                locked={isLocked}
              />
            </div>
          )}
        </div>

        {/* Data Preview Panel */}
        {showDataPreview && (
          <DataPreview
            annotations={currentAnnotations}
            labels={labels}
            yoloFormat={yoloFormat}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
          />
        )}
      </div>
    </div>
  )
}

export function ImageAnnotator(props: ImageAnnotatorProps) {
  return (
    <StoreProvider initialAnnotations={props.initialAnnotations} initialFavorites={props.initialFavorites}>
      <ImageAnnotatorInner {...props} />
    </StoreProvider>
  )
}
