import { describe, it, expect } from 'vitest'
import { DEFAULT_SHORTCUTS, matchesShortcut } from '../keyboard-map'

function mockKeyEvent(overrides: Partial<KeyboardEvent>): KeyboardEvent {
  return { key: '', code: '', ctrlKey: false, shiftKey: false, altKey: false, metaKey: false, ...overrides } as KeyboardEvent
}

describe('DEFAULT_SHORTCUTS', () => {
  it('contains all expected shortcut keys', () => {
    const expectedKeys = [
      'tool.draw',
      'tool.select',
      'tool.polygon',
      'tool.pan',
      'annotation.delete',
      'history.undo',
      'history.redo',
      'image.next',
      'image.prev',
      'zoom.in',
      'zoom.out',
      'label.quick',
      'export',
      'view.lock',
      'image.confirm',
    ]
    for (const key of expectedKeys) {
      expect(DEFAULT_SHORTCUTS).toHaveProperty(key)
    }
  })

  it('has correct shortcut values for tool keys', () => {
    expect(DEFAULT_SHORTCUTS['tool.draw']).toBe('d')
    expect(DEFAULT_SHORTCUTS['tool.select']).toBe('v')
    expect(DEFAULT_SHORTCUTS['tool.polygon']).toBe('p')
    expect(DEFAULT_SHORTCUTS['tool.pan']).toBe('h')
  })

  it('has correct shortcut values for actions', () => {
    expect(DEFAULT_SHORTCUTS['annotation.delete']).toBe('Delete')
    expect(DEFAULT_SHORTCUTS['history.undo']).toBe('ctrl+z')
    expect(DEFAULT_SHORTCUTS['history.redo']).toBe('ctrl+shift+z')
    expect(DEFAULT_SHORTCUTS['image.next']).toBe('ArrowRight')
    expect(DEFAULT_SHORTCUTS['image.prev']).toBe('ArrowLeft')
    expect(DEFAULT_SHORTCUTS['zoom.in']).toBe('ctrl+=')
    expect(DEFAULT_SHORTCUTS['zoom.out']).toBe('ctrl+-')
    expect(DEFAULT_SHORTCUTS['export']).toBe('ctrl+s')
    expect(DEFAULT_SHORTCUTS['view.lock']).toBe('l')
    expect(DEFAULT_SHORTCUTS['image.confirm']).toBe('Enter')
  })
})

describe('matchesShortcut', () => {
  describe('simple key matching', () => {
    it('matches single letter key "d"', () => {
      const e = mockKeyEvent({ key: 'd' })
      expect(matchesShortcut(e, 'd')).toBe(true)
    })

    it('matches single letter key "v"', () => {
      const e = mockKeyEvent({ key: 'v' })
      expect(matchesShortcut(e, 'v')).toBe(true)
    })

    it('matches single letter key "p"', () => {
      const e = mockKeyEvent({ key: 'p' })
      expect(matchesShortcut(e, 'p')).toBe(true)
    })

    it('matches single letter key "h"', () => {
      const e = mockKeyEvent({ key: 'h' })
      expect(matchesShortcut(e, 'h')).toBe(true)
    })

    it('matches "Delete" key', () => {
      const e = mockKeyEvent({ key: 'Delete' })
      expect(matchesShortcut(e, 'Delete')).toBe(true)
    })

    it('matches "Enter" key', () => {
      const e = mockKeyEvent({ key: 'Enter' })
      expect(matchesShortcut(e, 'Enter')).toBe(true)
    })

    it('matches "ArrowRight" key', () => {
      const e = mockKeyEvent({ key: 'ArrowRight' })
      expect(matchesShortcut(e, 'ArrowRight')).toBe(true)
    })

    it('matches "ArrowLeft" key', () => {
      const e = mockKeyEvent({ key: 'ArrowLeft' })
      expect(matchesShortcut(e, 'ArrowLeft')).toBe(true)
    })

    it('does not match a different key', () => {
      const e = mockKeyEvent({ key: 'x' })
      expect(matchesShortcut(e, 'd')).toBe(false)
    })
  })

  describe('case insensitive matching', () => {
    it('matches uppercase key against lowercase shortcut', () => {
      const e = mockKeyEvent({ key: 'D' })
      expect(matchesShortcut(e, 'd')).toBe(true)
    })

    it('matches lowercase key against uppercase shortcut', () => {
      const e = mockKeyEvent({ key: 'd' })
      expect(matchesShortcut(e, 'D')).toBe(true)
    })

    it('matches mixed case "Delete" vs "delete"', () => {
      const e = mockKeyEvent({ key: 'Delete' })
      expect(matchesShortcut(e, 'delete')).toBe(true)
    })

    it('matches "arrowright" case insensitively', () => {
      const e = mockKeyEvent({ key: 'ArrowRight' })
      expect(matchesShortcut(e, 'arrowright')).toBe(true)
    })
  })

  describe('e.code fallback matching', () => {
    it('matches code "KeyD" for shortcut "d"', () => {
      const e = mockKeyEvent({ key: '', code: 'KeyD' })
      expect(matchesShortcut(e, 'd')).toBe(true)
    })

    it('matches code "KeyV" for shortcut "v"', () => {
      const e = mockKeyEvent({ key: '', code: 'KeyV' })
      expect(matchesShortcut(e, 'v')).toBe(true)
    })

    it('matches code "KeyP" for shortcut "p"', () => {
      const e = mockKeyEvent({ key: '', code: 'KeyP' })
      expect(matchesShortcut(e, 'p')).toBe(true)
    })

    it('does not match code "KeyX" for shortcut "d"', () => {
      const e = mockKeyEvent({ key: '', code: 'KeyX' })
      expect(matchesShortcut(e, 'd')).toBe(false)
    })

    it('prefers key match over code match', () => {
      const e = mockKeyEvent({ key: 'd', code: 'KeyX' })
      expect(matchesShortcut(e, 'd')).toBe(true)
    })
  })

  describe('modifier combinations', () => {
    it('matches ctrl+z with ctrlKey pressed', () => {
      const e = mockKeyEvent({ key: 'z', ctrlKey: true })
      expect(matchesShortcut(e, 'ctrl+z')).toBe(true)
    })

    it('matches ctrl+z with metaKey pressed (ctrl maps to metaKey)', () => {
      const e = mockKeyEvent({ key: 'z', metaKey: true })
      expect(matchesShortcut(e, 'ctrl+z')).toBe(true)
    })

    it('matches ctrl+shift+z with ctrlKey and shiftKey pressed', () => {
      const e = mockKeyEvent({ key: 'z', ctrlKey: true, shiftKey: true })
      expect(matchesShortcut(e, 'ctrl+shift+z')).toBe(true)
    })

    it('matches ctrl+shift+z with metaKey and shiftKey pressed', () => {
      const e = mockKeyEvent({ key: 'z', metaKey: true, shiftKey: true })
      expect(matchesShortcut(e, 'ctrl+shift+z')).toBe(true)
    })

    it('matches ctrl+s with ctrlKey pressed', () => {
      const e = mockKeyEvent({ key: 's', ctrlKey: true })
      expect(matchesShortcut(e, 'ctrl+s')).toBe(true)
    })

    it('matches ctrl+= with ctrlKey pressed', () => {
      const e = mockKeyEvent({ key: '=', ctrlKey: true })
      expect(matchesShortcut(e, 'ctrl+=')).toBe(true)
    })

    it('matches ctrl+- with ctrlKey pressed', () => {
      const e = mockKeyEvent({ key: '-', ctrlKey: true })
      expect(matchesShortcut(e, 'ctrl+-')).toBe(true)
    })
  })

  describe('rejects when wrong modifier is present', () => {
    it('rejects simple key when ctrlKey is pressed', () => {
      const e = mockKeyEvent({ key: 'd', ctrlKey: true })
      expect(matchesShortcut(e, 'd')).toBe(false)
    })

    it('rejects simple key when metaKey is pressed', () => {
      const e = mockKeyEvent({ key: 'd', metaKey: true })
      expect(matchesShortcut(e, 'd')).toBe(false)
    })

    it('rejects simple key when shiftKey is pressed', () => {
      const e = mockKeyEvent({ key: 'd', shiftKey: true })
      expect(matchesShortcut(e, 'd')).toBe(false)
    })

    it('rejects ctrl+z when shiftKey is also pressed', () => {
      const e = mockKeyEvent({ key: 'z', ctrlKey: true, shiftKey: true })
      expect(matchesShortcut(e, 'ctrl+z')).toBe(false)
    })

    it('rejects ctrl+z when no ctrl or meta key is pressed', () => {
      const e = mockKeyEvent({ key: 'z' })
      expect(matchesShortcut(e, 'ctrl+z')).toBe(false)
    })
  })

  describe('rejects when required modifier is missing', () => {
    it('rejects ctrl+z without any modifier', () => {
      const e = mockKeyEvent({ key: 'z' })
      expect(matchesShortcut(e, 'ctrl+z')).toBe(false)
    })

    it('rejects ctrl+shift+z without shiftKey', () => {
      const e = mockKeyEvent({ key: 'z', ctrlKey: true })
      expect(matchesShortcut(e, 'ctrl+shift+z')).toBe(false)
    })

    it('rejects ctrl+shift+z without ctrlKey or metaKey', () => {
      const e = mockKeyEvent({ key: 'z', shiftKey: true })
      expect(matchesShortcut(e, 'ctrl+shift+z')).toBe(false)
    })

    it('rejects shortcut requiring alt when altKey is not pressed', () => {
      const e = mockKeyEvent({ key: 'a' })
      expect(matchesShortcut(e, 'alt+a')).toBe(false)
    })

    it('rejects shortcut requiring meta when metaKey is not pressed', () => {
      const e = mockKeyEvent({ key: 'a' })
      expect(matchesShortcut(e, 'meta+a')).toBe(false)
    })
  })

  describe('alt modifier', () => {
    it('matches alt+a with altKey pressed', () => {
      const e = mockKeyEvent({ key: 'a', altKey: true })
      expect(matchesShortcut(e, 'alt+a')).toBe(true)
    })

    it('rejects alt+a without altKey', () => {
      const e = mockKeyEvent({ key: 'a' })
      expect(matchesShortcut(e, 'alt+a')).toBe(false)
    })
  })

  describe('meta modifier', () => {
    it('rejects meta+a because metaKey triggers the ctrlOrMeta guard', () => {
      // meta+a: needMeta = true, needCtrl = false
      // metaKey = true => ctrlOrMeta = true
      // !needCtrl && ctrlOrMeta && key !== 'ctrl' && key !== 'meta' => returns false
      const e = mockKeyEvent({ key: 'a', metaKey: true })
      expect(matchesShortcut(e, 'meta+a')).toBe(false)
    })

    it('matches meta+a when both ctrl and meta modifiers are specified', () => {
      // ctrl+meta+a: needCtrl = true, needMeta = true
      const e = mockKeyEvent({ key: 'a', metaKey: true })
      expect(matchesShortcut(e, 'ctrl+meta+a')).toBe(true)
    })

    it('rejects meta+a without metaKey', () => {
      const e = mockKeyEvent({ key: 'a' })
      expect(matchesShortcut(e, 'meta+a')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('handles all modifiers required at once', () => {
      const e = mockKeyEvent({ key: 'a', ctrlKey: true, shiftKey: true, altKey: true, metaKey: true })
      expect(matchesShortcut(e, 'ctrl+shift+alt+meta+a')).toBe(true)
    })

    it('rejects when all modifiers required but one is missing', () => {
      const e = mockKeyEvent({ key: 'a', ctrlKey: true, shiftKey: true, metaKey: true })
      expect(matchesShortcut(e, 'ctrl+shift+alt+meta+a')).toBe(false)
    })

    it('handles no modifiers and no match', () => {
      const e = mockKeyEvent({ key: 'a' })
      expect(matchesShortcut(e, 'b')).toBe(false)
    })

    it('allows ctrlKey when key itself is "ctrl"', () => {
      // shortcut 'ctrl': key = 'ctrl', needCtrl = false
      // ctrlKey = true => ctrlOrMeta = true
      // guard: !needCtrl && ctrlOrMeta && key !== 'ctrl' => skipped because key === 'ctrl'
      // e.key.toLowerCase() === 'ctrl' => matches
      const e = mockKeyEvent({ key: 'ctrl', ctrlKey: true })
      expect(matchesShortcut(e, 'ctrl')).toBe(true)
    })

    it('does not match "Control" key against "ctrl" shortcut', () => {
      // key.toLowerCase() = 'control' !== 'ctrl', code fallback also fails
      const e = mockKeyEvent({ key: 'Control', ctrlKey: true })
      expect(matchesShortcut(e, 'ctrl')).toBe(false)
    })

    it('allows metaKey when key itself is "meta"', () => {
      const e = mockKeyEvent({ key: 'meta', metaKey: true })
      // needCtrl = false, ctrlOrMeta = true, key === 'meta' so the ctrlOrMeta guard is skipped
      expect(matchesShortcut(e, 'meta')).toBe(true)
    })

    it('allows shiftKey when key itself is "shift"', () => {
      const e = mockKeyEvent({ key: 'shift', shiftKey: true })
      // needShift = false, shiftKey = true, key === 'shift' so the shift guard is skipped
      expect(matchesShortcut(e, 'shift')).toBe(true)
    })

    it('matches code fallback with modifier combination', () => {
      const e = mockKeyEvent({ key: '', code: 'KeyZ', ctrlKey: true })
      expect(matchesShortcut(e, 'ctrl+z')).toBe(true)
    })

    it('rejects code fallback when modifier is wrong', () => {
      const e = mockKeyEvent({ key: '', code: 'KeyZ', ctrlKey: true, shiftKey: true })
      expect(matchesShortcut(e, 'ctrl+z')).toBe(false)
    })

    it('handles empty key and empty code', () => {
      const e = mockKeyEvent({ key: '', code: '' })
      expect(matchesShortcut(e, 'd')).toBe(false)
    })
  })
})
