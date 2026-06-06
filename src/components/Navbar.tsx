import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Settings, User, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/useSupabase'
import { isDemoMode } from '@/hooks/useSupabase'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (path: string) => location.pathname === path

  const showNav = user || isDemoMode()

  const navLinks = showNav
    ? [
        { label: 'Studio', path: '/studio' },
        { label: 'Gallery', path: '/gallery' },
        { label: 'Audit', path: '/audit' },
        { label: 'Brand', path: '/profile' },
      ]
    : []

  const handleSignOut = async () => {
    await signOut()
    setDropdownOpen(false)
  }

  // Get user initials for avatar
  const getInitials = () => {
    if (isDemoMode()) return 'DU'
    const email = user?.email || ''
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center transition-all duration-300"
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: scrolled ? '0 0 20px rgba(255, 0, 153, 0.05)' : 'none',
      }}
    >
      <div className="w-full max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between">
        {/* Left: Wordmark */}
        <Link
          to={showNav ? '/studio' : '/'}
          className="font-bangers text-xl gradient-text tracking-wider"
        >
          GET POSTED AI
        </Link>

        {/* Center: Nav links (authenticated only) */}
        {showNav && (
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative text-sm font-medium transition-colors duration-200 ${
                  isActive(link.path)
                    ? 'text-[#ff0099]'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-[#ff0099]"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Right: Auth controls */}
        <div className="flex items-center gap-4">
          {showNav ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black"
                  style={{
                    background: 'linear-gradient(135deg, #ff0099, #00ccff)',
                  }}
                >
                  {getInitials()}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[#888888] transition-transform duration-200 ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 z-50 w-48 rounded-lg py-2"
                      style={{
                        background: '#0a0a0a',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#cccccc] hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#cccccc] hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <div className="my-1.5 border-t border-white/5" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#ff3366] hover:bg-white/5 transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/auth" className="btn-primary text-sm py-2 px-5">
              Get Started
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
