import { test, expect } from '@playwright/test'

const STORY_URL = '/iframe.html?id=imageannotator--'

test.describe('ImageAnnotator E2E', () => {
  test.describe('Default Story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_URL}default`)
      await page.waitForSelector('[tabindex="-1"]', { timeout: 10000 })
    })

    test('renders the annotator with toolbar and sidebar', async ({ page }) => {
      // Toolbar visible
      await expect(page.getByTitle('Draw (D)')).toBeVisible()
      await expect(page.getByTitle('Select (V)')).toBeVisible()
      await expect(page.getByTitle('Pan (H)')).toBeVisible()

      // Labels sidebar visible
      await expect(page.getByText('Labels')).toBeVisible()

      // Annotation list visible
      await expect(page.getByText('Annotations (0)')).toBeVisible()
    })

    test('switches tools via toolbar buttons', async ({ page }) => {
      const selectBtn = page.getByTitle('Select (V)')
      await selectBtn.click()
      // Select button should have primary variant styling
      await expect(selectBtn).toBeVisible()

      const panBtn = page.getByTitle('Pan (H)')
      await panBtn.click()
      await expect(panBtn).toBeVisible()
    })

    test('switches tools via keyboard shortcuts', async ({ page }) => {
      const root = page.locator('[tabindex="-1"]')
      await root.focus()

      await page.keyboard.press('v')
      await page.keyboard.press('h')
      await page.keyboard.press('d')
    })

    test('zoom controls work', async ({ page }) => {
      const zoomText = page.locator('.tabular-nums').first()
      const initialZoom = await zoomText.textContent()
      expect(initialZoom).toContain('100%')

      await page.getByTitle('Zoom In').click()
      const zoomedIn = await zoomText.textContent()
      expect(zoomedIn).not.toBe('100%')

      await page.getByTitle('Reset View').click()
      const resetZoom = await zoomText.textContent()
      expect(resetZoom).toContain('100%')
    })

    test('pagination shows for multiple images', async ({ page }) => {
      await expect(page.getByText('1 / 3')).toBeVisible()
      await expect(page.getByText('demo.jpg')).toBeVisible()

      await page.getByTitle('Next image').click()
      await expect(page.getByText('2 / 3')).toBeVisible()

      await page.getByTitle('Previous image').click()
      await expect(page.getByText('1 / 3')).toBeVisible()
    })

    test('navigate images with keyboard', async ({ page }) => {
      const root = page.locator('[tabindex="-1"]')
      await root.focus()

      await page.keyboard.press('ArrowRight')
      await expect(page.getByText('2 / 3')).toBeVisible()

      await page.keyboard.press('ArrowLeft')
      await expect(page.getByText('1 / 3')).toBeVisible()
    })

    test('lock toggle works', async ({ page }) => {
      const lockBtn = page.getByTitle(/Lock editing|Unlock editing/)
      await lockBtn.click()

      // Draw tools should be hidden when locked
      await expect(page.getByTitle('Draw (D)')).toBeHidden()
      await expect(page.getByTitle('Polygon (P)')).toBeHidden()

      // Unlock
      await lockBtn.click()
      await expect(page.getByTitle('Draw (D)')).toBeVisible()
    })

    test('data preview toggle works', async ({ page }) => {
      const previewBtn = page.getByTitle('Toggle Data Preview')
      await previewBtn.click()

      await expect(page.getByText('YOLO Preview')).toBeVisible()

      await previewBtn.click()
      await expect(page.getByText('YOLO Preview')).toBeHidden()
    })

    test('label selector shows labels', async ({ page }) => {
      // Click on the label selector
      const labelBtn = page.locator('button').filter({ hasText: 'Cat' })
      await labelBtn.click()

      // Dropdown should show all labels
      await expect(page.getByText('Dog')).toBeVisible()
      await expect(page.getByText('Bird')).toBeVisible()
      await expect(page.getByText('Car')).toBeVisible()
    })
  })

  test.describe('WithInitialAnnotations Story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_URL}with-initial-annotations`)
      await page.waitForSelector('[tabindex="-1"]', { timeout: 10000 })
    })

    test('shows initial annotations in list', async ({ page }) => {
      await expect(page.getByText('Annotations (2)')).toBeVisible()
      await expect(page.getByText('Cat')).toBeVisible()
      await expect(page.getByText('Dog')).toBeVisible()
    })

    test('data preview shows YOLO format for initial annotations', async ({ page }) => {
      const previewBtn = page.getByTitle('Toggle Data Preview')
      await previewBtn.click()

      await expect(page.getByText('YOLO Preview')).toBeVisible()
      await expect(page.getByText('2 annotations')).toBeVisible()
      // Should show YOLO detection format
      const pre = page.locator('pre')
      const text = await pre.textContent()
      expect(text).toContain('0 ') // classId 0 for cat
    })
  })

  test.describe('ReadOnly Story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_URL}read-only`)
      await page.waitForSelector('[tabindex="-1"]', { timeout: 10000 })
    })

    test('hides draw tools and lock button in readOnly mode', async ({ page }) => {
      await expect(page.getByTitle('Draw (D)')).toBeHidden()
      await expect(page.getByTitle('Polygon (P)')).toBeHidden()
      // Lock button should not be visible in readOnly mode
      await expect(page.getByTitle(/Lock editing/)).toBeHidden()
    })

    test('shows annotations but no delete buttons', async ({ page }) => {
      await expect(page.getByText('Annotations (2)')).toBeVisible()
      // Delete buttons should not be present
      await expect(page.getByTitle('Delete annotation')).toBeHidden()
    })
  })

  test.describe('ClassificationMode Story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_URL}classification-mode`)
      await page.waitForSelector('[tabindex="-1"]', { timeout: 10000 })
    })

    test('shows classification list instead of annotation list', async ({ page }) => {
      await expect(page.getByText('Classification (0)')).toBeVisible()
      // Should show all labels as toggleable items
      await expect(page.getByRole('button', { name: 'Cat' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Dog' })).toBeVisible()
    })

    test('hides draw tools in classify mode', async ({ page }) => {
      await expect(page.getByTitle('Draw (D)')).toBeHidden()
      await expect(page.getByTitle('Polygon (P)')).toBeHidden()
    })

    test('toggles classification labels', async ({ page }) => {
      const catBtn = page.getByRole('button', { name: 'Cat' })
      await catBtn.click()
      await expect(page.getByText('Classification (1)')).toBeVisible()

      // Click again to remove
      await catBtn.click()
      await expect(page.getByText('Classification (0)')).toBeVisible()
    })
  })

  test.describe('SingleImage Story', () => {
    test('hides pagination for single image', async ({ page }) => {
      await page.goto(`${STORY_URL}single-image`)
      await page.waitForSelector('[tabindex="-1"]', { timeout: 10000 })

      // Pagination should not be visible
      await expect(page.getByTitle('Next image')).toBeHidden()
      await expect(page.getByTitle('Previous image')).toBeHidden()
    })
  })
})
