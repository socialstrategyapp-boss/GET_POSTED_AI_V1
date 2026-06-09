import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router'
import WelcomeTour from '@/components/WelcomeTour'
import MediaCreator from '@/components/studio/MediaCreator'
import { supabase } from '@/lib/supabase'
import { startTopup, openBillingPortal } from '@/hooks/useCheckout'

// ── Billboard idea cards shown on the studio walls ──────────────────────────
const BILLBOARD_IDEAS = [
  { emoji: '💰', title: 'Get PAID on TikTok', desc: 'Make a 65-second video — over 1 min = TikTok Creator Fund eligible. You get paid for views.', tag: 'TRENDING' },
  { emoji: '🎬', title: '30-Second Info Video', desc: 'Quick facts about your business, product, or service. Fast. Punchy. High saves.', tag: 'FAST' },
  { emoji: '🏪', title: 'Walk-Through Tour', desc: "Take your audience inside your business. Show them around. People love seeing the real place.", tag: 'POPULAR' },
  { emoji: '📦', title: 'Product Showcase', desc: 'Cinematic close-ups of your best products. Let them do the talking. High conversion.', tag: 'CONVERTS' },
  { emoji: '✋', title: 'The Hand Model', desc: 'Hands + product only. No face needed. Incredibly satisfying to watch. Used by Apple & Aesop.', tag: 'VIRAL' },
  { emoji: '📝', title: 'Blog Post', desc: 'One great blog drives Google traffic to your business for 12 months. Set and forget SEO.', tag: 'SEO' },
  { emoji: '🌅', title: 'Before & After', desc: 'Most viral video format ever. Works for any business. Problem → solution. Emotional arc.', tag: 'VIRAL' },
  { emoji: '🎭', title: 'Faceless Tutorial', desc: 'Overhead or POV shots with voiceover. No face needed. High trust. High saves.', tag: 'EASY' },
  { emoji: '📅', title: 'Full Month Content', desc: 'Plan a whole month in one session. Every platform. Every day. Just press schedule.', tag: 'SMART' },
  { emoji: '🤖', title: 'Build Your AI Presenter', desc: 'Create once. Use in every video forever. Same face. Your brand. Always consistent.', tag: 'NEW' },
]

// ── Content creation question flow ──────────────────────────────────────────
const PLATFORMS = ['🎵 TikTok', '📸 Instagram', '▶️ YouTube Shorts', '📘 Facebook', '💼 LinkedIn', '𝕏 Twitter/X', '📱 All Platforms']
const VIDEO_STYLES = [
  '🎬 Cinematic Product Showcase — close-up, high production',
  '✋ Hands Only — product + hands, no face needed',
  '👤 AI Presenter — your virtual spokesperson',
  '🌅 Before & After — most viral format on social',
  '📹 Faceless Tutorial — overhead or POV, voiceover only',
  '🤳 UGC Style — raw, real, filmed on a phone',
  '🗣️ Talking Head — speak to camera with B-roll cuts',
  '📖 Mini Documentary — your story, your brand',
  '🔥 Trend Adaptation — ride what\'s viral right now',
  '🌿 Lifestyle & Atmosphere — mood-first, product second',
]
const VISUAL_FEELS = ['🎬 Cinematic & Moody', '☀️ Bright & Airy', '🌅 Warm & Golden Hour', '🖤 Dark & Premium', '🌿 Natural & Organic', '⚡ Bold & High Energy']
const MUSIC_OPTS = ['🔥 Trending Audio (TikTok/Reels)', '😊 Upbeat & Feel-Good', '🌊 Calm & Minimal', '⚡ High Energy / Hype', '🌸 Soft & Emotional', '🎹 Clean Instrumental', '❌ No Music']
const PRESENTER_GENDERS = ['👩 Female presenter', '👨 Male presenter', '🧑 Non-binary / androgynous']
const PRESENTER_AGES = ['18–25 — young adult', '26–35 — young professional', '36–50 — experienced', '50+ — senior expert']
const PRESENTER_STYLES = ['💼 Corporate / Professional', '😊 Casual & Friendly', '🔥 Edgy & Cool', '🌿 Natural & Earthy', '✨ Glamorous & Polished', '🏄 Active & Sporty']
const PRESENTER_HAIR = ['Short hair', 'Medium length hair', 'Long hair', 'Curly hair', 'Afro / natural', 'Bald / shaved', 'Ponytail / tied up']
const PRESENTER_ACCESSORIES = ['None', 'Sunglasses', 'Hat / cap', 'Jewellery', 'Headphones', 'Laptop / tablet', 'Coffee cup', 'Surfboard', 'Bicycle', 'Gym gear', 'Professional bag']
const PRESENTER_BACKGROUNDS = ['Plain white studio', 'Office / workspace', 'Outdoor / nature', 'City street', 'Café / restaurant', 'Branded backdrop with logo', 'Abstract / gradient']
const VOICES = ['😊 Warm & Friendly', '📚 Authoritative & Confident', '😄 Fun & Upbeat', '🌸 Calm & Reassuring', '💪 Bold & Direct', '❌ No voiceover in this content']
const ACCENTS = ['🇦🇺 Australian', '🇺🇸 American', '🇬🇧 British', '🇮🇳 Indian', '🇳🇿 New Zealand', '🌍 Neutral / No accent']
const CONTENT_TYPES = ['🎬 Video', '📸 Image / Photo', '✍️ Caption / Post', '📝 Blog Article']

interface QStep {
  id: string
  question: string
  hint?: string | ((a: Record<string, string>) => string)
  type: 'chips' | 'text' | 'textarea'
  options?: string[]
  placeholder?: string
  required?: boolean
  showWhen?: (a: Record<string, string>) => boolean
}

// Questions are dynamically filtered based on answers + profile
function buildQuestions(profile: Record<string, string>, intelligence: Record<string, unknown>): QStep[] {
  const bizName = profile.businessName || 'your business'
  const subIndustry = (intelligence as any)?.niche_intelligence?.sub_industry || profile.industry || 'your industry'
  const ideas = (intelligence as any)?.ideas_bank?.video_ideas?.slice(0, 4) || []
  const ideaOptions = ideas.length > 0
    ? [...ideas.map((idea: string) => `💡 ${idea}`), '🎲 Surprise me — pick the best idea']
    : ['💡 Show what makes us different', '💡 Behind the scenes of our process', '💡 Customer result or transformation', '💡 Our bestselling product in action', '🎲 Surprise me — pick the best idea']

  return [
    {
      id: 'contentType',
      question: 'What are we making today?',
      hint: `Everything is tailored to ${bizName} and ${subIndustry}.`,
      type: 'chips', options: CONTENT_TYPES,
    },
    {
      id: 'platform',
      question: 'Which platform is this going on?',
      hint: 'Each platform gets its own native format — not a copy-paste job.',
      type: 'chips', options: PLATFORMS,
    },
    {
      id: 'subject',
      question: `What's the focus of this content?`,
      hint: `Based on your intelligence profile, here are the top ideas for ${bizName} right now. Tap one or describe your own.`,
      type: 'chips', options: ideaOptions,
      showWhen: () => true,
    },
    {
      id: 'subjectCustom',
      question: 'Tell me more about what you want to show',
      hint: 'Be specific — mention a product name, a promotion, a story, anything. The more detail, the better.',
      type: 'textarea',
      placeholder: `e.g. "showcase our new winter collection drop, especially the oversized hoodie — it's flying out the door"`,
      required: false,
      showWhen: (a) => !!a.subject,
    },
    {
      id: 'videoStyle',
      question: 'What style of video?',
      hint: "These are the formats used by the world's top content agencies. Pick the one that fits best.",
      type: 'chips', options: VIDEO_STYLES,
      showWhen: (a) => a.contentType?.includes('Video'),
    },
    {
      id: 'presenterGender',
      question: 'Who is your AI presenter?',
      hint: "We'll build them once and use them in all your future videos. Pick their gender first.",
      type: 'chips', options: PRESENTER_GENDERS,
      showWhen: (a) => a.videoStyle?.includes('AI Presenter'),
    },
    {
      id: 'presenterAge',
      question: 'How old do they look?',
      hint: 'Pick the age range that best represents your brand.',
      type: 'chips', options: PRESENTER_AGES,
      showWhen: (a) => a.videoStyle?.includes('AI Presenter'),
    },
    {
      id: 'presenterStyle',
      question: "What's their style?",
      hint: 'This shapes their clothing, posture, and energy.',
      type: 'chips', options: PRESENTER_STYLES,
      showWhen: (a) => a.videoStyle?.includes('AI Presenter'),
    },
    {
      id: 'presenterHair',
      question: 'Hair style?',
      type: 'chips', options: PRESENTER_HAIR,
      showWhen: (a) => a.videoStyle?.includes('AI Presenter'),
    },
    {
      id: 'presenterAccessory',
      question: 'Any accessories or props?',
      hint: 'They can hold a surfboard, a coffee, a laptop — whatever fits your brand.',
      type: 'chips', options: PRESENTER_ACCESSORIES,
      showWhen: (a) => a.videoStyle?.includes('AI Presenter'),
    },
    {
      id: 'presenterBackground',
      question: 'What background are they in front of?',
      type: 'chips', options: PRESENTER_BACKGROUNDS,
      showWhen: (a) => a.videoStyle?.includes('AI Presenter'),
    },
    {
      id: 'visualFeel',
      question: "What's the overall vibe?",
      hint: 'This sets the colour grade, lighting, and energy of the whole piece.',
      type: 'chips', options: VISUAL_FEELS,
      showWhen: (a) => a.contentType?.includes('Video') || a.contentType?.includes('Image'),
    },
    {
      id: 'music',
      question: 'What music mood?',
      type: 'chips', options: MUSIC_OPTS,
      showWhen: (a) => a.contentType?.includes('Video'),
    },
    {
      id: 'voice',
      question: 'Is there a voiceover?',
      hint: a => a.videoStyle?.includes('AI Presenter')
        ? 'Your AI presenter can speak. What voice style?'
        : 'We can generate a voiceover or you can record your own.',
      type: 'chips', options: VOICES,
      showWhen: (a) => a.contentType?.includes('Video'),
    },
    {
      id: 'accent',
      question: 'Accent?',
      hint: 'An Australian accent for an Australian business builds instant local trust.',
      type: 'chips', options: ACCENTS,
      showWhen: (a) => !!a.voice && !a.voice.includes('No voiceover'),
    },
    {
      id: 'extra',
      question: 'Anything else to add?',
      hint: "Don't hold back. Mention your brand colours, logo placement, a deadline, a promotion, anything.",
      type: 'textarea',
      placeholder: `e.g. "Use our brand pink, show the logo in bottom left corner, mention our Mother's Day sale ends Sunday"`,
    },
  ]
}

interface Answers { [key: string]: string }

export default function Studio() {
  const navigate = useNavigate()
  const profile = JSON.parse(localStorage.getItem('gp_profile') || '{}')
  const intelligence = JSON.parse(localStorage.getItem('gp_intelligence') || '{}')
  const firstName = profile.ownerFirstName || 'there'
  const bizName = profile.businessName || 'your business'

  // Handle Stripe redirect params
  const [paymentToast, setPaymentToast] = useState<string | null>(null)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const payment = params.get('payment')
    const plan = params.get('plan')
    const credits = params.get('credits')
    if (payment === 'success' && plan) {
      setPaymentToast(`🎉 Welcome to ${plan.toUpperCase()}! Your plan is now active.`)
      window.history.replaceState({}, '', '/studio')
    } else if (payment === 'topup' && credits) {
      setPaymentToast(`⚡ ${credits} credits added to your account!`)
      window.history.replaceState({}, '', '/studio')
    } else if (payment === 'cancelled') {
      setPaymentToast('Payment cancelled — no charges made.')
      window.history.replaceState({}, '', '/studio')
    }
    if (payment) setTimeout(() => setPaymentToast(null), 5000)
  }, [])

  const [mode, setMode] = useState<'home' | 'creating' | 'generating' | 'preview'>('home')
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [inputVal, setInputVal] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [generatedContent, setGeneratedContent] = useState<string>('')
  const [generatedImage, setGeneratedImage] = useState<string>('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Dynamic questions based on profile + intelligence
  const ALL_QUESTIONS = buildQuestions(profile, intelligence)
  const activeQuestions = ALL_QUESTIONS.filter(q => !q.showWhen || q.showWhen(answers))
  const current = activeQuestions[qIndex]
  const progress = Math.round(((qIndex) / Math.max(activeQuestions.length, 1)) * 100)
  const currentHint = typeof current?.hint === 'function' ? current.hint(answers) : current?.hint

  const handleAnswer = (val: string) => {
    const updated = { ...answers, [current.id]: val }
    setAnswers(updated)
    setInputVal('')
    if (qIndex < activeQuestions.length - 1) {
      setQIndex(i => i + 1)
    } else {
      handleGenerate(updated)
    }
  }

  const handleGenerate = async (finalAnswers: Answers) => {
    setMode('generating')
    // Store answers in localStorage so Co-pilot can read them — no more asking again
    localStorage.setItem('gp_studio_session', JSON.stringify({
      answers: finalAnswers,
      timestamp: Date.now(),
      bizName,
    }))
    try {
      const res = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: finalAnswers,
          profile: {
            businessName: bizName,
            industry: profile.industry,
            brandVoice: profile.brandVoice,
            brandColours: profile.brandColours,
            desc1: profile.desc1,
            desc2: profile.desc2,
          },
          intelligence,
        }),
      })
      const data = await res.json()
      setGeneratedContent(data.content || '')

      // Generate image if prompt returned
      if (data.imagePrompt) {
        const imgRes = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: data.imagePrompt, profile: { businessName: bizName } }),
        })
        const imgData = await imgRes.json()
        setGeneratedImage(imgData.url || '')
      }
    } catch {
      setGeneratedContent('Something went wrong — please try again.')
    }
    setMode('preview')
  }

  const handleUpload = (files: FileList) => {
    Array.from(files).forEach(f => {
      const reader = new FileReader()
      reader.onload = e => setUploadedFiles(p => [...p, e.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  const handleStartCreating = (idea?: string) => {
    setMode('creating')
    setQIndex(0)
    setAnswers(idea ? { subject: idea } : {})
    setInputVal('')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050505', fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>

      {/* Welcome tour — only shows once for new users */}
      <WelcomeTour />

      {/* Payment success toast */}
      <AnimatePresence>
        {paymentToast && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            style={{
              position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
              zIndex: 9999, background: '#111', border: '1px solid rgba(0,255,136,0.4)',
              borderRadius: 12, padding: '12px 20px', color: '#00ff88',
              fontFamily: 'Bangers, cursive', fontSize: 16, letterSpacing: 1,
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)', whiteSpace: 'nowrap',
            }}
          >
            {paymentToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STUDIO BACKGROUND DECOR ── */}
      <StudioBackground />

      {/* ── HEADER ── */}
      <div style={{
        position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)',
      }}>
        <h1 style={{
          fontFamily: 'Bangers, cursive', fontSize: 22, letterSpacing: 3,
          background: 'linear-gradient(90deg, #ff0099, #00ccff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0,
        }}>GET POSTED AI</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Credit gauge — live */}
          <LiveCreditGauge />
          <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: 20 }}>👤</button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: 680, margin: '0 auto', padding: '24px 20px' }}>

        <AnimatePresence mode="wait">

          {/* ── HOME MODE — billboard ideas ── */}
          {mode === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* Welcome */}
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>
                  Hey {firstName} 👋
                </h2>
                <p style={{ color: '#666', fontSize: 14, margin: 0 }}>
                  {intelligence.report_suggestions?.[0]
                    ? `Based on ${bizName}, I'd suggest starting with: ${intelligence.report_suggestions[0]}`
                    : `What are we creating for ${bizName} today?`}
                </p>
              </div>

              {/* Big CREATE button */}
              <motion.button
                onClick={() => handleStartCreating()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%', padding: '18px',
                  background: 'linear-gradient(90deg, #ff0099, #00ccff)',
                  border: 'none', borderRadius: 14, cursor: 'pointer',
                  fontFamily: 'Bangers, cursive', fontSize: 22, letterSpacing: 3, color: '#000',
                  boxShadow: '0 0 30px rgba(255,0,153,0.3)', marginBottom: 28,
                }}
              >
                🎬 CREATE CONTENT NOW
              </motion.button>

              {/* Billboard idea cards */}
              <p style={{ color: '#555', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>
                💡 Ideas for {bizName}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {BILLBOARD_IDEAS.map((idea, i) => (
                  <motion.button
                    key={i}
                    onClick={() => handleStartCreating(idea.title)}
                    whileHover={{ scale: 1.02, borderColor: 'rgba(255,0,153,0.4)' }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 12, padding: '14px 12px', cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontSize: 22 }}>{idea.emoji}</span>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: 1,
                        color: idea.tag === 'VIRAL' ? '#ff0099' : idea.tag === 'TRENDING' ? '#00ccff' : '#888',
                        background: idea.tag === 'VIRAL' ? 'rgba(255,0,153,0.1)' : idea.tag === 'TRENDING' ? 'rgba(0,204,255,0.1)' : 'rgba(255,255,255,0.05)',
                        padding: '2px 6px', borderRadius: 4,
                      }}>{idea.tag}</span>
                    </div>
                    <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>{idea.title}</p>
                    <p style={{ color: '#555', fontSize: 11, margin: 0, lineHeight: 1.4 }}>{idea.desc}</p>
                  </motion.button>
                ))}
              </div>

              {/* ── AI Media Generator — Video / Image / Voice ── */}
              <div style={{ marginTop: 28 }}>
                <p style={{ color: '#555', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>
                  ✨ AI Media Lab — Powered by RunPod GPU
                </p>
                <MediaCreator />
              </div>
            </motion.div>
          )}

          {/* ── CREATING MODE — rolling question box ── */}
          {mode === 'creating' && (
            <motion.div key="creating" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {/* Cinema screen frame */}
              <div style={{
                background: 'rgba(0,0,0,0.8)',
                border: '2px solid rgba(255,255,255,0.08)',
                borderRadius: 20, overflow: 'hidden',
                boxShadow: '0 0 60px rgba(255,0,153,0.1), 0 0 120px rgba(0,204,255,0.05)',
              }}>
                {/* Screen top bar */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: '#ff3b30' }} />
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: '#ffcc00' }} />
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: '#28cd41' }} />
                  <span style={{ color: '#444', fontSize: 11, marginLeft: 8, letterSpacing: 1 }}>CONTENT CREATION STUDIO</span>
                  {/* Progress bar */}
                  <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginLeft: 12 }}>
                    <motion.div
                      style={{ height: '100%', background: 'linear-gradient(90deg,#ff0099,#00ccff)', borderRadius: 2 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Question area */}
                <div style={{ padding: '32px 28px 24px' }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={qIndex}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <p style={{ color: '#666', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                        Step {qIndex + 1} of {activeQuestions.length}
                      </p>
                      <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.3 }}>
                        {current.question}
                      </h3>
                      {currentHint && (
                        <p style={{ color: '#555', fontSize: 13, marginBottom: 20 }}>{currentHint}</p>
                      )}

                      {/* Chips */}
                      {current.type === 'chips' && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {current.options!.map(opt => (
                            <motion.button key={opt} onClick={() => handleAnswer(opt)}
                              whileTap={{ scale: 0.95 }}
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 24, padding: '9px 16px',
                                color: '#fff', fontSize: 13, cursor: 'pointer',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,0,153,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,0,153,0.4)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                            >
                              {opt}
                            </motion.button>
                          ))}
                        </div>
                      )}

                      {/* Text / Textarea */}
                      {(current.type === 'text' || current.type === 'textarea') && (
                        <div>
                          {current.type === 'textarea' ? (
                            <textarea
                              autoFocus
                              value={inputVal}
                              onChange={e => setInputVal(e.target.value)}
                              placeholder={current.placeholder}
                              rows={3}
                              style={{
                                width: '100%', background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                                padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none',
                                boxSizing: 'border-box', resize: 'none', fontFamily: 'Inter, sans-serif',
                              }}
                            />
                          ) : (
                            <input autoFocus value={inputVal} onChange={e => setInputVal(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleAnswer(inputVal)}
                              placeholder={current.placeholder}
                              style={{
                                width: '100%', background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                                padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                              }}
                            />
                          )}
                          <button onClick={() => handleAnswer(inputVal)}
                            style={{
                              marginTop: 12, width: '100%',
                              background: 'linear-gradient(90deg, #ff0099, #00ccff)',
                              border: 'none', borderRadius: 10, padding: '12px',
                              fontFamily: 'Bangers, cursive', fontSize: 17, letterSpacing: 2,
                              color: '#000', cursor: 'pointer',
                            }}>
                            {qIndex === activeQuestions.length - 1 ? '🚀 CREATE IT' : 'NEXT →'}
                          </button>
                          {!current.required && (
                            <button onClick={() => handleAnswer('')}
                              style={{ marginTop: 8, width: '100%', background: 'none', border: 'none', color: '#444', fontSize: 12, cursor: 'pointer' }}>
                              Skip
                            </button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Upload strip at bottom */}
                <div style={{
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  padding: '14px 20px', background: 'rgba(255,255,255,0.02)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <button onClick={() => fileRef.current?.click()}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', color: '#888', fontSize: 12, cursor: 'pointer' }}>
                    📎 Upload assets
                  </button>
                  {uploadedFiles.map((u, i) => (
                    <div key={i} style={{ width: 32, height: 32, borderRadius: 6, background: `url(${u}) center/cover`, border: '1px solid rgba(255,255,255,0.1)' }} />
                  ))}
                  <input ref={fileRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }}
                    onChange={e => e.target.files && handleUpload(e.target.files)} />
                  <button onClick={() => setMode('home')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#444', fontSize: 12, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── GENERATING ── */}
          {mode === 'generating' && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '60px 20px' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                style={{ fontSize: 48, display: 'inline-block', marginBottom: 20 }}
              >🎬</motion.div>
              <h3 style={{ color: '#fff', fontSize: 22, fontFamily: 'Bangers, cursive', letterSpacing: 3, marginBottom: 8 }}>
                CREATING YOUR CONTENT
              </h3>
              <p style={{ color: '#666', fontSize: 14 }}>Our creative team is on it ✨</p>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 6 }}>
                {[0,1,2].map(i => (
                  <motion.div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: '#ff0099' }}
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }} />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── PREVIEW ── */}
          {mode === 'preview' && (
            <motion.div key="preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>Your Content is Ready 🎉</h3>
                <button onClick={() => setMode('home')} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 13 }}>← Back</button>
              </div>

              {generatedImage && (
                <div style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <img src={generatedImage} alt="Generated" style={{ width: '100%', display: 'block' }} />
                </div>
              )}

              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, padding: 20, marginBottom: 16,
                color: '#ccc', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap',
              }}>
                {generatedContent}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <motion.button whileTap={{ scale: 0.97 }}
                  style={{ background: 'linear-gradient(90deg,#ff0099,#00ccff)', border: 'none', borderRadius: 10, padding: '13px', fontFamily: 'Bangers, cursive', fontSize: 16, letterSpacing: 2, color: '#000', cursor: 'pointer' }}>
                  ✅ LOVE IT — SCHEDULE
                </motion.button>
                <motion.button onClick={() => { setMode('creating'); setQIndex(0) }} whileTap={{ scale: 0.97 }}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '13px', color: '#fff', fontSize: 14, cursor: 'pointer' }}>
                  ✏️ Change something
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '13px', color: '#fff', fontSize: 14, cursor: 'pointer' }}
                  onClick={() => {
                    if (navigator.share) navigator.share({ text: generatedContent })
                    else navigator.clipboard.writeText(generatedContent)
                  }}>
                  📤 Share / Export
                </motion.button>
                <motion.button onClick={() => { setMode('home'); setAnswers({}); setQIndex(0) }} whileTap={{ scale: 0.97 }}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '13px', color: '#fff', fontSize: 14, cursor: 'pointer' }}>
                  🔄 Start fresh
                </motion.button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <BottomNav />
    </div>
  )
}

// ── Live credit gauge — fetches real balance from Supabase ───────────────────
const PLAN_MAX: Record<string, number> = { starter: 300, pro: 1000, enterprise: 4000 }

function LiveCreditGauge() {
  const [credits, setCredits] = useState<number | null>(null)
  const [plan, setPlan] = useState('starter')
  const [showTopup, setShowTopup] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // Demo / localStorage fallback
        const p = JSON.parse(localStorage.getItem('gp_profile') || '{}')
        setCredits(p.credits ?? 300)
        return
      }
      try {
        const res = await fetch('/api/credits', { headers: { Authorization: `Bearer ${session.access_token}` } })
        const d = await res.json()
        setCredits(d.credits ?? 300)
        setPlan(d.plan ?? 'starter')
      } catch { setCredits(300) }
    }
    load()
  }, [])

  const max = PLAN_MAX[plan] || 300
  const safeCredits = credits ?? max
  const pct = Math.min(safeCredits / max, 1)
  const color = pct > 0.5 ? '#00ccff' : pct > 0.2 ? '#FFD600' : '#ff0099'

  return (
    <>
      <div
        onClick={() => setShowTopup(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '4px 10px', cursor: 'pointer' }}
        title="Tap to top up credits"
      >
        <span style={{ fontSize: 12 }}>⚡</span>
        <div style={{ width: 48, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${pct * 100}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
        </div>
        <span style={{ color: '#888', fontSize: 11 }}>{credits ?? '...'}</span>
      </div>

      {/* Top-up panel */}
      <AnimatePresence>
        {showTopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            style={{
              position: 'fixed', top: 60, right: 16, zIndex: 9999,
              background: '#111', border: '1px solid rgba(255,0,153,0.3)',
              borderRadius: 16, padding: 20, width: 260,
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
          >
            <p style={{ color: '#fff', fontFamily: 'Bangers, cursive', fontSize: 18, letterSpacing: 2, marginBottom: 4 }}>TOP UP CREDITS</p>
            <p style={{ color: '#555', fontSize: 12, marginBottom: 16 }}>You have <strong style={{ color: '#fff' }}>{credits}</strong> credits left</p>
            {[
              { pack: '500', label: '500 credits', price: '$19.99 AUD' },
              { pack: '1500', label: '1,500 credits', price: '$49.99 AUD' },
              { pack: '5000', label: '5,000 credits', price: '$129.99 AUD' },
              { pack: '12000', label: '12,000 credits', price: '$249.99 AUD' },
            ].map(({ pack, label, price }) => (
              <button key={pack} onClick={() => { setShowTopup(false); startTopup(pack as any) }}
                style={{
                  width: '100%', marginBottom: 8, padding: '10px 14px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, color: '#fff', fontSize: 13, cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#ff0099')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              >
                <span>{label}</span>
                <span style={{ color: '#00ccff', fontWeight: 600 }}>{price}</span>
              </button>
            ))}
            <button onClick={() => { setShowTopup(false); openBillingPortal() }}
              style={{ width: '100%', marginTop: 4, padding: '8px', background: 'none', border: 'none', color: '#555', fontSize: 12, cursor: 'pointer' }}>
              Manage subscription →
            </button>
            <button onClick={() => setShowTopup(false)}
              style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', color: '#555', fontSize: 18, cursor: 'pointer' }}>×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Studio background decor ──────────────────────────────────────────────────
function StudioBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 1 }}>
      {/* Gradient glow */}
      <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,0,153,0.06) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', bottom: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,204,255,0.06) 0%, transparent 70%)' }} />
      {/* Production lights top corners */}
      <div style={{ position: 'absolute', top: 60, left: 10, fontSize: 28, opacity: 0.12, transform: 'rotate(-20deg)' }}>💡</div>
      <div style={{ position: 'absolute', top: 60, right: 10, fontSize: 28, opacity: 0.12, transform: 'rotate(20deg)' }}>💡</div>
      {/* Director chair bottom */}
      <div style={{ position: 'absolute', bottom: 80, right: 12, fontSize: 32, opacity: 0.08 }}>🎬</div>
      <div style={{ position: 'absolute', bottom: 80, left: 12, fontSize: 28, opacity: 0.08 }}>🎭</div>
      {/* Film strip lines */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, rgba(255,0,153,0.15), transparent)' }} />
      <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)' }} />
    </div>
  )
}

// ── Bottom nav ───────────────────────────────────────────────────────────────
function BottomNav() {
  const navigate = useNavigate()
  const items = [
    { icon: '🏠', label: 'Studio', path: '/studio' },
    { icon: '🖼️', label: 'Gallery', path: '/gallery' },
    { icon: '📅', label: 'Schedule', path: '/schedule' },
    { icon: '👤', label: 'Profile', path: '/profile' },
  ]
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', justifyContent: 'space-around', padding: '10px 0 20px',
    }}>
      {items.map(item => (
        <button key={item.path} onClick={() => navigate(item.path)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          <span style={{ color: '#555', fontSize: 10 }}>{item.label}</span>
        </button>
      ))}
    </div>
  )
}
