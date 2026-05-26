import { useRef, useEffect, type ReactNode } from 'react'
import { motion } from 'framer-motion'

/**
 * Neon Flow background effect.
 * Two overlapping radial-gradient layers that track mouse position
 * via CSS custom properties, creating a reactive neon atmosphere.
 */
export default function NeonFlow({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      el.style.setProperty('--mouse-x', `${x}%`)
      el.style.setProperty('--mouse-y', `${y}%`)
    }

    el.addEventListener('mousemove', handleMouseMove)
    return () => el.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: 'easeOut' }}
      className="relative min-h-[100dvh] w-full overflow-hidden"
      style={{
        background: '#000000',
      }}
    >
      {/* Subtle radial overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255, 0, 153, 0.03), transparent 70%)',
        }}
      />

      {/* Pink gradient layer */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 0, 153, 0.08), transparent 60%)',
        }}
      />

      {/* Cyan gradient layer */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(500px circle at calc(100% - var(--mouse-x, 50%)) var(--mouse-y, 50%), rgba(0, 204, 255, 0.06), transparent 60%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-[100dvh] items-center justify-center px-6">
        {children}
      </div>
    </motion.div>
  )
}
