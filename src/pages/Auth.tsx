import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number]

function NeonSpinner({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: 'spin 0.8s linear infinite' }}>
      <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round"/>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </svg>
  )
}

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function Auth() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    if (!email.trim() || !validateEmail(email)) { setError('Please enter a valid email address.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: 'https://getpostedai.com/auth' }
        })
        if (signUpError) throw signUpError
        if (data.user && !data.session) {
          // Email confirmation required
          setSuccessMsg('Check your email — click the confirmation link to activate your account.')
          setLoading(false)
          return
        }
        if (data.session) {
          // Auto-confirmed (email confirmations off)
          navigate('/onboarding')
          return
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (signInError) throw signInError
        if (data.session) {
          // Check if onboarding done
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_done')
            .eq('id', data.session.user.id)
            .single()
          navigate(profile?.onboarding_done ? '/studio' : '/onboarding')
          return
        }
      }
    } catch (err: any) {
      const msg = err?.message || 'Something went wrong. Please try again.'
      if (msg.includes('Invalid login')) setError('Incorrect email or password.')
      else if (msg.includes('already registered')) setError('Account already exists — sign in instead.')
      else if (msg.includes('Email not confirmed')) setError('Please check your email and confirm your account first.')
      else setError(msg)
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://getpostedai.com/auth' }
    })
  }

  const handleDemo = () => {
    localStorage.setItem('gp_demo_mode', 'true')
    localStorage.setItem('gp_onboarding_done', 'true')
    navigate('/studio')
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#000',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px 20px',
      fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden',
    }}>

      {/* Background glow blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,0,153,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,204,255,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}>

        {/* ── HERO LOGO ── */}
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease }}
          style={{ textAlign: 'center', marginBottom: 36 }}
        >
          <h1 style={{
            fontFamily: 'Bangers, cursive',
            fontSize: 'clamp(48px, 14vw, 80px)',
            letterSpacing: '0.08em', lineHeight: 1,
            background: 'linear-gradient(90deg, #ff0099, #00ccff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            margin: 0, textTransform: 'uppercase',
          }}>GET POSTED</h1>
          <h1 style={{
            fontFamily: 'Bangers, cursive',
            fontSize: 'clamp(48px, 14vw, 80px)',
            letterSpacing: '0.08em', lineHeight: 1,
            background: 'linear-gradient(90deg, #00ccff, #ff0099)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            margin: '0 0 12px', textTransform: 'uppercase',
          }}>AI ✦</h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ color: '#555', fontSize: 14, letterSpacing: 2, textTransform: 'uppercase', margin: 0 }}>
            AI-Powered Content Studio
          </motion.p>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5, duration: 0.6, ease }}
            style={{ height: 2, marginTop: 16, borderRadius: 2, background: 'linear-gradient(90deg, transparent, #ff0099, #00ccff, transparent)' }} />
        </motion.div>

        {/* ── CARD ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease }}
          style={{
            background: 'rgba(10,10,10,0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20, padding: '32px 28px',
            boxShadow: '0 0 60px rgba(255,0,153,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
            {['Sign In', 'Create Account'].map((tab, i) => (
              <button key={tab} onClick={() => { setIsSignUp(i === 1); setError(''); setSuccessMsg('') }}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontFamily: 'Bangers, cursive', fontSize: 15, letterSpacing: 1,
                  background: (i === 1) === isSignUp ? 'linear-gradient(90deg,#ff0099,#00ccff)' : 'transparent',
                  color: (i === 1) === isSignUp ? '#000' : '#555', transition: 'all 0.2s',
                }}>{tab}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Email</label>
              <input type="email" value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="you@yourbusiness.com"
                style={{
                  width: '100%', background: '#111',
                  border: `1px solid ${error ? '#ff3366' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 10, padding: '13px 16px', color: '#fff', fontSize: 15,
                  outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#ff0099'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,0,153,0.12)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>

            <div style={{ marginBottom: 8, position: 'relative' }}>
              <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="6+ characters"
                  style={{
                    width: '100%', background: '#111',
                    border: `1px solid ${error ? '#ff3366' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 10, padding: '13px 48px 13px 16px', color: '#fff', fontSize: 15,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#ff0099'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,0,153,0.12)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ color: '#ff3366', fontSize: 13, margin: '8px 0 12px', textAlign: 'center' }}>
                  {error}
                </motion.p>
              )}
              {successMsg && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ color: '#00ff88', fontSize: 13, margin: '8px 0 12px', textAlign: 'center', lineHeight: 1.5 }}>
                  ✅ {successMsg}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button type="submit" disabled={loading} whileTap={loading ? {} : { scale: 0.97 }}
              style={{
                width: '100%', marginTop: 16,
                background: 'linear-gradient(90deg, #ff0099, #00ccff)',
                color: '#000', fontFamily: 'Bangers, cursive', fontSize: 20,
                letterSpacing: 3, padding: '14px', borderRadius: 12,
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 0 30px rgba(255,0,153,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: loading ? 0.8 : 1,
              }}>
              {loading ? <><NeonSpinner size={18}/>{isSignUp ? 'CREATING...' : 'SIGNING IN...'}</> : (isSignUp ? 'CREATE MY ACCOUNT →' : 'SIGN IN →')}
            </motion.button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }}/>
            <span style={{ margin: '0 14px', color: '#444', fontSize: 12 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }}/>
          </div>

          <button onClick={handleGoogle}
            style={{
              width: '100%', background: '#fff', color: '#000',
              borderRadius: 10, padding: '13px 16px', fontSize: 14, fontWeight: 600,
              border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
            <GoogleIcon size={18}/>
            Continue with Google
          </button>

          <p style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: '#333', lineHeight: 1.6 }}>
            By continuing you agree to our{' '}
            <a href="/legal/terms" style={{ color: '#555' }}>Terms</a>{' & '}
            <a href="/legal/privacy" style={{ color: '#555' }}>Privacy Policy</a>
          </p>
        </motion.div>

        {/* Demo button */}
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          onClick={handleDemo}
          style={{
            width: '100%', marginTop: 14, background: 'transparent',
            color: '#00ccff', fontFamily: 'Bangers, cursive', fontSize: 16,
            letterSpacing: 2, padding: '13px', borderRadius: 12,
            border: '1px solid rgba(0,204,255,0.3)', cursor: 'pointer',
          }}>
          ✨ EXPLORE THE DEMO — NO SIGN IN NEEDED
        </motion.button>

        {/* Footer links */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          style={{ marginTop: 24, textAlign: 'center', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px 16px' }}>
          {[
            { label: 'About Us', href: '/about' },
            { label: 'FAQ', href: '/faq' },
            { label: 'Privacy', href: '/legal/privacy' },
            { label: 'Terms', href: '/legal/terms' },
            { label: 'White Paper', href: '/whitepaper' },
          ].map(link => (
            <a key={link.label} href={link.href}
              style={{ color: '#333', fontSize: 11, textDecoration: 'none', letterSpacing: 0.5 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#888')}
              onMouseLeave={e => (e.currentTarget.style.color = '#333')}
            >{link.label}</a>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
