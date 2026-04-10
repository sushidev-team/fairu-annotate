# Keyboard Shortcuts

`@fairu/annotate` comes with a comprehensive set of keyboard shortcuts. All shortcuts can be customized.

## Default Shortcuts

| Action              | Key                  | Shortcut ID          |
| ------------------- | -------------------- | -------------------- |
| Draw tool           | `D`                  | `tool.draw`          |
| Select tool         | `V`                  | `tool.select`        |
| Polygon tool        | `P`                  | `tool.polygon`       |
| Pan tool            | `H`                  | `tool.pan`           |
| Delete annotation   | `Delete` / `Backspace` | `annotation.delete` |
| Undo                | `Ctrl+Z`             | `history.undo`       |
| Redo                | `Ctrl+Shift+Z`       | `history.redo`       |
| Next image          | `ArrowRight`         | `image.next`         |
| Previous image      | `ArrowLeft`          | `image.prev`         |
| Confirm / Next      | `Enter`              | `image.confirm`      |
| Zoom in             | `Ctrl+=`             | `zoom.in`            |
| Zoom out            | `Ctrl+-`             | `zoom.out`           |
| Quick label 1–9     | `1` – `9`            | `label.quick`        |
| Export              | `Ctrl+S`             | `export`             |
| Lock / Unlock       | `L`                  | `view.lock`          |

## Customizing Shortcuts

Pass a `keyboardShortcuts` object to override any default:

```tsx
<ImageAnnotator
  images={images}
  labels={labels}
  keyboardShortcuts={{
    'tool.draw': 'b',            // Brush-like shortcut
    'tool.select': 's',
    'annotation.delete': 'x',
    'history.undo': 'ctrl+z',
    'history.redo': 'ctrl+y',    // Use Ctrl+Y instead of Ctrl+Shift+Z
  }}
/>
```

Only the shortcuts you specify are overridden — all others keep their defaults.

## Key Format

Keys follow a simple format:

- Single keys: `d`, `v`, `p`, `1`, `delete`, `backspace`, `enter`, `escape`
- Modifier combos: `ctrl+z`, `ctrl+shift+z`, `ctrl+=`, `ctrl+-`
- Arrow keys: `arrowleft`, `arrowright`, `arrowup`, `arrowdown`

All key names are lowercase.

## Quick Labels

The number keys `1`–`9` select the corresponding favorite label. Favorites are displayed at the top of the label selector. The first favorite maps to `1`, the second to `2`, and so on.

To pre-set favorites:

```tsx
<ImageAnnotator
  images={images}
  labels={labels}
  initialFavorites={['person', 'car', 'bicycle']}
  // 1 = person, 2 = car, 3 = bicycle
/>
```

## Classification Key Bindings

In classification mode (`mode="classify"`), you can bind specific keys to labels:

```tsx
<ImageAnnotator
  images={images}
  labels={labels}
  mode="classify"
  labelKeyBindings={{
    'cat': 'q',
    'dog': 'w',
    'bird': 'e',
    'fish': 'r',
  }}
/>
```

Pressing the bound key toggles the label on/off for the current image.
