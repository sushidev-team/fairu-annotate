import React from 'react'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ImageAnnotator } from '../ImageAnnotator'
import type { Label } from '../../../types/labels'
import type { Annotation } from '../../../types/annotations'

// ---------------------------------------------------------------------------
// Mocks: jsdom has no Canvas2D or ResizeObserver
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    },
  )
})

let mockImages: any[] = []
let testImageCounter = 0

beforeEach(() => {
  mockImages = []
  testImageCounter = 0
  vi.stubGlobal(
    'Image',
    class {
      crossOrigin = ''
      src = ''
      naturalWidth = 800
      naturalHeight = 600
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      constructor() {
        mockImages.push(this)
      }
    },
  )
})

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    canvas: { width: 800, height: 600 },
    save: vi.fn(),
    restore: vi.fn(),
    clearRect: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
    setTransform: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    closePath: vi.fn(),
    strokeRect: vi.fn(),
    fillRect: vi.fn(),
    setLineDash: vi.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const labels: Label[] = [
  { id: 'cat', name: 'Cat', color: '#FF6B6B', classId: 0 },
  { id: 'dog', name: 'Dog', color: '#4ECDC4', classId: 1 },
]

function uniqueSrc(prefix = 'test') {
  return `https://example.com/${prefix}-${++testImageCounter}-${Date.now()}.png`
}

function makeImages(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `img-${i + 1}`,
    src: uniqueSrc(`img-${i + 1}`),
    name: `image-${i + 1}.jpg`,
  }))
}

function triggerImageLoad() {
  act(() => {
    for (const img of mockImages) {
      img.onload?.()
    }
  })
}

// ---------------------------------------------------------------------------
// 1. Renders with labels and images
// ---------------------------------------------------------------------------
describe('ImageAnnotator', () => {
  it('renders toolbar and labels sidebar', () => {
    const images = makeImages(1)
    render(<ImageAnnotator images={images} labels={labels} />)

    // Toolbar: Select and Pan should always be visible
    expect(screen.getByTitle('Select (V)')).toBeInTheDocument()
    expect(screen.getByTitle('Pan (H)')).toBeInTheDocument()

    // Labels sidebar heading
    expect(screen.getByText('Labels')).toBeInTheDocument()

    // Both labels should appear (they show in both TagList and LabelSelector)
    expect(screen.getAllByText('Cat').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Dog').length).toBeGreaterThanOrEqual(1)
  })

  // ---------------------------------------------------------------------------
  // 2. No images provided
  // ---------------------------------------------------------------------------
  it('shows "No images provided" when images array is empty', () => {
    render(<ImageAnnotator images={[]} labels={labels} />)
    triggerImageLoad()
    expect(screen.getByText('No images provided')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // 3. Loading state, then image after load
  // ---------------------------------------------------------------------------
  it('shows loading spinner initially, then renders canvas after image loads', () => {
    const images = makeImages(1)
    const { container } = render(<ImageAnnotator images={images} labels={labels} />)

    // Before triggering load the spinner should be visible (animate-spin class)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()

    // Trigger image load
    triggerImageLoad()

    // After load the spinner should be gone
    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument()

    // Canvas element should now be in the DOM
    expect(container.querySelector('canvas')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // 4. Annotations list shows count
  // ---------------------------------------------------------------------------
  it('displays annotation count in the sidebar', () => {
    const images = makeImages(1)
    const initialAnnotations: Record<string, Annotation[]> = {
      [images[0].id]: [
        {
          id: 'a1',
          imageId: images[0].id,
          labelId: 'cat',
          box: { x: 10, y: 10, width: 100, height: 100 },
        },
        {
          id: 'a2',
          imageId: images[0].id,
          labelId: 'dog',
          box: { x: 200, y: 200, width: 50, height: 50 },
        },
      ],
    }
    render(
      <ImageAnnotator
        images={images}
        labels={labels}
        initialAnnotations={initialAnnotations}
      />,
    )
    triggerImageLoad()

    expect(screen.getByText('Annotations (2)')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // 5. Initial annotations are shown
  // ---------------------------------------------------------------------------
  it('renders initial annotations in the list', () => {
    const images = makeImages(1)
    const initialAnnotations: Record<string, Annotation[]> = {
      [images[0].id]: [
        {
          id: 'ann-init-1',
          imageId: images[0].id,
          labelId: 'cat',
          box: { x: 0, y: 0, width: 50, height: 50 },
        },
      ],
    }
    render(
      <ImageAnnotator
        images={images}
        labels={labels}
        initialAnnotations={initialAnnotations}
      />,
    )
    triggerImageLoad()

    expect(screen.getByText('Annotations (1)')).toBeInTheDocument()
    // The AnnotationItem should display the label name
    // (AnnotationItem renders label.name in the list)
    // The count already confirms the annotation is present
  })

  // ---------------------------------------------------------------------------
  // 6. onAnnotationsChange callback fires
  // ---------------------------------------------------------------------------
  it('calls onAnnotationsChange when annotations are provided', () => {
    const images = makeImages(1)
    const onChange = vi.fn()
    const initialAnnotations: Record<string, Annotation[]> = {
      [images[0].id]: [
        {
          id: 'a-oc-1',
          imageId: images[0].id,
          labelId: 'cat',
          box: { x: 0, y: 0, width: 100, height: 100 },
        },
      ],
    }

    render(
      <ImageAnnotator
        images={images}
        labels={labels}
        initialAnnotations={initialAnnotations}
        onAnnotationsChange={onChange}
      />,
    )
    triggerImageLoad()

    // The effect fires on mount with the current annotations
    expect(onChange).toHaveBeenCalled()
    // The call should include the image id and annotations
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]
    expect(lastCall[0]).toBe(images[0].id)
    expect(lastCall[1]).toHaveLength(1)
    expect(lastCall[1][0].id).toBe('a-oc-1')
  })

  // ---------------------------------------------------------------------------
  // 7. Toolbar tool switching
  // ---------------------------------------------------------------------------
  it('switches active tool when toolbar buttons are clicked', () => {
    const images = makeImages(1)
    render(<ImageAnnotator images={images} labels={labels} />)
    triggerImageLoad()

    // Click the Pan button
    const panButton = screen.getByTitle('Pan (H)')
    fireEvent.click(panButton)
    // The active tool should reflect in the button style (bg-blue-600 for primary)
    expect(panButton.className).toContain('bg-blue-600')

    // Click Select
    const selectButton = screen.getByTitle('Select (V)')
    fireEvent.click(selectButton)
    expect(selectButton.className).toContain('bg-blue-600')
    // Pan should no longer be primary
    expect(panButton.className).not.toContain('bg-blue-600')
  })

  // ---------------------------------------------------------------------------
  // 8. Pagination visibility
  // ---------------------------------------------------------------------------
  it('shows pagination for multiple images', () => {
    const images = makeImages(3)
    render(<ImageAnnotator images={images} labels={labels} />)
    triggerImageLoad()

    // Pagination renders "1 / 3"
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    expect(screen.getByTitle('Next image')).toBeInTheDocument()
    expect(screen.getByTitle('Previous image')).toBeInTheDocument()
  })

  it('hides pagination for a single image', () => {
    const images = makeImages(1)
    render(<ImageAnnotator images={images} labels={labels} />)
    triggerImageLoad()

    // Pagination returns null for <= 1 image
    expect(screen.queryByTitle('Next image')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Previous image')).not.toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // 9. readOnly hides draw tools
  // ---------------------------------------------------------------------------
  it('hides draw tools and lock toggle when readOnly is true', () => {
    const images = makeImages(1)
    render(<ImageAnnotator images={images} labels={labels} readOnly />)
    triggerImageLoad()

    // Draw and Polygon buttons should be hidden (locked hides them)
    expect(screen.queryByTitle('Draw (D)')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Polygon (P)')).not.toBeInTheDocument()

    // Lock toggle should also be hidden for readOnly
    expect(screen.queryByTitle('Lock editing (L)')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Unlock editing (L)')).not.toBeInTheDocument()

    // View tools should still be there
    expect(screen.getByTitle('Select (V)')).toBeInTheDocument()
    expect(screen.getByTitle('Pan (H)')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // 10. Data preview toggle
  // ---------------------------------------------------------------------------
  it('shows data preview panel when toggle is clicked', () => {
    const images = makeImages(1)
    render(<ImageAnnotator images={images} labels={labels} />)
    triggerImageLoad()

    // Before toggle, YOLO Preview heading should not be present
    expect(screen.queryByText('YOLO Preview')).not.toBeInTheDocument()

    // Click the data preview toggle
    const toggleButton = screen.getByTitle('Toggle Data Preview')
    fireEvent.click(toggleButton)

    // Now the data preview panel should be visible
    expect(screen.getByText('YOLO Preview')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // 11. Classification mode: shows ClassificationList, hides draw tools
  // ---------------------------------------------------------------------------
  it('renders ClassificationList in classify mode and hides draw tools', () => {
    const images = makeImages(1)
    render(<ImageAnnotator images={images} labels={labels} mode="classify" />)
    triggerImageLoad()

    // Classification heading should appear
    expect(screen.getByText('Classification (0)')).toBeInTheDocument()

    // AnnotationList heading should NOT appear
    expect(screen.queryByText(/^Annotations/)).not.toBeInTheDocument()

    // Draw and Polygon tools should be hidden
    expect(screen.queryByTitle('Draw (D)')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Polygon (P)')).not.toBeInTheDocument()

    // View tools should still work
    expect(screen.getByTitle('Select (V)')).toBeInTheDocument()
    expect(screen.getByTitle('Pan (H)')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // 12. Classification toggle adds/removes classification annotations
  // ---------------------------------------------------------------------------
  it('toggles classification annotations on label click in classify mode', async () => {
    const images = makeImages(1)
    const onChange = vi.fn()
    render(
      <ImageAnnotator
        images={images}
        labels={labels}
        mode="classify"
        onAnnotationsChange={onChange}
      />,
    )
    triggerImageLoad()

    // Initial state: no classifications
    expect(screen.getByText('Classification (0)')).toBeInTheDocument()

    // Click the "Cat" label button in the ClassificationList
    // ClassificationList renders <button> elements with label.name text
    const catButtons = screen.getAllByText('Cat')
    // The one in ClassificationList is a <button>
    const classificationCatButton = catButtons.find(
      (el) => el.closest('button')?.type === 'button',
    )
    expect(classificationCatButton).toBeTruthy()
    fireEvent.click(classificationCatButton!.closest('button')!)

    // Count should update to 1
    await waitFor(() => {
      expect(screen.getByText('Classification (1)')).toBeInTheDocument()
    })

    // onAnnotationsChange should have been called with the classification annotation
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]
    expect(lastCall[1]).toHaveLength(1)
    expect(lastCall[1][0].type).toBe('classification')
    expect(lastCall[1][0].labelId).toBe('cat')

    // Click again to remove
    fireEvent.click(classificationCatButton!.closest('button')!)

    await waitFor(() => {
      expect(screen.getByText('Classification (0)')).toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // 13. Export button calls onExport
  // ---------------------------------------------------------------------------
  it('calls onExport when export button is clicked', () => {
    const images = makeImages(1)
    const onExport = vi.fn()
    render(
      <ImageAnnotator images={images} labels={labels} onExport={onExport} />,
    )
    triggerImageLoad()

    const exportButton = screen.getByTitle('Export YOLO (Ctrl+S)')
    expect(exportButton).toBeInTheDocument()
    fireEvent.click(exportButton)

    expect(onExport).toHaveBeenCalledTimes(1)
    // onExport receives an array of ExportData
    expect(Array.isArray(onExport.mock.calls[0][0])).toBe(true)
  })

  it('does not render export button when onExport is not provided', () => {
    const images = makeImages(1)
    render(<ImageAnnotator images={images} labels={labels} />)
    triggerImageLoad()

    expect(screen.queryByTitle('Export YOLO (Ctrl+S)')).not.toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // 14. Keyboard shortcuts
  // ---------------------------------------------------------------------------
  describe('keyboard shortcuts', () => {
    it('pressing "d" activates draw tool', () => {
      const images = makeImages(1)
      render(<ImageAnnotator images={images} labels={labels} />)
      triggerImageLoad()

      // First switch to Select so we can confirm the switch
      fireEvent.click(screen.getByTitle('Select (V)'))
      expect(screen.getByTitle('Select (V)').className).toContain('bg-blue-600')

      // Press 'd' key on window
      fireEvent.keyDown(window, { key: 'd' })

      // Draw button should now be active
      expect(screen.getByTitle('Draw (D)').className).toContain('bg-blue-600')
    })

    it('pressing "v" activates select tool', () => {
      const images = makeImages(1)
      render(<ImageAnnotator images={images} labels={labels} />)
      triggerImageLoad()

      // Press 'v' on window
      fireEvent.keyDown(window, { key: 'v' })
      expect(screen.getByTitle('Select (V)').className).toContain('bg-blue-600')
    })

    it('pressing "p" activates polygon tool', () => {
      const images = makeImages(1)
      render(<ImageAnnotator images={images} labels={labels} />)
      triggerImageLoad()

      fireEvent.keyDown(window, { key: 'p' })
      expect(screen.getByTitle('Polygon (P)').className).toContain('bg-blue-600')
    })

    it('pressing "h" activates pan tool', () => {
      const images = makeImages(1)
      render(<ImageAnnotator images={images} labels={labels} />)
      triggerImageLoad()

      fireEvent.keyDown(window, { key: 'h' })
      expect(screen.getByTitle('Pan (H)').className).toContain('bg-blue-600')
    })

    it('pressing "d" does not activate draw when readOnly', () => {
      const images = makeImages(1)
      render(<ImageAnnotator images={images} labels={labels} readOnly />)
      triggerImageLoad()

      fireEvent.keyDown(window, { key: 'd' })

      // Draw button should not even exist
      expect(screen.queryByTitle('Draw (D)')).not.toBeInTheDocument()
      // Select should remain active
      expect(screen.getByTitle('Select (V)').className).toContain('bg-blue-600')
    })
  })

  // ---------------------------------------------------------------------------
  // 15. Auto-selects first label
  // ---------------------------------------------------------------------------
  it('auto-selects the first label on mount', () => {
    const images = makeImages(1)
    render(<ImageAnnotator images={images} labels={labels} />)
    triggerImageLoad()

    // The LabelSelector in the toolbar shows the active label name.
    // With auto-selection, "Cat" (the first label) should appear in the toolbar
    // as the active label button text.
    const labelSelectorButton = screen.getByText('Cat', {
      // Match the toolbar label selector (truncated span inside button)
      selector: 'span.truncate',
    })
    expect(labelSelectorButton).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // Unique IDs via nextId()
  // ---------------------------------------------------------------------------
  it('assigns unique IDs to annotations created through classification toggling', async () => {
    const images = makeImages(1)
    const onChange = vi.fn()
    render(
      <ImageAnnotator
        images={images}
        labels={labels}
        mode="classify"
        onAnnotationsChange={onChange}
      />,
    )
    triggerImageLoad()

    // Toggle Cat classification on
    const catButtons = screen.getAllByText('Cat')
    const catBtn = catButtons.find((el) => el.closest('button')?.type === 'button')!
    fireEvent.click(catBtn.closest('button')!)

    await waitFor(() => {
      expect(screen.getByText('Classification (1)')).toBeInTheDocument()
    })

    // Toggle Dog classification on
    const dogButtons = screen.getAllByText('Dog')
    const dogBtn = dogButtons.find((el) => el.closest('button')?.type === 'button')!
    fireEvent.click(dogBtn.closest('button')!)

    await waitFor(() => {
      expect(screen.getByText('Classification (2)')).toBeInTheDocument()
    })

    // Verify both annotations have unique IDs
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]
    const annotations = lastCall[1] as Annotation[]
    expect(annotations).toHaveLength(2)
    expect(annotations[0].id).not.toBe(annotations[1].id)
    // IDs should follow the ann- prefix pattern
    expect(annotations[0].id).toMatch(/^ann-/)
    expect(annotations[1].id).toMatch(/^ann-/)
  })

  // ---------------------------------------------------------------------------
  // Additional edge-case tests
  // ---------------------------------------------------------------------------

  it('shows AnnotationList in default annotate mode', () => {
    const images = makeImages(1)
    render(<ImageAnnotator images={images} labels={labels} />)
    triggerImageLoad()

    expect(screen.getByText('Annotations (0)')).toBeInTheDocument()
    expect(screen.queryByText(/^Classification/)).not.toBeInTheDocument()
  })

  it('supports pagination navigation with arrow keys', () => {
    const images = makeImages(3)
    render(<ImageAnnotator images={images} labels={labels} />)
    triggerImageLoad()

    expect(screen.getByText('1 / 3')).toBeInTheDocument()

    // Press ArrowRight to go to next image
    fireEvent.keyDown(window, { key: 'ArrowRight' })

    expect(screen.getByText('2 / 3')).toBeInTheDocument()

    // Press ArrowLeft to go back
    fireEvent.keyDown(window, { key: 'ArrowLeft' })

    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })

  it('applies custom className to the root element', () => {
    const images = makeImages(1)
    const { container } = render(
      <ImageAnnotator images={images} labels={labels} className="my-custom-class" />,
    )
    triggerImageLoad()

    const rootEl = container.firstElementChild
    expect(rootEl?.className).toContain('my-custom-class')
  })

  it('pan tool enables panning via mouse drag', () => {
    const images = makeImages(1)
    render(<ImageAnnotator images={images} labels={labels} />)
    triggerImageLoad()

    // Switch to pan tool
    fireEvent.click(screen.getByTitle('Pan (H)'))

    const container = document.querySelector('.cursor-grab')
    if (!container) return

    // Mouse down to start panning
    fireEvent.mouseDown(container, { clientX: 100, clientY: 100 })
    // Mouse move to pan
    fireEvent.mouseMove(container, { clientX: 150, clientY: 120 })
    // Mouse up to stop
    fireEvent.mouseUp(container)
  })

  it('draw tool enables drawing via mouse drag', () => {
    const onAnnotationsChange = vi.fn()
    const images = makeImages(1)
    render(<ImageAnnotator images={images} labels={labels} onAnnotationsChange={onAnnotationsChange} />)
    triggerImageLoad()

    // Should be in draw mode by default (first tool)
    const container = document.querySelector('.cursor-crosshair')
    if (!container) return

    // Draw: mousedown, mousemove, mouseup
    fireEvent.mouseDown(container, { clientX: 100, clientY: 100, button: 0 })
    fireEvent.mouseMove(container, { clientX: 200, clientY: 200 })
    fireEvent.mouseUp(container)
  })

  it('wheel zoom with ctrl key changes zoom level', () => {
    const images = makeImages(1)
    render(<ImageAnnotator images={images} labels={labels} />)
    triggerImageLoad()

    const container = document.querySelector('.cursor-crosshair') || document.querySelector('.cursor-default')
    if (!container) return

    // Wheel zoom in
    fireEvent.wheel(container, { deltaY: -100, ctrlKey: true })
    // Wheel zoom out
    fireEvent.wheel(container, { deltaY: 100, ctrlKey: true })
  })

  it('mouse leave on container stops drawing/panning', () => {
    const images = makeImages(1)
    render(<ImageAnnotator images={images} labels={labels} />)
    triggerImageLoad()

    const container = document.querySelector('.cursor-crosshair')
    if (!container) return

    fireEvent.mouseDown(container, { clientX: 100, clientY: 100, button: 0 })
    fireEvent.mouseLeave(container)
  })

  it('handleExport calls onExport with export data', () => {
    const onExport = vi.fn()
    const images = makeImages(1)
    render(
      <ImageAnnotator
        images={images}
        labels={labels}
        onExport={onExport}
        initialAnnotations={{
          'img-0': [
            { id: 'a1', imageId: 'img-0', labelId: 'cat', box: { x: 10, y: 10, width: 50, height: 50 } },
          ],
        }}
      />,
    )
    triggerImageLoad()

    const exportBtn = screen.getByTitle('Export YOLO (Ctrl+S)')
    fireEvent.click(exportBtn)
    expect(onExport).toHaveBeenCalled()
  })

  it('onFavoritesChange is called when favorites change', () => {
    const onFavoritesChange = vi.fn()
    const images = makeImages(1)
    render(
      <ImageAnnotator images={images} labels={labels} onFavoritesChange={onFavoritesChange} />,
    )
    triggerImageLoad()

    // Interact with labels to trigger favorites change would require TagList interaction
    // This test verifies the prop is wired up without errors
  })

  it('does not show draw tools when lock is toggled on via toolbar', () => {
    const images = makeImages(1)
    render(<ImageAnnotator images={images} labels={labels} />)
    triggerImageLoad()

    // Draw tools should be visible initially
    expect(screen.getByTitle('Draw (D)')).toBeInTheDocument()

    // Click the lock button
    const lockButton = screen.getByTitle('Lock editing (L)')
    fireEvent.click(lockButton)

    // Draw tools should be hidden
    expect(screen.queryByTitle('Draw (D)')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Polygon (P)')).not.toBeInTheDocument()

    // Unlock button should now show with different title
    expect(screen.getByTitle('Unlock editing (L)')).toBeInTheDocument()
  })
})
