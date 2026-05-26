import type { ReactNode } from 'react'
import { useEffect } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

interface LayoutProps {
  children: ReactNode
  showNav?: boolean
  showFooter?: boolean
}

export default function Layout({
  children,
  showNav = true,
  showFooter = true,
}: LayoutProps) {
  // Initialize smooth scroll
  useEffect(() => {
    let lenis: any = null

    async function initLenis() {
      const Lenis = (await import('lenis')).default
      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        touchMultiplier: 2,
      })

      function raf(time: number) {
        lenis.raf(time)
        requestAnimationFrame(raf)
      }
      requestAnimationFrame(raf)
    }

    initLenis()

    return () => {
      if (lenis) lenis.destroy()
    }
  }, [])

  return (
    <div className="min-h-[100dvh] flex flex-col bg-black">
      {showNav && <Navbar />}
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
    </div>
  )
}
