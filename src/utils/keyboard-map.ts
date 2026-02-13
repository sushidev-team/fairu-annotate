import type { KeyboardShortcutMap } from '../types/events'

export const DEFAULT_SHORTCUTS: Required<KeyboardShortcutMap> = {
  'tool.draw': 'd',
  'tool.select': 'v',
  'tool.polygon': 'p',
  'tool.pan': 'h',
  'annotation.delete': 'Delete',
  'history.undo': 'ctrl+z',
  'history.redo': 'ctrl+shift+z',
  'image.next': 'ArrowRight',
  'image.prev': 'ArrowLeft',
  'zoom.in': 'ctrl+=',
  'zoom.out': 'ctrl+-',
  'label.quick': '1-9',
  'export': 'ctrl+s',
  'view.lock': 'l',
  'image.confirm': 'Enter',
}

export function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.toLowerCase().split('+')
  const key = parts[parts.length - 1]
  const needCtrl = parts.includes('ctrl')
  const needShift = parts.includes('shift')
  const needAlt = parts.includes('alt')
  const needMeta = parts.includes('meta')

  const ctrlOrMeta = e.ctrlKey || e.metaKey

  if (needCtrl && !ctrlOrMeta) return false
  if (needShift && !e.shiftKey) return false
  if (needAlt && !e.altKey) return false
  if (needMeta && !e.metaKey) return false
  if (!needCtrl && ctrlOrMeta && key !== 'ctrl' && key !== 'meta') return false
  if (!needShift && e.shiftKey && key !== 'shift') return false

  return e.key.toLowerCase() === key || e.code.toLowerCase() === `key${key}`
}
