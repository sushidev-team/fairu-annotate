import { createStore } from 'zustand'
import type { Annotation } from '../types/annotations'

const MAX_HISTORY = 50

interface HistoryEntry {
  annotations: Record<string, Annotation[]>
}

export interface AnnotationState {
  annotations: Record<string, Annotation[]>
  undoStack: HistoryEntry[]
  redoStack: HistoryEntry[]
}

export interface AnnotationActions {
  getAnnotations: (imageId: string) => Annotation[]
  addAnnotation: (annotation: Annotation) => void
  updateAnnotation: (id: string, imageId: string, updates: Partial<Annotation>) => void
  removeAnnotation: (id: string, imageId: string) => void
  setAnnotations: (imageId: string, annotations: Annotation[]) => void
  loadAnnotations: (all: Record<string, Annotation[]>) => void
  undo: () => void
  redo: () => void
}

export type AnnotationStore = AnnotationState & AnnotationActions

function pushHistory(state: AnnotationState): Pick<AnnotationState, 'undoStack' | 'redoStack'> {
  return {
    undoStack: [...state.undoStack.slice(-(MAX_HISTORY - 1)), { annotations: state.annotations }],
    redoStack: [],
  }
}

export const createAnnotationStore = (initial?: Record<string, Annotation[]>) =>
  createStore<AnnotationStore>((set, get) => ({
    annotations: initial ?? {},
    undoStack: [],
    redoStack: [],

    getAnnotations: (imageId) => get().annotations[imageId] ?? [],

    addAnnotation: (annotation) =>
      set((state) => {
        const current = state.annotations[annotation.imageId] ?? []
        return {
          ...pushHistory(state),
          annotations: {
            ...state.annotations,
            [annotation.imageId]: [...current, annotation],
          },
        }
      }),

    updateAnnotation: (id, imageId, updates) =>
      set((state) => {
        const current = state.annotations[imageId] ?? []
        return {
          ...pushHistory(state),
          annotations: {
            ...state.annotations,
            [imageId]: current.map((a) => (a.id === id ? { ...a, ...updates } : a)),
          },
        }
      }),

    removeAnnotation: (id, imageId) =>
      set((state) => {
        const current = state.annotations[imageId] ?? []
        return {
          ...pushHistory(state),
          annotations: {
            ...state.annotations,
            [imageId]: current.filter((a) => a.id !== id),
          },
        }
      }),

    setAnnotations: (imageId, annotations) =>
      set((state) => ({
        ...pushHistory(state),
        annotations: { ...state.annotations, [imageId]: annotations },
      })),

    loadAnnotations: (all) => set({ annotations: all, undoStack: [], redoStack: [] }),

    undo: () =>
      set((state) => {
        if (state.undoStack.length === 0) return state
        const prev = state.undoStack[state.undoStack.length - 1]
        return {
          annotations: prev.annotations,
          undoStack: state.undoStack.slice(0, -1),
          redoStack: [...state.redoStack, { annotations: state.annotations }],
        }
      }),

    redo: () =>
      set((state) => {
        if (state.redoStack.length === 0) return state
        const next = state.redoStack[state.redoStack.length - 1]
        return {
          annotations: next.annotations,
          undoStack: [...state.undoStack, { annotations: state.annotations }],
          redoStack: state.redoStack.slice(0, -1),
        }
      }),
  }))
