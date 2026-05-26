import type { ReactNode } from 'react'

export default function GradientText({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={className}
      style={{
        background: 'linear-gradient(90deg, #ff0099, #00ccff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {children}
    </span>
  )
}
