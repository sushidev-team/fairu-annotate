import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  active?: boolean
}

export function Button({
  variant = 'default',
  size = 'md',
  active,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none'

  const variants: Record<string, string> = {
    default:
      'bg-white ring-1 ring-inset ring-zinc-300 text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-zinc-700 dark:active:bg-zinc-600',
    primary:
      'bg-blue-600 text-white shadow-sm hover:bg-blue-500 active:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 dark:active:bg-blue-600',
    ghost:
      'text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:active:bg-zinc-700',
    danger:
      'bg-red-600 text-white shadow-sm hover:bg-red-500 active:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400 dark:active:bg-red-600',
  }

  const sizes: Record<string, string> = {
    sm: 'px-2.5 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
  }

  const activeClass = active
    ? 'bg-blue-50 ring-1 ring-inset ring-blue-400 text-blue-700 dark:bg-blue-900/50 dark:ring-blue-500 dark:text-blue-300'
    : ''

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${activeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
