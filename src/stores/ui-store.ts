import { createStore } from 'zustand'
import type { Tool } from '../types/events'

export interface UIState {
  tool: Tool
  activeLabelId: string | null
  selectedAnnotationId: string | null
  currentImageIndex: number
  zoom: number
  panX: number
  panY: number
  locked: boolean
  showDataPreview: boolean
  favoriteLabelIds: string[]
}

export interface UIActions {
  setTool: (tool: Tool) => void
  setActiveLabel: (labelId: string | null) => void
  setSelectedAnnotation: (id: string | null) => void
  setCurrentImageIndex: (index: number) => void
  setZoom: (zoom: number) => void
  setPan: (x: number, y: number) => void
  resetView: () => void
  setLocked: (locked: boolean) => void
  setShowDataPreview: (show: boolean) => void
  setFavoriteLabelIds: (ids: string[]) => void
  addFavoriteLabel: (id: string) => void
  removeFavoriteLabel: (id: string) => void
}

export type UIStore = UIState & UIActions

export const createUIStore = (initialFavorites?: string[]) =>
  createStore<UIStore>((set) => ({
    tool: 'draw',
    activeLabelId: null,
    selectedAnnotationId: null,
    currentImageIndex: 0,
    zoom: 1,
    panX: 0,
    panY: 0,
    locked: false,
    showDataPreview: false,
    favoriteLabelIds: initialFavorites?.slice(0, 9) ?? [],

    setTool: (tool) => set({ tool }),
    setActiveLabel: (labelId) => set({ activeLabelId: labelId }),
    setSelectedAnnotation: (id) => set({ selectedAnnotationId: id }),
    setCurrentImageIndex: (index) => set({ currentImageIndex: index, selectedAnnotationId: null }),
    setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(10, zoom)) }),
    setPan: (x, y) => set({ panX: x, panY: y }),
    resetView: () => set({ zoom: 1, panX: 0, panY: 0 }),
    setLocked: (locked) => set({ locked }),
    setShowDataPreview: (show) => set({ showDataPreview: show }),
    setFavoriteLabelIds: (ids) => set({ favoriteLabelIds: ids.slice(0, 9) }),
    addFavoriteLabel: (id) =>
      set((state) => {
        if (state.favoriteLabelIds.length >= 9 || state.favoriteLabelIds.includes(id)) {
          return state
        }
        return { favoriteLabelIds: [...state.favoriteLabelIds, id] }
      }),
    removeFavoriteLabel: (id) =>
      set((state) => ({
        favoriteLabelIds: state.favoriteLabelIds.filter((fid) => fid !== id),
      })),
  }))
