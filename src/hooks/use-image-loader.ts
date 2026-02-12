import { useEffect, useRef, useState } from 'react'

interface LoadedImage {
  element: HTMLImageElement
  naturalWidth: number
  naturalHeight: number
}

const imageCache = new Map<string, LoadedImage>()

export function useImageLoader(src: string | undefined) {
  const [image, setImage] = useState<LoadedImage | null>(src ? imageCache.get(src) ?? null : null)
  const [loading, setLoading] = useState(!image && !!src)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!src) {
      setImage(null)
      setLoading(false)
      return
    }

    const cached = imageCache.get(src)
    if (cached) {
      setImage(cached)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const loaded: LoadedImage = {
        element: img,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      }
      imageCache.set(src, loaded)
      setImage(loaded)
      setLoading(false)
    }

    img.onerror = () => {
      setError(`Failed to load image: ${src}`)
      setLoading(false)
    }

    img.src = src
  }, [src])

  return { image, loading, error }
}
