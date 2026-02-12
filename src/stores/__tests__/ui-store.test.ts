import { describe, it, expect, beforeEach } from 'vitest'
import { createUIStore, type UIStore } from '../ui-store'
import type { StoreApi } from 'zustand'

describe('createUIStore', () => {
  let store: StoreApi<UIStore>

  beforeEach(() => {
    store = createUIStore()
  })

  describe('initial state', () => {
    it('has correct default values', () => {
      const state = store.getState()
      expect(state.tool).toBe('draw')
      expect(state.activeLabelId).toBeNull()
      expect(state.selectedAnnotationId).toBeNull()
      expect(state.currentImageIndex).toBe(0)
      expect(state.zoom).toBe(1)
      expect(state.panX).toBe(0)
      expect(state.panY).toBe(0)
      expect(state.locked).toBe(false)
      expect(state.showDataPreview).toBe(false)
    })
  })

  describe('setTool', () => {
    it('changes tool to select', () => {
      store.getState().setTool('select')
      expect(store.getState().tool).toBe('select')
    })

    it('changes tool to pan', () => {
      store.getState().setTool('pan')
      expect(store.getState().tool).toBe('pan')
    })

    it('changes tool back to draw', () => {
      store.getState().setTool('select')
      store.getState().setTool('draw')
      expect(store.getState().tool).toBe('draw')
    })
  })

  describe('setActiveLabel', () => {
    it('sets active label id', () => {
      store.getState().setActiveLabel('label-1')
      expect(store.getState().activeLabelId).toBe('label-1')
    })

    it('clears active label with null', () => {
      store.getState().setActiveLabel('label-1')
      store.getState().setActiveLabel(null)
      expect(store.getState().activeLabelId).toBeNull()
    })

    it('changes from one label to another', () => {
      store.getState().setActiveLabel('label-1')
      store.getState().setActiveLabel('label-2')
      expect(store.getState().activeLabelId).toBe('label-2')
    })
  })

  describe('setSelectedAnnotation', () => {
    it('sets selected annotation id', () => {
      store.getState().setSelectedAnnotation('ann-1')
      expect(store.getState().selectedAnnotationId).toBe('ann-1')
    })

    it('clears selection with null', () => {
      store.getState().setSelectedAnnotation('ann-1')
      store.getState().setSelectedAnnotation(null)
      expect(store.getState().selectedAnnotationId).toBeNull()
    })
  })

  describe('setCurrentImageIndex', () => {
    it('changes the image index', () => {
      store.getState().setCurrentImageIndex(5)
      expect(store.getState().currentImageIndex).toBe(5)
    })

    it('clears selected annotation when changing image', () => {
      store.getState().setSelectedAnnotation('ann-1')
      expect(store.getState().selectedAnnotationId).toBe('ann-1')

      store.getState().setCurrentImageIndex(2)
      expect(store.getState().selectedAnnotationId).toBeNull()
    })

    it('sets index to 0', () => {
      store.getState().setCurrentImageIndex(3)
      store.getState().setCurrentImageIndex(0)
      expect(store.getState().currentImageIndex).toBe(0)
    })
  })

  describe('setZoom', () => {
    it('sets a valid zoom level', () => {
      store.getState().setZoom(2)
      expect(store.getState().zoom).toBe(2)
    })

    it('clamps zoom to minimum 0.1', () => {
      store.getState().setZoom(0.01)
      expect(store.getState().zoom).toBeCloseTo(0.1)
    })

    it('clamps zoom to maximum 10', () => {
      store.getState().setZoom(15)
      expect(store.getState().zoom).toBe(10)
    })

    it('allows zoom at exact lower bound 0.1', () => {
      store.getState().setZoom(0.1)
      expect(store.getState().zoom).toBeCloseTo(0.1)
    })

    it('allows zoom at exact upper bound 10', () => {
      store.getState().setZoom(10)
      expect(store.getState().zoom).toBe(10)
    })

    it('clamps negative zoom to 0.1', () => {
      store.getState().setZoom(-5)
      expect(store.getState().zoom).toBeCloseTo(0.1)
    })

    it('clamps zero zoom to 0.1', () => {
      store.getState().setZoom(0)
      expect(store.getState().zoom).toBeCloseTo(0.1)
    })

    it('sets fractional zoom values', () => {
      store.getState().setZoom(1.5)
      expect(store.getState().zoom).toBe(1.5)
    })
  })

  describe('setPan', () => {
    it('sets pan position', () => {
      store.getState().setPan(100, 200)
      expect(store.getState().panX).toBe(100)
      expect(store.getState().panY).toBe(200)
    })

    it('sets negative pan values', () => {
      store.getState().setPan(-50, -75)
      expect(store.getState().panX).toBe(-50)
      expect(store.getState().panY).toBe(-75)
    })

    it('sets pan to zero', () => {
      store.getState().setPan(100, 200)
      store.getState().setPan(0, 0)
      expect(store.getState().panX).toBe(0)
      expect(store.getState().panY).toBe(0)
    })
  })

  describe('resetView', () => {
    it('resets zoom to 1 and pan to 0,0', () => {
      store.getState().setZoom(3)
      store.getState().setPan(150, -200)

      store.getState().resetView()

      expect(store.getState().zoom).toBe(1)
      expect(store.getState().panX).toBe(0)
      expect(store.getState().panY).toBe(0)
    })

    it('does not affect other state when resetting view', () => {
      store.getState().setTool('select')
      store.getState().setActiveLabel('label-1')
      // setCurrentImageIndex clears selectedAnnotationId, so set it first
      store.getState().setCurrentImageIndex(3)
      store.getState().setSelectedAnnotation('ann-1')
      store.getState().setZoom(5)
      store.getState().setPan(100, 200)

      store.getState().resetView()

      expect(store.getState().tool).toBe('select')
      expect(store.getState().activeLabelId).toBe('label-1')
      expect(store.getState().selectedAnnotationId).toBe('ann-1')
      expect(store.getState().currentImageIndex).toBe(3)
      expect(store.getState().zoom).toBe(1)
      expect(store.getState().panX).toBe(0)
      expect(store.getState().panY).toBe(0)
    })

    it('is idempotent when already at default view', () => {
      store.getState().resetView()
      expect(store.getState().zoom).toBe(1)
      expect(store.getState().panX).toBe(0)
      expect(store.getState().panY).toBe(0)
    })
  })

  describe('setLocked', () => {
    it('sets locked to true', () => {
      store.getState().setLocked(true)
      expect(store.getState().locked).toBe(true)
    })

    it('sets locked to false', () => {
      store.getState().setLocked(true)
      store.getState().setLocked(false)
      expect(store.getState().locked).toBe(false)
    })

    it('does not affect other state', () => {
      store.getState().setTool('select')
      store.getState().setActiveLabel('label-1')
      store.getState().setLocked(true)

      expect(store.getState().tool).toBe('select')
      expect(store.getState().activeLabelId).toBe('label-1')
      expect(store.getState().locked).toBe(true)
    })
  })

  describe('setShowDataPreview', () => {
    it('sets showDataPreview to true', () => {
      store.getState().setShowDataPreview(true)
      expect(store.getState().showDataPreview).toBe(true)
    })

    it('sets showDataPreview to false', () => {
      store.getState().setShowDataPreview(true)
      store.getState().setShowDataPreview(false)
      expect(store.getState().showDataPreview).toBe(false)
    })
  })

  describe('favorites', () => {
    it('initializes with empty favorites by default', () => {
      expect(store.getState().favoriteLabelIds).toEqual([])
    })

    it('initializes with provided favorites', () => {
      const storeWithFavs = createUIStore(['a', 'b', 'c'])
      expect(storeWithFavs.getState().favoriteLabelIds).toEqual(['a', 'b', 'c'])
    })

    it('truncates initial favorites to max 9', () => {
      const ids = Array.from({ length: 12 }, (_, i) => `id-${i}`)
      const storeWithFavs = createUIStore(ids)
      expect(storeWithFavs.getState().favoriteLabelIds).toHaveLength(9)
    })

    describe('addFavoriteLabel', () => {
      it('adds a label to favorites', () => {
        store.getState().addFavoriteLabel('label-1')
        expect(store.getState().favoriteLabelIds).toEqual(['label-1'])
      })

      it('does not add duplicate', () => {
        store.getState().addFavoriteLabel('label-1')
        store.getState().addFavoriteLabel('label-1')
        expect(store.getState().favoriteLabelIds).toEqual(['label-1'])
      })

      it('respects max 9 limit', () => {
        for (let i = 0; i < 9; i++) {
          store.getState().addFavoriteLabel(`label-${i}`)
        }
        expect(store.getState().favoriteLabelIds).toHaveLength(9)
        store.getState().addFavoriteLabel('label-extra')
        expect(store.getState().favoriteLabelIds).toHaveLength(9)
        expect(store.getState().favoriteLabelIds).not.toContain('label-extra')
      })
    })

    describe('removeFavoriteLabel', () => {
      it('removes a label from favorites', () => {
        store.getState().addFavoriteLabel('label-1')
        store.getState().addFavoriteLabel('label-2')
        store.getState().removeFavoriteLabel('label-1')
        expect(store.getState().favoriteLabelIds).toEqual(['label-2'])
      })

      it('does nothing if label is not in favorites', () => {
        store.getState().addFavoriteLabel('label-1')
        store.getState().removeFavoriteLabel('label-999')
        expect(store.getState().favoriteLabelIds).toEqual(['label-1'])
      })
    })

    describe('setFavoriteLabelIds', () => {
      it('replaces all favorites', () => {
        store.getState().addFavoriteLabel('label-1')
        store.getState().setFavoriteLabelIds(['a', 'b', 'c'])
        expect(store.getState().favoriteLabelIds).toEqual(['a', 'b', 'c'])
      })

      it('truncates to max 9', () => {
        const ids = Array.from({ length: 15 }, (_, i) => `id-${i}`)
        store.getState().setFavoriteLabelIds(ids)
        expect(store.getState().favoriteLabelIds).toHaveLength(9)
      })
    })
  })
})
