import React, { createContext, useContext, useRef, type ReactNode } from 'react'
import { useStore, type StoreApi } from 'zustand'
import { createAnnotationStore, type AnnotationStore } from './annotation-store'
import { createUIStore, type UIStore } from './ui-store'
import type { Annotation } from '../types/annotations'

interface StoreContextValue {
  annotationStore: StoreApi<AnnotationStore>
  uiStore: StoreApi<UIStore>
}

const StoreContext = createContext<StoreContextValue | null>(null)

interface StoreProviderProps {
  children: ReactNode
  initialAnnotations?: Record<string, Annotation[]>
  initialFavorites?: string[]
}

export function StoreProvider({ children, initialAnnotations, initialFavorites }: StoreProviderProps) {
  const storesRef = useRef<StoreContextValue | null>(null)
  if (!storesRef.current) {
    storesRef.current = {
      annotationStore: createAnnotationStore(initialAnnotations),
      uiStore: createUIStore(initialFavorites),
    }
  }

  return <StoreContext.Provider value={storesRef.current}>{children}</StoreContext.Provider>
}

function useStoreContext() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStoreContext must be used within a StoreProvider')
  return ctx
}

export function useAnnotationStore<T>(selector: (state: AnnotationStore) => T): T {
  const { annotationStore } = useStoreContext()
  return useStore(annotationStore, selector)
}

export function useUIStore<T>(selector: (state: UIStore) => T): T {
  const { uiStore } = useStoreContext()
  return useStore(uiStore, selector)
}

export function useAnnotationStoreApi() {
  return useStoreContext().annotationStore
}

export function useUIStoreApi() {
  return useStoreContext().uiStore
}
