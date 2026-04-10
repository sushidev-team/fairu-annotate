# Tag Management

Labels (tags) can be managed dynamically at runtime. This is useful when your label set is stored in a backend and users should be able to create, search, or delete labels from within the annotator.

## Static Labels

The simplest setup is passing a fixed list:

```tsx
const labels = [
  { id: 'cat', name: 'Cat', color: '#FF6B6B', classId: 0 },
  { id: 'dog', name: 'Dog', color: '#4ECDC4', classId: 1 },
]

<ImageAnnotator images={images} labels={labels} />
```

## Dynamic Label Search

For large label sets, provide an `onTagSearch` callback. The tag manager will call it when the user types in the search field:

```tsx
<ImageAnnotator
  images={images}
  labels={labels}
  onTagSearch={async ({ query, page, limit }) => {
    const res = await fetch(
      `/api/labels?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    )
    const data = await res.json()

    return {
      labels: data.items,   // Label[]
      total: data.total,     // total number of matches
      hasMore: data.hasMore, // whether more pages exist
    }
  }}
/>
```

The `TagSearchParams` type:

```ts
interface TagSearchParams {
  query: string  // search text entered by the user
  page: number   // current page (for pagination)
  limit: number  // items per page
}
```

The expected return type:

```ts
interface TagSearchResult {
  labels: Label[]
  total: number
  hasMore: boolean
}
```

## Creating Labels

Allow users to create new labels on the fly:

```tsx
<ImageAnnotator
  images={images}
  labels={labels}
  onTagCreate={async (name, color) => {
    const res = await fetch('/api/labels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    })
    // Must return the full Label object (with id and classId from the server)
    return await res.json()
  }}
/>
```

The callback receives:
- `name` — the label name the user entered
- `color` — an optional hex color (e.g. `#FF6B6B`)

It must return a `Label`:

```ts
interface Label {
  id: string
  name: string
  color: string
  classId: number
}
```

## Deleting Labels

```tsx
<ImageAnnotator
  images={images}
  labels={labels}
  onTagDelete={async (id) => {
    await fetch(`/api/labels/${id}`, { method: 'DELETE' })
  }}
/>
```

## Updating Labels

```tsx
<ImageAnnotator
  images={images}
  labels={labels}
  onTagUpdate={async (id, updates) => {
    const res = await fetch(`/api/labels/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    return await res.json()
  }}
/>
```

`updates` is a partial object with optional `name` and/or `color` fields.

## Full Example

```tsx
<ImageAnnotator
  images={images}
  labels={labels}
  onTagSearch={async ({ query, page, limit }) => {
    const res = await fetch(`/api/labels?q=${query}&page=${page}&limit=${limit}`)
    return res.json()
  }}
  onTagCreate={async (name, color) => {
    const res = await fetch('/api/labels', {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    })
    return res.json()
  }}
  onTagDelete={async (id) => {
    await fetch(`/api/labels/${id}`, { method: 'DELETE' })
  }}
  onTagUpdate={async (id, updates) => {
    const res = await fetch(`/api/labels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
    return res.json()
  }}
/>
```

## Favorites

Users can pin up to 9 labels as favorites for quick access via the `1`–`9` keys. You can pre-set favorites and track changes:

```tsx
<ImageAnnotator
  images={images}
  labels={labels}
  initialFavorites={['cat', 'dog']}
  onFavoritesChange={(favoriteIds) => {
    // favoriteIds is an array of label IDs in display order
    localStorage.setItem('favorites', JSON.stringify(favoriteIds))
  }}
/>
```

Favorites appear at the top of the label selector and can be reordered via drag-and-drop.
