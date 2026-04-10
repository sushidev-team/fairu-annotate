import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { StoreProvider } from '../../stores/provider'
import { useKeyboardShortcuts } from '../use-keyboard-shortcuts'
import { useUIStoreApi, useAnnotationStoreApi } from '../../stores/provider'
import type { Label } from '../../types/labels'

const labels: Label[] = [
  { id: 'l1', name: 'cat', color: '#f00', classId: 0 },
  { id: 'l2', name: 'dog', color: '#0f0', classId: 1 },
  { id: 'l3', name: 'bird', color: '#00f', classId: 2 },
]

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(StoreProvider, null, children)
}

function fireKey(key: string, opts: Partial<KeyboardEventInit> = {}) {
  window.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, ...opts }),
  )
}

/** Helper hook that returns store APIs so tests can inspect state. */
function useStores() {
  return {
    ui: useUIStoreApi(),
    annotation: useAnnotationStoreApi(),
  }
}

function renderWithStores(
  hookOpts: Partial<Parameters<typeof useKeyboardShortcuts>[0]> = {},
) {
  const storesRef: { current: ReturnType<typeof useStores> | null } = { current: null }

  const result = renderHook(
    () => {
      const stores = useStores()
      storesRef.current = stores
      useKeyboardShortcuts({
        labels,
        imageCount: 5,
        ...hookOpts,
      })
    },
    { wrapper },
  )

  return { ...result, stores: storesRef as { current: ReturnType<typeof useStores> } }
}

describe('useKeyboardShortcuts', () => {
  // ------- Tool switching -------
  describe('tool switching', () => {
    it('switches to select with "v"', () => {
      const { stores } = renderWithStores()
      act(() => fireKey('v'))
      expect(stores.current.ui.getState().tool).toBe('select')
    })

    it('switches to draw with "d"', () => {
      const { stores } = renderWithStores()
      // start from select so we can see the change
      act(() => fireKey('v'))
      expect(stores.current.ui.getState().tool).toBe('select')
      act(() => fireKey('d'))
      expect(stores.current.ui.getState().tool).toBe('draw')
    })

    it('switches to polygon with "p"', () => {
      const { stores } = renderWithStores()
      act(() => fireKey('p'))
      expect(stores.current.ui.getState().tool).toBe('polygon')
    })

    it('switches to pan with "h"', () => {
      const { stores } = renderWithStores()
      act(() => fireKey('h'))
      expect(stores.current.ui.getState().tool).toBe('pan')
    })
  })

  // ------- Lock toggle -------
  describe('lock toggle', () => {
    it('toggles locked state with "l"', () => {
      const { stores } = renderWithStores()
      expect(stores.current.ui.getState().locked).toBe(false)
      act(() => fireKey('l'))
      expect(stores.current.ui.getState().locked).toBe(true)
      act(() => fireKey('l'))
      expect(stores.current.ui.getState().locked).toBe(false)
    })
  })

  // ------- Locked state blocks actions -------
  describe('locked state blocks actions', () => {
    it('blocks draw tool when locked', () => {
      const { stores } = renderWithStores({ locked: true })
      act(() => fireKey('v'))
      expect(stores.current.ui.getState().tool).toBe('select')
      act(() => fireKey('d'))
      // should remain select because locked
      expect(stores.current.ui.getState().tool).toBe('select')
    })

    it('blocks polygon tool when locked', () => {
      const { stores } = renderWithStores({ locked: true })
      act(() => fireKey('v'))
      act(() => fireKey('p'))
      expect(stores.current.ui.getState().tool).toBe('select')
    })

    it('blocks delete when locked', () => {
      const { stores } = renderWithStores({ locked: true })
      // Set up an annotation and select it
      act(() => {
        stores.current.annotation.getState().addAnnotation({
          id: 'a1',
          imageId: 'img1',
          labelId: 'l1',
          type: 'bbox',
          bbox: { x: 0, y: 0, width: 10, height: 10 },
        } as any)
        stores.current.ui.getState().setSelectedAnnotation('a1')
      })
      act(() => fireKey('Delete'))
      // annotation should still exist
      expect(stores.current.annotation.getState().annotations['img1']).toHaveLength(1)
    })

    it('blocks undo when locked', () => {
      const { stores } = renderWithStores({ locked: true })
      // add then remove to have undo history
      act(() => {
        stores.current.annotation.getState().addAnnotation({
          id: 'a1',
          imageId: 'img1',
          labelId: 'l1',
          type: 'bbox',
          bbox: { x: 0, y: 0, width: 10, height: 10 },
        } as any)
        stores.current.annotation.getState().removeAnnotation('a1', 'img1')
      })
      expect(stores.current.annotation.getState().annotations['img1']).toHaveLength(0)
      act(() => fireKey('z', { ctrlKey: true }))
      // undo should be blocked
      expect(stores.current.annotation.getState().annotations['img1']).toHaveLength(0)
    })

    it('blocks redo when locked', () => {
      const { stores } = renderWithStores({ locked: true })
      act(() => {
        stores.current.annotation.getState().addAnnotation({
          id: 'a1',
          imageId: 'img1',
          labelId: 'l1',
          type: 'bbox',
          bbox: { x: 0, y: 0, width: 10, height: 10 },
        } as any)
        stores.current.annotation.getState().removeAnnotation('a1', 'img1')
        stores.current.annotation.getState().undo()
      })
      expect(stores.current.annotation.getState().annotations['img1']).toHaveLength(1)
      act(() => fireKey('z', { ctrlKey: true, shiftKey: true }))
      // redo should be blocked
      expect(stores.current.annotation.getState().annotations['img1']).toHaveLength(1)
    })

    it('still allows select and pan when locked', () => {
      const { stores } = renderWithStores({ locked: true })
      act(() => fireKey('v'))
      expect(stores.current.ui.getState().tool).toBe('select')
      act(() => fireKey('h'))
      expect(stores.current.ui.getState().tool).toBe('pan')
    })
  })

  // ------- Image navigation -------
  describe('image navigation', () => {
    it('navigates to next image with ArrowRight', () => {
      const { stores } = renderWithStores()
      expect(stores.current.ui.getState().currentImageIndex).toBe(0)
      act(() => fireKey('ArrowRight'))
      expect(stores.current.ui.getState().currentImageIndex).toBe(1)
    })

    it('navigates to previous image with ArrowLeft', () => {
      const { stores } = renderWithStores()
      act(() => {
        stores.current.ui.getState().setCurrentImageIndex(2)
      })
      act(() => fireKey('ArrowLeft'))
      expect(stores.current.ui.getState().currentImageIndex).toBe(1)
    })

    it('does not go below 0 with ArrowLeft', () => {
      const { stores } = renderWithStores()
      expect(stores.current.ui.getState().currentImageIndex).toBe(0)
      act(() => fireKey('ArrowLeft'))
      expect(stores.current.ui.getState().currentImageIndex).toBe(0)
    })

    it('does not exceed imageCount-1 with ArrowRight', () => {
      const { stores } = renderWithStores({ imageCount: 3 })
      act(() => {
        stores.current.ui.getState().setCurrentImageIndex(2)
      })
      act(() => fireKey('ArrowRight'))
      expect(stores.current.ui.getState().currentImageIndex).toBe(2)
    })

    it('advances to next image with Enter', () => {
      const { stores } = renderWithStores()
      expect(stores.current.ui.getState().currentImageIndex).toBe(0)
      act(() => fireKey('Enter'))
      expect(stores.current.ui.getState().currentImageIndex).toBe(1)
    })

    it('Enter does not exceed imageCount-1', () => {
      const { stores } = renderWithStores({ imageCount: 2 })
      act(() => {
        stores.current.ui.getState().setCurrentImageIndex(1)
      })
      act(() => fireKey('Enter'))
      expect(stores.current.ui.getState().currentImageIndex).toBe(1)
    })
  })

  // ------- Zoom -------
  describe('zoom', () => {
    it('zooms in with Ctrl+=', () => {
      const { stores } = renderWithStores()
      const before = stores.current.ui.getState().zoom
      act(() => fireKey('=', { ctrlKey: true }))
      expect(stores.current.ui.getState().zoom).toBeCloseTo(before * 1.2)
    })

    it('zooms out with Ctrl+-', () => {
      const { stores } = renderWithStores()
      const before = stores.current.ui.getState().zoom
      act(() => fireKey('-', { ctrlKey: true }))
      expect(stores.current.ui.getState().zoom).toBeCloseTo(before / 1.2)
    })
  })

  // ------- Export -------
  describe('export', () => {
    it('calls onExport with Ctrl+S', () => {
      const onExport = vi.fn()
      renderWithStores({ onExport })
      act(() => fireKey('s', { ctrlKey: true }))
      expect(onExport).toHaveBeenCalledTimes(1)
    })

    it('does nothing when onExport is not provided', () => {
      // should not throw
      renderWithStores()
      act(() => fireKey('s', { ctrlKey: true }))
    })
  })

  // ------- Quick labels (annotate mode) -------
  describe('quick labels (annotate mode)', () => {
    it('sets active label with 1-3 keys', () => {
      const { stores } = renderWithStores()
      act(() => fireKey('1'))
      expect(stores.current.ui.getState().activeLabelId).toBe('l1')
      act(() => fireKey('2'))
      expect(stores.current.ui.getState().activeLabelId).toBe('l2')
      act(() => fireKey('3'))
      expect(stores.current.ui.getState().activeLabelId).toBe('l3')
    })

    it('ignores number keys beyond the labels array length', () => {
      const { stores } = renderWithStores()
      act(() => fireKey('9'))
      // only 3 labels, so pressing 9 should not change active label
      expect(stores.current.ui.getState().activeLabelId).toBeNull()
    })

    it('does not set active label when locked', () => {
      const { stores } = renderWithStores({ locked: true })
      act(() => fireKey('1'))
      expect(stores.current.ui.getState().activeLabelId).toBeNull()
    })
  })

  // ------- Delete annotation -------
  describe('delete annotation', () => {
    it('removes selected annotation with Delete', () => {
      const { stores } = renderWithStores()
      act(() => {
        stores.current.annotation.getState().addAnnotation({
          id: 'a1',
          imageId: 'img1',
          labelId: 'l1',
          type: 'bbox',
          bbox: { x: 0, y: 0, width: 10, height: 10 },
        } as any)
        stores.current.ui.getState().setSelectedAnnotation('a1')
      })
      act(() => fireKey('Delete'))
      expect(stores.current.annotation.getState().annotations['img1']).toHaveLength(0)
      expect(stores.current.ui.getState().selectedAnnotationId).toBeNull()
    })

    it('removes selected annotation with Backspace', () => {
      const { stores } = renderWithStores()
      act(() => {
        stores.current.annotation.getState().addAnnotation({
          id: 'a2',
          imageId: 'img1',
          labelId: 'l1',
          type: 'bbox',
          bbox: { x: 0, y: 0, width: 10, height: 10 },
        } as any)
        stores.current.ui.getState().setSelectedAnnotation('a2')
      })
      act(() => fireKey('Backspace'))
      expect(stores.current.annotation.getState().annotations['img1']).toHaveLength(0)
      expect(stores.current.ui.getState().selectedAnnotationId).toBeNull()
    })

    it('does nothing when no annotation is selected', () => {
      const { stores } = renderWithStores()
      act(() => {
        stores.current.annotation.getState().addAnnotation({
          id: 'a1',
          imageId: 'img1',
          labelId: 'l1',
          type: 'bbox',
          bbox: { x: 0, y: 0, width: 10, height: 10 },
        } as any)
      })
      act(() => fireKey('Delete'))
      expect(stores.current.annotation.getState().annotations['img1']).toHaveLength(1)
    })
  })

  // ------- Undo / Redo -------
  describe('undo / redo', () => {
    it('undoes with Ctrl+Z', () => {
      const { stores } = renderWithStores()
      act(() => {
        stores.current.annotation.getState().addAnnotation({
          id: 'a1',
          imageId: 'img1',
          labelId: 'l1',
          type: 'bbox',
          bbox: { x: 0, y: 0, width: 10, height: 10 },
        } as any)
      })
      expect(stores.current.annotation.getState().annotations['img1']).toHaveLength(1)
      act(() => fireKey('z', { ctrlKey: true }))
      expect(stores.current.annotation.getState().annotations['img1'] ?? []).toHaveLength(0)
    })

    it('redoes with Ctrl+Shift+Z', () => {
      const { stores } = renderWithStores()
      act(() => {
        stores.current.annotation.getState().addAnnotation({
          id: 'a1',
          imageId: 'img1',
          labelId: 'l1',
          type: 'bbox',
          bbox: { x: 0, y: 0, width: 10, height: 10 },
        } as any)
      })
      act(() => fireKey('z', { ctrlKey: true }))
      expect(stores.current.annotation.getState().annotations['img1'] ?? []).toHaveLength(0)
      act(() => fireKey('z', { ctrlKey: true, shiftKey: true }))
      expect(stores.current.annotation.getState().annotations['img1']).toHaveLength(1)
    })
  })

  // ------- Ignores input fields -------
  describe('ignores input fields', () => {
    it('does not handle key events from INPUT elements', () => {
      const { stores } = renderWithStores()
      const input = document.createElement('input')
      document.body.appendChild(input)
      const event = new KeyboardEvent('keydown', {
        key: 'v',
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: input })
      act(() => {
        window.dispatchEvent(event)
      })
      // tool should still be draw (default), not select
      expect(stores.current.ui.getState().tool).toBe('draw')
      document.body.removeChild(input)
    })

    it('does not handle key events from TEXTAREA elements', () => {
      const { stores } = renderWithStores()
      const textarea = document.createElement('textarea')
      document.body.appendChild(textarea)
      const event = new KeyboardEvent('keydown', {
        key: 'v',
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: textarea })
      act(() => {
        window.dispatchEvent(event)
      })
      expect(stores.current.ui.getState().tool).toBe('draw')
      document.body.removeChild(textarea)
    })

    it('does not handle key events from contentEditable elements', () => {
      const { stores } = renderWithStores()
      const div = document.createElement('div')
      div.contentEditable = 'true'
      document.body.appendChild(div)
      const event = new KeyboardEvent('keydown', {
        key: 'v',
        bubbles: true,
      })
      // jsdom may not set isContentEditable automatically, so we mock the target
      const fakeTarget = { tagName: 'DIV', isContentEditable: true }
      Object.defineProperty(event, 'target', { value: fakeTarget })
      act(() => {
        window.dispatchEvent(event)
      })
      expect(stores.current.ui.getState().tool).toBe('draw')
      document.body.removeChild(div)
    })
  })

  // ------- Classify mode -------
  describe('classify mode', () => {
    it('suppresses draw tool in classify mode', () => {
      const { stores } = renderWithStores({ mode: 'classify' })
      act(() => fireKey('v'))
      expect(stores.current.ui.getState().tool).toBe('select')
      act(() => fireKey('d'))
      // should remain select, draw suppressed in classify
      expect(stores.current.ui.getState().tool).toBe('select')
    })

    it('suppresses polygon tool in classify mode', () => {
      const { stores } = renderWithStores({ mode: 'classify' })
      act(() => fireKey('v'))
      act(() => fireKey('p'))
      expect(stores.current.ui.getState().tool).toBe('select')
    })

    it('still allows select and pan in classify mode', () => {
      const { stores } = renderWithStores({ mode: 'classify' })
      act(() => fireKey('v'))
      expect(stores.current.ui.getState().tool).toBe('select')
      act(() => fireKey('h'))
      expect(stores.current.ui.getState().tool).toBe('pan')
    })

    it('calls onToggleClassification with 1-9 in classify mode', () => {
      const onToggleClassification = vi.fn()
      renderWithStores({
        mode: 'classify',
        onToggleClassification,
      })
      act(() => fireKey('1'))
      expect(onToggleClassification).toHaveBeenCalledWith('l1')
      act(() => fireKey('2'))
      expect(onToggleClassification).toHaveBeenCalledWith('l2')
      act(() => fireKey('3'))
      expect(onToggleClassification).toHaveBeenCalledWith('l3')
    })

    it('does not call onToggleClassification for out-of-range keys', () => {
      const onToggleClassification = vi.fn()
      renderWithStores({
        mode: 'classify',
        onToggleClassification,
      })
      act(() => fireKey('9'))
      expect(onToggleClassification).not.toHaveBeenCalled()
    })

    it('does not set activeLabel in classify mode (number keys toggle classification instead)', () => {
      const onToggleClassification = vi.fn()
      const { stores } = renderWithStores({
        mode: 'classify',
        onToggleClassification,
      })
      act(() => fireKey('1'))
      expect(stores.current.ui.getState().activeLabelId).toBeNull()
      expect(onToggleClassification).toHaveBeenCalledWith('l1')
    })

    it('uses custom labelKeyBindings in classify mode', () => {
      const onToggleClassification = vi.fn()
      renderWithStores({
        mode: 'classify',
        onToggleClassification,
        labelKeyBindings: { l1: 'a', l2: 'b' },
      })
      act(() => fireKey('a'))
      expect(onToggleClassification).toHaveBeenCalledWith('l1')
      act(() => fireKey('b'))
      expect(onToggleClassification).toHaveBeenCalledWith('l2')
    })

    it('custom labelKeyBindings are blocked when locked', () => {
      const onToggleClassification = vi.fn()
      renderWithStores({
        mode: 'classify',
        onToggleClassification,
        labelKeyBindings: { l1: 'a' },
        locked: true,
      })
      act(() => fireKey('a'))
      expect(onToggleClassification).not.toHaveBeenCalled()
    })

    it('uses favorites for 1-9 keys in classify mode when favorites exist', () => {
      const onToggleClassification = vi.fn()
      const { stores } = renderWithStores({
        mode: 'classify',
        onToggleClassification,
      })
      // Set up favorites
      act(() => {
        stores.current.ui.getState().setFavoriteLabelIds(['l3', 'l1'])
      })
      // Press '1' - should use favorites[0] = l3
      act(() => fireKey('1'))
      expect(onToggleClassification).toHaveBeenCalledWith('l3')
      // Press '2' - should use favorites[1] = l1
      act(() => fireKey('2'))
      expect(onToggleClassification).toHaveBeenCalledWith('l1')
    })

    it('uses favorites for 1-9 keys in annotate mode when favorites exist', () => {
      const { stores } = renderWithStores({
        mode: 'annotate',
      })
      // Set up favorites
      act(() => {
        stores.current.ui.getState().setFavoriteLabelIds(['l2', 'l3'])
      })
      // Press '1' - should set active label to favorites[0] = l2
      act(() => fireKey('1'))
      expect(stores.current.ui.getState().activeLabelId).toBe('l2')
      // Press '2' - should set active label to favorites[1] = l3
      act(() => fireKey('2'))
      expect(stores.current.ui.getState().activeLabelId).toBe('l3')
    })
  })
})
