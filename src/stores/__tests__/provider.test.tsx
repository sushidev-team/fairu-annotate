import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderHook } from '@testing-library/react'
import { StoreProvider, useAnnotationStore, useUIStore, useAnnotationStoreApi, useUIStoreApi } from '../provider'
import type { Annotation } from '../../types/annotations'

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(StoreProvider, null, children)
}

function createWrapperWithProps(props: { initialAnnotations?: Record<string, Annotation[]>; initialFavorites?: string[] }) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(StoreProvider, { ...props, children })
  }
}

describe('StoreProvider', () => {
  it('renders children', () => {
    // If the provider doesn't render children, hooks would fail to access context.
    // This is implicitly tested by all other tests, but we verify explicitly.
    const { result } = renderHook(
      () => useAnnotationStore((s) => s.annotations),
      { wrapper },
    )
    expect(result.current).toBeDefined()
  })

  describe('useAnnotationStore', () => {
    it('throws when used outside StoreProvider', () => {
      expect(() => {
        renderHook(() => useAnnotationStore((s) => s.annotations))
      }).toThrow('useStoreContext must be used within a StoreProvider')
    })

    it('returns valid annotation state when used within provider', () => {
      const { result } = renderHook(
        () => useAnnotationStore((s) => s),
        { wrapper },
      )

      expect(result.current.annotations).toEqual({})
      expect(typeof result.current.getAnnotations).toBe('function')
      expect(typeof result.current.addAnnotation).toBe('function')
      expect(typeof result.current.updateAnnotation).toBe('function')
      expect(typeof result.current.removeAnnotation).toBe('function')
      expect(typeof result.current.setAnnotations).toBe('function')
      expect(typeof result.current.loadAnnotations).toBe('function')
      expect(typeof result.current.undo).toBe('function')
      expect(typeof result.current.redo).toBe('function')
      expect(result.current.undoStack).toEqual([])
      expect(result.current.redoStack).toEqual([])
    })
  })

  describe('useUIStore', () => {
    it('throws when used outside StoreProvider', () => {
      expect(() => {
        renderHook(() => useUIStore((s) => s.tool))
      }).toThrow('useStoreContext must be used within a StoreProvider')
    })

    it('returns valid UI state when used within provider', () => {
      const { result } = renderHook(
        () => useUIStore((s) => s),
        { wrapper },
      )

      expect(result.current.tool).toBe('draw')
      expect(result.current.activeLabelId).toBeNull()
      expect(result.current.selectedAnnotationId).toBeNull()
      expect(result.current.currentImageIndex).toBe(0)
      expect(result.current.zoom).toBe(1)
      expect(result.current.panX).toBe(0)
      expect(result.current.panY).toBe(0)
      expect(result.current.locked).toBe(false)
      expect(result.current.showDataPreview).toBe(false)
      expect(result.current.favoriteLabelIds).toEqual([])
      expect(typeof result.current.setTool).toBe('function')
      expect(typeof result.current.setActiveLabel).toBe('function')
      expect(typeof result.current.setZoom).toBe('function')
    })
  })

  describe('useAnnotationStoreApi', () => {
    it('throws when used outside StoreProvider', () => {
      expect(() => {
        renderHook(() => useAnnotationStoreApi())
      }).toThrow('useStoreContext must be used within a StoreProvider')
    })

    it('returns a usable store API object', () => {
      const { result } = renderHook(
        () => useAnnotationStoreApi(),
        { wrapper },
      )

      expect(result.current).toBeDefined()
      expect(typeof result.current.getState).toBe('function')
      expect(typeof result.current.setState).toBe('function')
      expect(typeof result.current.subscribe).toBe('function')

      const state = result.current.getState()
      expect(state.annotations).toEqual({})
      expect(typeof state.getAnnotations).toBe('function')
    })
  })

  describe('useUIStoreApi', () => {
    it('throws when used outside StoreProvider', () => {
      expect(() => {
        renderHook(() => useUIStoreApi())
      }).toThrow('useStoreContext must be used within a StoreProvider')
    })

    it('returns a usable store API object', () => {
      const { result } = renderHook(
        () => useUIStoreApi(),
        { wrapper },
      )

      expect(result.current).toBeDefined()
      expect(typeof result.current.getState).toBe('function')
      expect(typeof result.current.setState).toBe('function')
      expect(typeof result.current.subscribe).toBe('function')

      const state = result.current.getState()
      expect(state.tool).toBe('draw')
      expect(typeof state.setTool).toBe('function')
    })
  })

  describe('initial data', () => {
    it('passes initial annotations to the store', () => {
      const annotations: Record<string, Annotation[]> = {
        'img-1': [
          {
            id: 'a1',
            imageId: 'img-1',
            labelId: 'label-1',
            type: 'box',
            box: { x: 10, y: 20, width: 100, height: 200 },
          },
        ],
      }

      const { result } = renderHook(
        () => useAnnotationStore((s) => s),
        { wrapper: createWrapperWithProps({ initialAnnotations: annotations }) },
      )

      expect(result.current.annotations).toEqual(annotations)
      expect(result.current.getAnnotations('img-1')).toHaveLength(1)
      expect(result.current.getAnnotations('img-1')[0].id).toBe('a1')
    })

    it('passes initial favorites to the UI store', () => {
      const favorites = ['fav-1', 'fav-2', 'fav-3']

      const { result } = renderHook(
        () => useUIStore((s) => s.favoriteLabelIds),
        { wrapper: createWrapperWithProps({ initialFavorites: favorites }) },
      )

      expect(result.current).toEqual(favorites)
    })

    it('slices initial favorites to max 9 entries', () => {
      const favorites = Array.from({ length: 15 }, (_, i) => `fav-${i}`)

      const { result } = renderHook(
        () => useUIStore((s) => s.favoriteLabelIds),
        { wrapper: createWrapperWithProps({ initialFavorites: favorites }) },
      )

      expect(result.current).toHaveLength(9)
      expect(result.current).toEqual(favorites.slice(0, 9))
    })

    it('returns empty annotations when no initial data provided', () => {
      const { result } = renderHook(
        () => useAnnotationStore((s) => s.annotations),
        { wrapper },
      )

      expect(result.current).toEqual({})
    })

    it('returns empty favorites when no initial data provided', () => {
      const { result } = renderHook(
        () => useUIStore((s) => s.favoriteLabelIds),
        { wrapper },
      )

      expect(result.current).toEqual([])
    })
  })
})
