import React from 'react'

interface IconProps {
  className?: string
}

const defaultProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function IconPencil({ className }: IconProps) {
  return (
    <svg {...defaultProps} className={className}>
      <path d="M16.474 5.408l2.118 2.118m-.756-3.982L12.109 9.27a2.118 2.118 0 00-.58 1.082L11 13l2.648-.53a2.118 2.118 0 001.082-.58l5.727-5.727a1.853 1.853 0 10-2.621-2.621z" />
      <path d="M19 15v3a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h3" />
    </svg>
  )
}

export function IconCursor({ className }: IconProps) {
  return (
    <svg {...defaultProps} className={className}>
      <path d="M5 3l14 7-6.5 1.5L11 18z" />
      <path d="M11 18l1.5-6.5" />
    </svg>
  )
}

export function IconHand({ className }: IconProps) {
  return (
    <svg {...defaultProps} className={className}>
      <path d="M18 11V6a2 2 0 00-4 0" />
      <path d="M14 10V4.5a2 2 0 00-4 0V10" />
      <path d="M10 9.5V6a2 2 0 00-4 0v7" />
      <path d="M18 11a2 2 0 014 0v3a8 8 0 01-8 8h-2c-3.5 0-5.5-2-7.5-5l-.5-.8a1.7 1.7 0 012.4-2.3L8 16V7" />
    </svg>
  )
}

export function IconZoomIn({ className }: IconProps) {
  return (
    <svg {...defaultProps} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
    </svg>
  )
}

export function IconZoomOut({ className }: IconProps) {
  return (
    <svg {...defaultProps} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35M8 11h6" />
    </svg>
  )
}

export function IconReset({ className }: IconProps) {
  return (
    <svg {...defaultProps} className={className}>
      <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}

export function IconChevronLeft({ className }: IconProps) {
  return (
    <svg {...defaultProps} className={className}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

export function IconChevronRight({ className }: IconProps) {
  return (
    <svg {...defaultProps} className={className}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

export function IconTrash({ className }: IconProps) {
  return (
    <svg {...defaultProps} className={className}>
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      <path d="M19 6l-.867 12.142A2 2 0 0116.138 20H7.862a2 2 0 01-1.995-1.858L5 6" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  )
}

export function IconPlus({ className }: IconProps) {
  return (
    <svg {...defaultProps} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconClose({ className }: IconProps) {
  return (
    <svg {...defaultProps} className={className}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

export function IconDownload({ className }: IconProps) {
  return (
    <svg {...defaultProps} className={className}>
      <path d="M12 3v12M8 11l4 4 4-4" />
      <path d="M20 21H4" />
    </svg>
  )
}

export function IconSearch({ className }: IconProps) {
  return (
    <svg {...defaultProps} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

export function IconPolygon({ className }: IconProps) {
  return (
    <svg {...defaultProps} className={className}>
      <path d="M12 2l8.5 6.5L17.5 19h-11L3.5 8.5z" />
    </svg>
  )
}

export function IconBoundingBox({ className }: IconProps) {
  return (
    <svg {...defaultProps} className={className}>
      <path d="M3 7V5a2 2 0 012-2h2" />
      <path d="M17 3h2a2 2 0 012 2v2" />
      <path d="M21 17v2a2 2 0 01-2 2h-2" />
      <path d="M7 21H5a2 2 0 01-2-2v-2" />
    </svg>
  )
}

export function IconLock({ className }: IconProps) {
  return (
    <svg {...defaultProps} className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}

export function IconUnlock({ className }: IconProps) {
  return (
    <svg {...defaultProps} className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 019.9-1" />
    </svg>
  )
}

export function IconChevronDown({ className }: IconProps) {
  return (
    <svg {...defaultProps} className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function IconCode({ className }: IconProps) {
  return (
    <svg {...defaultProps} className={className}>
      <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
    </svg>
  )
}

export function IconCopy({ className }: IconProps) {
  return (
    <svg {...defaultProps} className={className}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}

export function IconStar({ className }: IconProps) {
  return (
    <svg {...defaultProps} className={className}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01z" />
    </svg>
  )
}

export function IconStarFilled({ className }: IconProps) {
  return (
    <svg {...defaultProps} fill="currentColor" className={className}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01z" />
    </svg>
  )
}
