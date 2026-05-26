import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STEPS = [
  {
    emoji: '👋',
    title: "Welcome to Get Posted AI",
    body: "You're about to set up your AI content studio. Everything you tell us gets remembered — so the more you share, the better your content becomes.",
  },
  {
    emoji: '🧠',
    title: "We learn your business",
    body: "Answer a few quick questions — your industry, what you sell, your vibe. We use this to research your competitors, find your keywords, and build content ideas specific to YOUR niche.",
  },
  {
    emoji: '🎬',
    title: "Then we create together",
    body: "In the Studio, you answer questions and we generate your content — videos, images, captions, blogs. The more detail you give us, the more your content looks like it was made by a professional agency.",
  },
  {
    emoji: '✨',
    title: "Personal touches matter",
    body: "You can build your own AI presenter — pick their look, voice, style. Add your logo, your brand colours, your products. This is YOUR studio. Let's make it look like you.",
  },
  {
    emoji: '🚀',
    title: "Ready? Let's go.",
    body: "We'll walk you through everything. Nothing is permanent — you can update your profile any time. Your data stays yours, always.",
  },
]

const TOUR_KEY = 'gp_welcome_tour_done'

export default function WelcomeTour() {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY)
    if (!done) {
      setTimeout(() => setVisible(true), 600)
    }
  }, [])

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      handleDismiss()
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(TOUR_KEY, 'true')
    setVisible(false)
  }

  if (!visible) return null

  const current = STEPS[step]

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            style={{
              position: 'fixed', inset: 0, zIndex: 9998,
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            }}
          />

          {/* Tour card */}
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)',
              zIndex: 9999, width: 'calc(100% - 48px)', maxWidth: 400,
              background: '#0d0d0d',
              border: '1px solid rgba(255,0,153,0.3)',
              borderRadius: 20, padding: '28px 24px',
              boxShadow: '0 0 60px rgba(255,0,153,0.15), 0 20px 60px rgba(0,0,0,0.6)',
            }}
          >
            {/* Step dots */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, justifyContent: 'center' }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  width: i === step ? 20 : 6, height: 6, borderRadius: 3,
                  background: i <= step ? '#ff0099' : 'rgba(255,255,255,0.12)',
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>

            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 14 }}>{current.emoji}</div>

            <h3 style={{
              color: '#fff', fontSize: 20, fontFamily: 'Bangers, cursive',
              letterSpacing: 2, textAlign: 'center', margin: '0 0 10px',
            }}>{current.title}</h3>

            <p style={{
              color: '#888', fontSize: 14, lineHeight: 1.7,
              textAlign: 'center', margin: '0 0 24px',
            }}>{current.body}</p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleDismiss}
                style={{
                  flex: 1, background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: '11px', color: '#555', fontSize: 13,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}>
                Skip intro
              </button>
              <motion.button onClick={handleNext}
                whileTap={{ scale: 0.97 }}
                style={{
                  flex: 2,
                  background: 'linear-gradient(90deg, #ff0099, #00ccff)',
                  border: 'none', borderRadius: 10, padding: '11px',
                  color: '#000', fontSize: 15, fontFamily: 'Bangers, cursive',
                  letterSpacing: 2, cursor: 'pointer',
                }}>
                {step === STEPS.length - 1 ? "LET'S GO →" : 'NEXT →'}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
