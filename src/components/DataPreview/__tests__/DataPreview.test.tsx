import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DataPreview } from '../DataPreview'
import type { Annotation } from '../../../types/annotations'
import type { Label } from '../../../types/labels'

const labels: Label[] = [
  { id: 'label-1', name: 'Car', color: '#ff0000', classId: 0 },
  { id: 'label-2', name: 'Person', color: '#00ff00', classId: 1 },
]

const boxAnnotations: Annotation[] = [
  {
    id: 'ann-1',
    imageId: 'img-1',
    labelId: 'label-1',
    type: 'box',
    box: { x: 50, y: 50, width: 100, height: 100 },
  },
  {
    id: 'ann-2',
    imageId: 'img-1',
    labelId: 'label-2',
    type: 'box',
    box: { x: 200, y: 100, width: 50, height: 80 },
  },
]

const classificationAnnotations: Annotation[] = [
  {
    id: 'ann-cls-1',
    imageId: 'img-1',
    labelId: 'label-1',
    type: 'classification',
    box: { x: 0, y: 0, width: 0, height: 0 },
  },
]

const imageWidth = 640
const imageHeight = 480

describe('DataPreview', () => {
  it('shows "YOLO Preview" header', () => {
    render(
      <DataPreview
        annotations={boxAnnotations}
        labels={labels}
        yoloFormat="detection"
        imageWidth={imageWidth}
        imageHeight={imageHeight}
      />,
    )
    expect(screen.getByText('YOLO Preview')).toBeInTheDocument()
  })

  it('shows format label for Detection', () => {
    render(
      <DataPreview
        annotations={boxAnnotations}
        labels={labels}
        yoloFormat="detection"
        imageWidth={imageWidth}
        imageHeight={imageHeight}
      />,
    )
    expect(screen.getByText('Detection')).toBeInTheDocument()
  })

  it('shows format label for Segmentation', () => {
    render(
      <DataPreview
        annotations={[]}
        labels={labels}
        yoloFormat="segmentation"
        imageWidth={imageWidth}
        imageHeight={imageHeight}
      />,
    )
    expect(screen.getByText('Segmentation')).toBeInTheDocument()
  })

  it('shows format label for OBB', () => {
    render(
      <DataPreview
        annotations={[]}
        labels={labels}
        yoloFormat="obb"
        imageWidth={imageWidth}
        imageHeight={imageHeight}
      />,
    )
    expect(screen.getByText('OBB')).toBeInTheDocument()
  })

  it('shows format label for Auto', () => {
    render(
      <DataPreview
        annotations={[]}
        labels={labels}
        yoloFormat="auto"
        imageWidth={imageWidth}
        imageHeight={imageHeight}
      />,
    )
    expect(screen.getByText('Auto')).toBeInTheDocument()
  })

  it('shows format label for Classification in classify mode', () => {
    render(
      <DataPreview
        annotations={classificationAnnotations}
        labels={labels}
        yoloFormat="detection"
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        mode="classify"
      />,
    )
    expect(screen.getByText('Classification')).toBeInTheDocument()
  })

  it('shows annotation count', () => {
    render(
      <DataPreview
        annotations={boxAnnotations}
        labels={labels}
        yoloFormat="detection"
        imageWidth={imageWidth}
        imageHeight={imageHeight}
      />,
    )
    expect(screen.getByText('2 annotations')).toBeInTheDocument()
  })

  it('shows singular annotation count', () => {
    render(
      <DataPreview
        annotations={[boxAnnotations[0]]}
        labels={labels}
        yoloFormat="detection"
        imageWidth={imageWidth}
        imageHeight={imageHeight}
      />,
    )
    expect(screen.getByText('1 annotation')).toBeInTheDocument()
  })

  it('shows "No annotations" when empty', () => {
    render(
      <DataPreview
        annotations={[]}
        labels={labels}
        yoloFormat="detection"
        imageWidth={imageWidth}
        imageHeight={imageHeight}
      />,
    )
    expect(screen.getByText(/No annotations/)).toBeInTheDocument()
  })

  it('shows YOLO text in a <pre> element', () => {
    render(
      <DataPreview
        annotations={boxAnnotations}
        labels={labels}
        yoloFormat="detection"
        imageWidth={imageWidth}
        imageHeight={imageHeight}
      />,
    )
    const pre = screen.getByText(/^0 /).closest('pre')
    expect(pre).toBeInTheDocument()
  })

  it('copy button calls navigator.clipboard.writeText', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: { writeText },
    })

    render(
      <DataPreview
        annotations={boxAnnotations}
        labels={labels}
        yoloFormat="detection"
        imageWidth={imageWidth}
        imageHeight={imageHeight}
      />,
    )

    const copyButton = screen.getByTitle('Copy to clipboard')
    fireEvent.click(copyButton)
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('0 '))
  })

  it('copy button is disabled when there are no annotations', () => {
    render(
      <DataPreview
        annotations={[]}
        labels={labels}
        yoloFormat="detection"
        imageWidth={imageWidth}
        imageHeight={imageHeight}
      />,
    )
    const copyButton = screen.getByTitle('Copy to clipboard')
    expect(copyButton).toBeDisabled()
  })

  it('classification mode shows only classification annotations', () => {
    const mixed = [...boxAnnotations, ...classificationAnnotations]
    render(
      <DataPreview
        annotations={mixed}
        labels={labels}
        yoloFormat="detection"
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        mode="classify"
      />,
    )
    // In classify mode, only classification annotations are shown
    expect(screen.getByText('1 label')).toBeInTheDocument()
  })

  it('classification mode shows "No labels" when no classification annotations', () => {
    render(
      <DataPreview
        annotations={boxAnnotations}
        labels={labels}
        yoloFormat="detection"
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        mode="classify"
      />,
    )
    expect(screen.getByText(/No labels/)).toBeInTheDocument()
  })

  it('annotate mode filters out classification annotations', () => {
    const mixed = [...boxAnnotations, ...classificationAnnotations]
    render(
      <DataPreview
        annotations={mixed}
        labels={labels}
        yoloFormat="detection"
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        mode="annotate"
      />,
    )
    expect(screen.getByText('2 annotations')).toBeInTheDocument()
  })

  it('handles clipboard writeText rejection gracefully', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard unavailable'))
    Object.assign(navigator, {
      clipboard: { writeText },
    })

    render(
      <DataPreview
        annotations={boxAnnotations}
        labels={labels}
        yoloFormat="detection"
        imageWidth={imageWidth}
        imageHeight={imageHeight}
      />,
    )

    const copyButton = screen.getByTitle('Copy to clipboard')
    // Should not throw even though clipboard rejects
    fireEvent.click(copyButton)
    expect(writeText).toHaveBeenCalledTimes(1)

    // Wait for the rejected promise to settle without throwing
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
})
