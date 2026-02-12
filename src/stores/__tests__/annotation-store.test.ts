import { describe, it, expect, beforeEach } from 'vitest'
import { createAnnotationStore, type AnnotationStore } from '../annotation-store'
import type { Annotation } from '../../types/annotations'
import type { StoreApi } from 'zustand'

function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: 'a1',
    imageId: 'img1',
    labelId: 'label-1',
    type: 'box',
    box: { x: 10, y: 20, width: 100, height: 80 },
    ...overrides,
  }
}

describe('createAnnotationStore', () => {
  let store: StoreApi<AnnotationStore>

  beforeEach(() => {
    store = createAnnotationStore()
  })

  it('creates store with empty initial state', () => {
    const state = store.getState()
    expect(state.annotations).toEqual({})
    expect(state.undoStack).toEqual([])
    expect(state.redoStack).toEqual([])
  })

  it('creates store with initial annotations', () => {
    const initial = {
      img1: [makeAnnotation()],
      img2: [makeAnnotation({ id: 'a2', imageId: 'img2' })],
    }
    const storeWithInitial = createAnnotationStore(initial)
    const state = storeWithInitial.getState()

    expect(state.annotations.img1).toHaveLength(1)
    expect(state.annotations.img2).toHaveLength(1)
    expect(state.annotations.img1[0].id).toBe('a1')
  })
})

describe('getAnnotations', () => {
  let store: StoreApi<AnnotationStore>

  beforeEach(() => {
    store = createAnnotationStore()
  })

  it('returns annotations for a given imageId', () => {
    const ann = makeAnnotation()
    store.getState().addAnnotation(ann)

    const result = store.getState().getAnnotations('img1')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('a1')
  })

  it('returns empty array for unknown imageId', () => {
    const result = store.getState().getAnnotations('nonexistent')
    expect(result).toEqual([])
  })
})

describe('addAnnotation', () => {
  let store: StoreApi<AnnotationStore>

  beforeEach(() => {
    store = createAnnotationStore()
  })

  it('adds an annotation to the correct imageId', () => {
    const ann = makeAnnotation()
    store.getState().addAnnotation(ann)

    expect(store.getState().annotations.img1).toHaveLength(1)
    expect(store.getState().annotations.img1[0]).toEqual(ann)
  })

  it('adds multiple annotations to the same imageId', () => {
    store.getState().addAnnotation(makeAnnotation({ id: 'a1' }))
    store.getState().addAnnotation(makeAnnotation({ id: 'a2' }))

    expect(store.getState().annotations.img1).toHaveLength(2)
  })

  it('adds annotations to different imageIds', () => {
    store.getState().addAnnotation(makeAnnotation({ id: 'a1', imageId: 'img1' }))
    store.getState().addAnnotation(makeAnnotation({ id: 'a2', imageId: 'img2' }))

    expect(store.getState().annotations.img1).toHaveLength(1)
    expect(store.getState().annotations.img2).toHaveLength(1)
  })
})

describe('updateAnnotation', () => {
  let store: StoreApi<AnnotationStore>

  beforeEach(() => {
    store = createAnnotationStore()
    store.getState().addAnnotation(makeAnnotation({ id: 'a1' }))
    store.getState().addAnnotation(makeAnnotation({ id: 'a2' }))
  })

  it('updates a specific annotation by id', () => {
    store.getState().updateAnnotation('a1', 'img1', { labelId: 'label-2' })

    const annotations = store.getState().annotations.img1
    expect(annotations[0].labelId).toBe('label-2')
    // Other annotation is unchanged
    expect(annotations[1].labelId).toBe('label-1')
  })

  it('updates the bounding box of an annotation', () => {
    const newBox = { x: 50, y: 60, width: 200, height: 150 }
    store.getState().updateAnnotation('a1', 'img1', { box: newBox })

    const updated = store.getState().annotations.img1[0]
    expect(updated.box).toEqual(newBox)
  })

  it('does not affect annotations in other imageIds', () => {
    store.getState().addAnnotation(makeAnnotation({ id: 'a3', imageId: 'img2' }))
    store.getState().updateAnnotation('a1', 'img1', { labelId: 'label-2' })

    expect(store.getState().annotations.img2[0].labelId).toBe('label-1')
  })
})

describe('removeAnnotation', () => {
  let store: StoreApi<AnnotationStore>

  beforeEach(() => {
    store = createAnnotationStore()
    store.getState().addAnnotation(makeAnnotation({ id: 'a1' }))
    store.getState().addAnnotation(makeAnnotation({ id: 'a2' }))
  })

  it('removes a specific annotation by id', () => {
    store.getState().removeAnnotation('a1', 'img1')

    const annotations = store.getState().annotations.img1
    expect(annotations).toHaveLength(1)
    expect(annotations[0].id).toBe('a2')
  })

  it('removes all annotations leaving empty array', () => {
    store.getState().removeAnnotation('a1', 'img1')
    store.getState().removeAnnotation('a2', 'img1')

    expect(store.getState().annotations.img1).toHaveLength(0)
  })

  it('does not affect other imageIds', () => {
    store.getState().addAnnotation(makeAnnotation({ id: 'a3', imageId: 'img2' }))
    store.getState().removeAnnotation('a1', 'img1')

    expect(store.getState().annotations.img2).toHaveLength(1)
  })
})

describe('setAnnotations', () => {
  let store: StoreApi<AnnotationStore>

  beforeEach(() => {
    store = createAnnotationStore()
  })

  it('replaces all annotations for a given imageId', () => {
    store.getState().addAnnotation(makeAnnotation({ id: 'a1' }))
    store.getState().addAnnotation(makeAnnotation({ id: 'a2' }))

    const newAnnotations = [makeAnnotation({ id: 'a3' }), makeAnnotation({ id: 'a4' }), makeAnnotation({ id: 'a5' })]
    store.getState().setAnnotations('img1', newAnnotations)

    expect(store.getState().annotations.img1).toHaveLength(3)
    expect(store.getState().annotations.img1[0].id).toBe('a3')
  })

  it('can set annotations for a new imageId', () => {
    const annotations = [makeAnnotation({ id: 'b1', imageId: 'img2' })]
    store.getState().setAnnotations('img2', annotations)

    expect(store.getState().annotations.img2).toHaveLength(1)
  })

  it('can clear annotations by setting empty array', () => {
    store.getState().addAnnotation(makeAnnotation())
    store.getState().setAnnotations('img1', [])

    expect(store.getState().annotations.img1).toHaveLength(0)
  })
})

describe('undo and redo', () => {
  let store: StoreApi<AnnotationStore>

  beforeEach(() => {
    store = createAnnotationStore()
  })

  it('undoes an add, reverting to empty', () => {
    store.getState().addAnnotation(makeAnnotation())
    expect(store.getState().annotations.img1).toHaveLength(1)

    store.getState().undo()
    expect(store.getState().annotations.img1).toBeUndefined()
  })

  it('redoes after undo, restoring annotation', () => {
    store.getState().addAnnotation(makeAnnotation())
    store.getState().undo()
    store.getState().redo()

    expect(store.getState().annotations.img1).toHaveLength(1)
    expect(store.getState().annotations.img1[0].id).toBe('a1')
  })

  it('handles multiple undos in sequence', () => {
    store.getState().addAnnotation(makeAnnotation({ id: 'a1' }))
    store.getState().addAnnotation(makeAnnotation({ id: 'a2' }))
    store.getState().addAnnotation(makeAnnotation({ id: 'a3' }))

    expect(store.getState().annotations.img1).toHaveLength(3)

    store.getState().undo()
    expect(store.getState().annotations.img1).toHaveLength(2)

    store.getState().undo()
    expect(store.getState().annotations.img1).toHaveLength(1)

    store.getState().undo()
    expect(store.getState().annotations.img1).toBeUndefined()
  })

  it('handles multiple redos after undos', () => {
    store.getState().addAnnotation(makeAnnotation({ id: 'a1' }))
    store.getState().addAnnotation(makeAnnotation({ id: 'a2' }))

    store.getState().undo()
    store.getState().undo()

    store.getState().redo()
    expect(store.getState().annotations.img1).toHaveLength(1)

    store.getState().redo()
    expect(store.getState().annotations.img1).toHaveLength(2)
  })

  it('clears redo stack on new action after undo', () => {
    store.getState().addAnnotation(makeAnnotation({ id: 'a1' }))
    store.getState().addAnnotation(makeAnnotation({ id: 'a2' }))

    store.getState().undo()
    expect(store.getState().redoStack).toHaveLength(1)

    // New action should clear redo stack
    store.getState().addAnnotation(makeAnnotation({ id: 'a3' }))
    expect(store.getState().redoStack).toHaveLength(0)
  })

  it('does nothing when undo is called with empty undo stack', () => {
    const stateBefore = store.getState().annotations
    store.getState().undo()
    expect(store.getState().annotations).toBe(stateBefore)
  })

  it('does nothing when redo is called with empty redo stack', () => {
    const stateBefore = store.getState().annotations
    store.getState().redo()
    expect(store.getState().annotations).toBe(stateBefore)
  })

  it('limits undo history to MAX_HISTORY (50) entries', () => {
    // Perform 55 actions
    for (let i = 0; i < 55; i++) {
      store.getState().addAnnotation(makeAnnotation({ id: `a${i}` }))
    }

    // Undo stack should be capped at 50
    expect(store.getState().undoStack.length).toBeLessThanOrEqual(50)
  })

  it('undo on remove restores the annotation', () => {
    store.getState().addAnnotation(makeAnnotation({ id: 'a1' }))
    store.getState().removeAnnotation('a1', 'img1')

    expect(store.getState().annotations.img1).toHaveLength(0)

    store.getState().undo()
    expect(store.getState().annotations.img1).toHaveLength(1)
    expect(store.getState().annotations.img1[0].id).toBe('a1')
  })

  it('undo on update restores the previous value', () => {
    store.getState().addAnnotation(makeAnnotation({ id: 'a1', labelId: 'label-1' }))
    store.getState().updateAnnotation('a1', 'img1', { labelId: 'label-2' })

    expect(store.getState().annotations.img1[0].labelId).toBe('label-2')

    store.getState().undo()
    expect(store.getState().annotations.img1[0].labelId).toBe('label-1')
  })
})

describe('loadAnnotations', () => {
  let store: StoreApi<AnnotationStore>

  beforeEach(() => {
    store = createAnnotationStore()
  })

  it('replaces all annotations', () => {
    store.getState().addAnnotation(makeAnnotation({ id: 'a1', imageId: 'img1' }))

    const newAll = {
      img2: [makeAnnotation({ id: 'b1', imageId: 'img2' })],
      img3: [makeAnnotation({ id: 'c1', imageId: 'img3' })],
    }
    store.getState().loadAnnotations(newAll)

    expect(store.getState().annotations.img1).toBeUndefined()
    expect(store.getState().annotations.img2).toHaveLength(1)
    expect(store.getState().annotations.img3).toHaveLength(1)
  })

  it('clears undo and redo history', () => {
    store.getState().addAnnotation(makeAnnotation())
    store.getState().addAnnotation(makeAnnotation({ id: 'a2' }))
    store.getState().undo()

    // Both stacks should be non-empty before load
    expect(store.getState().undoStack.length).toBeGreaterThan(0)
    expect(store.getState().redoStack.length).toBeGreaterThan(0)

    store.getState().loadAnnotations({})

    expect(store.getState().undoStack).toHaveLength(0)
    expect(store.getState().redoStack).toHaveLength(0)
  })

  it('works with empty annotations object', () => {
    store.getState().addAnnotation(makeAnnotation())
    store.getState().loadAnnotations({})

    expect(store.getState().annotations).toEqual({})
  })
})
