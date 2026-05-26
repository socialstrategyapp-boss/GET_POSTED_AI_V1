import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useSupabase'
import { isDemoMode } from '@/hooks/useSupabase'
import type { ReactNode } from 'react'

interface AuthGuardProps {
  children: ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user && !isDemoMode()) {
      navigate('/auth')
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-black">
        <div className="relative w-12 h-12">
          <div
            className="w-12 h-12 rounded-full"
            style={{
              border: '2px solid transparent',
              borderTopColor: '#ff0099',
              borderRightColor: '#00ccff',
              animation: 'spin 1s linear infinite, glow-pulse 2s ease-in-out infinite',
              boxShadow: '0 0 15px rgba(255, 0, 153, 0.3)',
            }}
          />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            @keyframes glow-pulse {
              0%, 100% { box-shadow: 0 0 15px rgba(255, 0, 153, 0.2); }
              50% { box-shadow: 0 0 25px rgba(255, 0, 153, 0.5), 0 0 35px rgba(0, 204, 255, 0.3); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  if (!user && !isDemoMode()) {
    return null
  }

  return <>{children}</>
}
