import { useEffect } from 'react'
import type { KeyboardShortcutMap } from '../types/events'
import { DEFAULT_SHORTCUTS, matchesShortcut } from '../utils/keyboard-map'
import { useAnnotationStoreApi, useUIStoreApi } from '../stores/provider'
import type { Label } from '../types/labels'

interface UseKeyboardShortcutsOptions {
  shortcuts?: KeyboardShortcutMap
  labels: Label[]
  imageCount: number
  onExport?: () => void
  locked?: boolean
}

export function useKeyboardShortcuts({
  shortcuts: overrides,
  labels,
  imageCount,
  onExport,
  locked = false,
}: UseKeyboardShortcutsOptions) {
  const annotationStore = useAnnotationStoreApi()
  const uiStore = useUIStoreApi()

  useEffect(() => {
    const sc = { ...DEFAULT_SHORTCUTS, ...overrides }

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      if (matchesShortcut(e, sc['view.lock'])) {
        e.preventDefault()
        const ui = uiStore.getState()
        ui.setLocked(!ui.locked)
        return
      }

      if (matchesShortcut(e, sc['tool.draw'])) {
        if (locked) return
        e.preventDefault()
        uiStore.getState().setTool('draw')
      } else if (matchesShortcut(e, sc['tool.select'])) {
        e.preventDefault()
        uiStore.getState().setTool('select')
      } else if (matchesShortcut(e, sc['tool.polygon'])) {
        if (locked) return
        e.preventDefault()
        uiStore.getState().setTool('polygon')
      } else if (matchesShortcut(e, sc['tool.pan'])) {
        e.preventDefault()
        uiStore.getState().setTool('pan')
      } else if (matchesShortcut(e, sc['annotation.delete']) || e.key === 'Backspace') {
        if (locked) return
        const ui = uiStore.getState()
        if (ui.selectedAnnotationId) {
          e.preventDefault()
          const idx = ui.currentImageIndex
          const imgAnnotations = annotationStore.getState().getAnnotations('')
          // Find the imageId from the selected annotation
          const allAnnotations = annotationStore.getState().annotations
          for (const [imageId, anns] of Object.entries(allAnnotations)) {
            const found = anns.find((a) => a.id === ui.selectedAnnotationId)
            if (found) {
              annotationStore.getState().removeAnnotation(ui.selectedAnnotationId, imageId)
              break
            }
          }
          ui.setSelectedAnnotation(null)
        }
      } else if (matchesShortcut(e, sc['history.undo'])) {
        if (locked) return
        e.preventDefault()
        annotationStore.getState().undo()
      } else if (matchesShortcut(e, sc['history.redo'])) {
        if (locked) return
        e.preventDefault()
        annotationStore.getState().redo()
      } else if (matchesShortcut(e, sc['image.next'])) {
        e.preventDefault()
        const ui = uiStore.getState()
        if (ui.currentImageIndex < imageCount - 1) {
          ui.setCurrentImageIndex(ui.currentImageIndex + 1)
        }
      } else if (matchesShortcut(e, sc['image.prev'])) {
        e.preventDefault()
        const ui = uiStore.getState()
        if (ui.currentImageIndex > 0) {
          ui.setCurrentImageIndex(ui.currentImageIndex - 1)
        }
      } else if (matchesShortcut(e, sc['zoom.in'])) {
        e.preventDefault()
        const ui = uiStore.getState()
        ui.setZoom(ui.zoom * 1.2)
      } else if (matchesShortcut(e, sc['zoom.out'])) {
        e.preventDefault()
        const ui = uiStore.getState()
        ui.setZoom(ui.zoom / 1.2)
      } else if (matchesShortcut(e, sc['export'])) {
        e.preventDefault()
        onExport?.()
      } else if (e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.metaKey) {
        if (locked) return
        const index = parseInt(e.key, 10) - 1
        const favorites = uiStore.getState().favoriteLabelIds
        if (favorites.length > 0) {
          if (index < favorites.length) {
            e.preventDefault()
            uiStore.getState().setActiveLabel(favorites[index])
          }
        } else if (index < labels.length) {
          e.preventDefault()
          uiStore.getState().setActiveLabel(labels[index].id)
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [overrides, labels, imageCount, onExport, locked, annotationStore, uiStore])
}
