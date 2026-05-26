import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { INDUSTRIES } from '../data/industries'

const BRAND_VOICES = [
  { label: 'Professional', emoji: '💼' },
  { label: 'Casual & Friendly', emoji: '😊' },
  { label: 'Playful & Fun', emoji: '🎉' },
  { label: 'Luxury & Premium', emoji: '✨' },
  { label: 'Bold & Edgy', emoji: '💥' },
  { label: 'Warm & Personal', emoji: '🤝' },
]

const CONTENT_PREFS = [
  { label: 'Video', emoji: '🎬' },
  { label: 'Images', emoji: '📸' },
  { label: 'Both', emoji: '🚀' },
]

const SELLS = [
  { label: 'Products', emoji: '📦' },
  { label: 'Services', emoji: '🛠️' },
  { label: 'Both', emoji: '🔁' },
  { label: 'Digital / Info', emoji: '💡' },
]

const AUDIENCES = [
  { label: 'Consumers (B2C)', emoji: '🧑' },
  { label: 'Businesses (B2B)', emoji: '🏢' },
  { label: 'Both', emoji: '🔁' },
  { label: 'Local community', emoji: '📍' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({
    businessName: '',
    website: '',
    sells: '',
    audience: '',
    industry: '',
    industryCode: '',
    brandVoice: '',
    contentPref: '',
  })
  const [inputVal, setInputVal] = useState('')
  const [done, setDone] = useState(false)
  const [scanStarted, setScanStarted] = useState(false)
  const scanRef = useRef(false)

  // Silent classification fires as soon as we have businessName + website (step 2 done)
  useEffect(() => {
    if (answers.businessName && answers.website && !scanRef.current) {
      scanRef.current = true
      setScanStarted(true)
      // Fire silent pre-scan in background — don't await, don't block UI
      fetch('/api/pre-classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: answers.businessName,
          website: answers.website,
        }),
      }).then(r => r.json()).then(data => {
        if (data.suggestedIndustryCodes) {
          localStorage.setItem('gp_pre_classify', JSON.stringify(data))
        }
      }).catch(() => {})
    }
  }, [answers.businessName, answers.website])

  const steps = [
    {
      key: 'businessName',
      question: "What's your business or brand name?",
      hint: "This is how we'll refer to you everywhere.",
      type: 'text',
      placeholder: 'e.g. The Plant Collective',
      required: true,
    },
    {
      key: 'website',
      question: 'Do you have a website?',
      hint: "Drop it in — we'll scan it and start learning your business right now.",
      type: 'text',
      placeholder: 'https://yourbusiness.com.au (optional)',
      required: false,
    },
    {
      key: 'sells',
      question: 'What does your business sell?',
      hint: 'This helps us understand what kind of content will work best for you.',
      type: 'chips',
      options: SELLS.map(v => `${v.emoji} ${v.label}`),
    },
    {
      key: 'audience',
      question: 'Who do you sell to?',
      hint: 'Your audience shapes everything — platform, tone, content style.',
      type: 'chips',
      options: AUDIENCES.map(a => `${a.emoji} ${a.label}`),
    },
    {
      key: 'industry',
      question: 'What industry are you in?',
      hint: 'Pick the closest fit — we use this to make everything niche-specific.',
      type: 'industry',
    },
    {
      key: 'brandVoice',
      question: "What's your brand voice?",
      hint: 'How do you want to sound?',
      type: 'chips',
      options: BRAND_VOICES.map(v => `${v.emoji} ${v.label}`),
    },
    {
      key: 'contentPref',
      question: 'What type of content do you want to create?',
      hint: 'You can always change this later.',
      type: 'chips',
      options: CONTENT_PREFS.map(c => `${c.emoji} ${c.label}`),
    },
  ]

  const current = steps[step]

  const handleNext = (val?: string, extra?: { industryCode?: string }) => {
    const value = val ?? inputVal
    if (current.required && !value.trim()) return
    const newAnswers = {
      ...answers,
      [current.key]: value,
      ...(extra?.industryCode ? { industryCode: extra.industryCode } : {}),
    }
    setAnswers(newAnswers)
    setInputVal('')
    if (step < steps.length - 1) {
      setStep(s => s + 1)
    } else {
      handleFinish(newAnswers)
    }
  }

  const handleFinish = async (finalAnswers: typeof answers) => {
    localStorage.setItem('gp_onboarding', JSON.stringify(finalAnswers))
    localStorage.setItem('gp_onboarding_done', 'true')
    setDone(true)
    // Persist onboarding_done to Supabase if user is logged in
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(
        'https://lpmpcprejxmgeuxdhlsj.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwbXBjcHJlanhtZ2V1eGRobHNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTgwMzgsImV4cCI6MjA5NTI5NDAzOH0.MVN8MZ1gQObLRrslzUqth6nyoUNx9_-U6nYHwhOZxDw'
      )
      const { data: { user } } = await sb.auth.getUser()
      if (user) {
        await sb.from('profiles').upsert({
          id: user.id,
          email: user.email,
          business_name: finalAnswers.businessName,
          website: finalAnswers.website,
          industry: finalAnswers.industry,
          industry_code: finalAnswers.industryCode,
          sells: finalAnswers.sells,
          audience: finalAnswers.audience,
          brand_voice: finalAnswers.brandVoice,
          content_pref: finalAnswers.contentPref,
          onboarding_done: true,
        }, { onConflict: 'id' })
      }
    } catch { /* silent — localStorage fallback */ }
    setTimeout(() => {
      confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 }, colors: ['#ff0099', '#00ccff', '#ffffff', '#a78bfa'] })
      confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ff0099', '#00ccff'] })
      confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ff0099', '#00ccff'] })
    }, 100)
    setTimeout(() => navigate('/profile-setup'), 3200)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#000',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'Inter, sans-serif',
    }}>
      {/* Logo */}
      <motion.h1
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          fontFamily: 'Bangers, cursive', fontSize: 32, letterSpacing: 4,
          background: 'linear-gradient(90deg, #ff0099, #00ccff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 40, textAlign: 'center',
        }}
      >
        GET POSTED AI
      </motion.h1>

      {/* Progress dots */}
      {!done && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 24 : 8, height: 8, borderRadius: 4,
              background: i <= step ? '#ff0099' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
      )}

      {/* Silent scan indicator */}
      {scanStarted && !done && step >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: 16, padding: '8px 16px',
            background: 'rgba(0,204,255,0.06)', border: '1px solid rgba(0,204,255,0.15)',
            borderRadius: 20, display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            style={{ fontSize: 12 }}
          >🔍</motion.span>
          <span style={{ color: '#00ccff', fontSize: 12 }}>
            Scanning {answers.businessName} — learning your business…
          </span>
        </motion.div>
      )}

      {/* Question card */}
      <div style={{ width: '100%', maxWidth: 500 }}>
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>
                {current.question}
              </h2>
              <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>{current.hint}</p>

              {/* Text input */}
              {current.type === 'text' && (
                <div>
                  <input
                    autoFocus
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleNext()}
                    placeholder={(current as any).placeholder}
                    style={{
                      width: '100%', background: '#111', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 12, padding: '14px 16px', color: '#fff', fontSize: 16,
                      outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#ff0099'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                  <motion.button
                    onClick={() => handleNext()}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      marginTop: 16, width: '100%',
                      background: 'linear-gradient(90deg, #ff0099, #00ccff)',
                      color: '#000', fontFamily: 'Bangers, cursive', fontSize: 18,
                      letterSpacing: 2, padding: '14px', borderRadius: 12,
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    {step === 0 ? "LET'S GO →" : 'NEXT →'}
                  </motion.button>
                  {!(current as any).required && (
                    <button onClick={() => handleNext('')}
                      style={{ marginTop: 12, width: '100%', background: 'none', border: 'none', color: '#555', fontSize: 13, cursor: 'pointer' }}>
                      Skip for now
                    </button>
                  )}
                </div>
              )}

              {/* Chip selection */}
              {current.type === 'chips' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {(current as any).options!.map((opt: string) => (
                    <motion.button
                      key={opt}
                      onClick={() => handleNext(opt)}
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.03 }}
                      style={{
                        background: answers[current.key as keyof typeof answers] === opt
                          ? 'linear-gradient(90deg, #ff0099, #00ccff)'
                          : 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 24, padding: '10px 18px',
                        color: '#fff', fontSize: 14, cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {opt}
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Industry picker — 50 top-level only */}
              {current.type === 'industry' && (
                <IndustryPicker
                  onSelect={(name, code) => handleNext(name, { industryCode: code })}
                  preClassify={JSON.parse(localStorage.getItem('gp_pre_classify') || 'null')}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
              <h2 style={{
                fontFamily: 'Bangers, cursive', fontSize: 36, letterSpacing: 3,
                background: 'linear-gradient(90deg, #ff0099, #00ccff)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                YOU'RE IN!
              </h2>
              <p style={{ color: '#888', marginTop: 12, fontSize: 15 }}>
                Setting up your workspace ✨
              </p>
              <motion.div
                style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 6 }}
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              >
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff0099' }} />
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Industry Picker ────────────────────────────────────────────────────────────
// Shows 50 top-level industries. If pre-classification has suggestions, surfaces
// those 3–4 at the top highlighted. Sub-industries are never shown.
function IndustryPicker({
  onSelect,
  preClassify,
}: {
  onSelect: (name: string, code: string) => void
  preClassify: { suggestedIndustryCodes?: string[] } | null
}) {
  const suggested = preClassify?.suggestedIndustryCodes || []

  // Split: suggested first (highlighted), then rest
  const suggestedIndustries = INDUSTRIES.filter(ind => suggested.includes(ind.code))
  const otherIndustries = INDUSTRIES.filter(ind => !suggested.includes(ind.code))

  return (
    <div>
      {suggestedIndustries.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: '#00ccff', fontSize: 12, marginBottom: 10, letterSpacing: 1 }}>
            ✦ LOOKS LIKE YOU MIGHT BE IN…
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {suggestedIndustries.map(ind => (
              <motion.button
                key={ind.code}
                onClick={() => onSelect(ind.name, ind.code)}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: 'linear-gradient(90deg, rgba(255,0,153,0.2), rgba(0,204,255,0.2))',
                  border: '1px solid rgba(255,0,153,0.5)',
                  borderRadius: 24, padding: '10px 18px',
                  color: '#fff', fontSize: 14, cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span>{ind.emoji}</span> {ind.name}
              </motion.button>
            ))}
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '16px 0' }} />
          <p style={{ color: '#555', fontSize: 12, marginBottom: 10 }}>OR CHOOSE A DIFFERENT ONE:</p>
        </div>
      )}

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        maxHeight: 380, overflowY: 'auto', paddingRight: 4,
      }}>
        {otherIndustries.map(ind => (
          <motion.button
            key={ind.code}
            onClick={() => onSelect(ind.name, ind.code)}
            whileTap={{ scale: 0.95 }}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '10px 14px',
              color: '#fff', fontSize: 13, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,0,153,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          >
            <span style={{ fontSize: 16 }}>{ind.emoji}</span>
            <span style={{ lineHeight: 1.3 }}>{ind.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
