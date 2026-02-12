import React from 'react'

interface BadgeProps {
  color: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Badge({ color, children, className = '', onClick }: BadgeProps) {
  const Component = onClick ? 'button' : 'span'
  return (
    <Component
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset dark:ring-opacity-60 ${className}`}
      style={{
        backgroundColor: `${color}15`,
        color,
        '--tw-ring-color': `${color}40`,
      } as React.CSSProperties}
      onClick={onClick}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {children}
    </Component>
  )
}
