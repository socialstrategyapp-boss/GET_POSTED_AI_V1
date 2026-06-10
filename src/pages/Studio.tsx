import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router'
import WelcomeTour from '@/components/WelcomeTour'
import MediaCreator from '@/components/studio/MediaCreator'
import { supabase } from '@/lib/supabase'
import { startTopup, openBillingPortal } from '@/hooks/useCheckout'
import { sendAiMessage } from '@/lib/api'

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

// ── Question option sets ────────────────────────────────────────────────────
const Q1_OPTIONS = ['Video', 'Image', 'Carousel Post', 'Caption / Hashtags', 'Blog Article', 'Full Strategy']

const Q2_FORMATS: Record<string, string[]> = {
  'Video': ['30-sec Short', '60-sec Reel', 'Multi-part Series', 'Long-form', 'Ad'],
  'Image': ['Single Image', 'Carousel', 'Infographic', 'Meme', 'Quote Card'],
  'Carousel Post': ['Instagram Caption', 'Facebook Post', 'Tweet / X', 'LinkedIn'],
  'Caption / Hashtags': ['Instagram Caption', 'Facebook Post', 'Tweet / X', 'LinkedIn'],
  'Blog Article': ['Short Blog', 'Long-form Article', 'SEO Post'],
  'Full Strategy': ['Weekly Plan', 'Monthly Plan', 'Campaign'],
}

const Q3_TOPICS = [
  'Behind the scenes',
  'Product showcase',
  'Customer story / testimonial',
  'Tips & education',
  'Trending audio / dance',
  'Day in the life',
  'Before & after',
  'FAQ',
  'Sale / promotion',
]

const Q4_GOALS = ['Go viral / reach', 'Drive sales', 'Build trust', 'Educate', 'Entertain', 'Grow followers']

const Q5_PRESENTERS = [
  'You (face to camera)',
  'Staff member',
  'AI Character',
  'Voiceover only (no face)',
  'Hands only / product shots',
  'Customer',
]

const Q6_VOICES = ['Male', 'Female', 'Neutral']
const Q6_ACCENTS = ['Australian', 'American', 'British', 'Indian', 'New Zealand']
const Q6_ENERGY = ['Calm', 'Energetic', 'Professional', 'Casual']

const Q7_STYLES = [
  'Bright & airy',
  'Dark & moody',
  'Cinematic',
  'Raw / authentic',
  'Professional studio',
  'Outdoor / nature',
  'Your brand style',
]

const Q8_MOODS = ['Trending audio', 'Upbeat', 'Calm', 'No music', 'Voiceover only']

const Q9_SERIES = ['2-part', '3-part', '5-part', '7-part']

const AI_CHARACTERS = [
  { name: 'Elena', style: 'Professional woman, corporate attire', emoji: '👩‍💼' },
  { name: 'Marcus', style: 'Casual man, friendly and approachable', emoji: '👨‍💻' },
  { name: 'Sage', style: 'Wellness coach, calm and natural', emoji: '🧘' },
  { name: 'Jax', style: 'Edgy and energetic, street style', emoji: '🧢' },
  { name: 'Luna', style: 'Creative artist, colorful and bold', emoji: '🎨' },
  { name: 'Ace', style: 'Athletic and sporty, high energy', emoji: '⚡' },
]

// ── Types ───────────────────────────────────────────────────────────────────
interface Answers {
  [key: string]: string | string[]
}

interface QuestionConfig {
  id: string
  question: string
  hint?: string
  subtitle?: string
  type: 'single' | 'multi' | 'text' | 'textarea' | 'gallery' | 'confirm'
  options?: string[]
  allowCustom?: boolean
  allowSkip?: boolean
  showWhen?: (answers: Answers) => boolean
  placeholder?: string
}

// ── Slide animation variants ────────────────────────────────────────────────
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
}

export default function Studio() {
  const navigate = useNavigate()
  const profile = JSON.parse(localStorage.getItem('gp_profile') || '{}')
  const intelligence = JSON.parse(localStorage.getItem('gp_intelligence') || '{}')
  const firstName = profile.ownerFirstName || 'there'
  const bizName = profile.business_name || profile.businessName || 'your business'
  const industry = profile.industry || 'your industry'
  const websiteUrl = profile.website_url || ''
  const aboutBusiness = profile.about_business || ''

  // Payment toast handling
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

  // Main mode state
  const [mode, setMode] = useState<'home' | 'creating' | 'generating' | 'preview'>('home')

  // Question flow state
  const [qIndex, setQIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [answers, setAnswers] = useState<Answers>({})
  const [inputVal, setInputVal] = useState('')
  const [customVal, setCustomVal] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [selectedMulti, setSelectedMulti] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [generatedContent, setGeneratedContent] = useState<string>('')
  const [generatedImage, setGeneratedImage] = useState<string>('')
  const [, setIsLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Build dynamic question list
  const allQuestions: QuestionConfig[] = [
    {
      id: 'contentType',
      question: 'What are we making today?',
      hint: 'Choose the type of content you want to create.',
      subtitle: `For ${bizName}...`,
      type: 'single',
      options: Q1_OPTIONS,
      allowCustom: true,
    },
    {
      id: 'format',
      question: "What's the format?",
      hint: 'Pick the specific format that fits your goal.',
      type: 'single',
      options: [], // filled dynamically
      allowCustom: true,
    },
    {
      id: 'topic',
      question: "What's the topic?",
      hint: `Based on ${bizName} in ${industry}, here are popular topics.`,
      type: 'single',
      options: Q3_TOPICS,
      allowCustom: true,
    },
    {
      id: 'goal',
      question: "What's the goal?",
      hint: 'What do you want this content to achieve?',
      type: 'single',
      options: Q4_GOALS,
      allowCustom: true,
    },
    {
      id: 'presenter',
      question: "Who's presenting?",
      hint: 'Who will be on camera or delivering this content?',
      type: 'single',
      options: Q5_PRESENTERS,
      showWhen: (a) => {
        const ct = String(a.contentType || '')
        return ct === 'Video' || ct === 'Image' || ct === 'Carousel Post'
      },
    },
    {
      id: 'aiCharacter',
      question: 'Choose your AI Character',
      hint: 'This character will be used across all your content. Pick one!',
      type: 'gallery',
      showWhen: (a) => String(a.presenter || '') === 'AI Character',
    },
    {
      id: 'voiceGender',
      question: 'Voice type?',
      hint: 'What voice style fits your brand?',
      type: 'single',
      options: Q6_VOICES,
      showWhen: (a) => {
        const ct = String(a.contentType || '')
        const pr = String(a.presenter || '')
        return ct === 'Video' || ct === 'Blog Article' || pr.includes('Voiceover')
      },
    },
    {
      id: 'voiceAccent',
      question: 'Accent?',
      hint: 'Pick an accent that resonates with your audience.',
      type: 'single',
      options: Q6_ACCENTS,
      showWhen: (a) => {
        const ct = String(a.contentType || '')
        const pr = String(a.presenter || '')
        return ct === 'Video' || ct === 'Blog Article' || pr.includes('Voiceover')
      },
    },
    {
      id: 'voiceEnergy',
      question: 'Energy level?',
      hint: 'How should the delivery feel?',
      type: 'single',
      options: Q6_ENERGY,
      showWhen: (a) => {
        const ct = String(a.contentType || '')
        const pr = String(a.presenter || '')
        return ct === 'Video' || ct === 'Blog Article' || pr.includes('Voiceover')
      },
    },
    {
      id: 'style',
      question: 'Style & Look?',
      hint: 'What visual style matches your brand?',
      type: 'single',
      options: Q7_STYLES,
      showWhen: (a) => {
        const ct = String(a.contentType || '')
        return ct === 'Video' || ct === 'Image' || ct === 'Carousel Post'
      },
    },
    {
      id: 'music',
      question: 'Music / Mood?',
      hint: 'What audio vibe are you going for?',
      type: 'single',
      options: Q8_MOODS,
      showWhen: (a) => String(a.contentType || '') === 'Video',
    },
    {
      id: 'seriesCount',
      question: 'How many parts?',
      hint: 'How many videos in this series?',
      type: 'single',
      options: Q9_SERIES,
      showWhen: (a) => String(a.format || '') === 'Multi-part Series',
    },
    ...[2, 3, 4, 5, 6, 7].map((n) => ({
      id: `seriesTopic${n}`,
      question: `Topic for video ${n - 1}:`,
      hint: `What should video ${n - 1} be about?`,
      type: 'text' as const,
      placeholder: `e.g. "Our best-selling product feature"`,
      showWhen: (a: Answers) => {
        const fmt = String(a.format || '')
        const count = String(a.seriesCount || '2-part')
        const num = parseInt(count.split('-')[0]) || 2
        return fmt === 'Multi-part Series' && n <= num + 1
      },
    })),
    {
      id: 'referencePhotos',
      question: 'Any reference photos?',
      hint: 'Upload images to guide the content creation.',
      type: 'single',
      options: ['Upload from device', 'Choose from business gallery', 'Skip'],
      allowSkip: true,
    },
    {
      id: 'extraDetails',
      question: 'Anything else to add?',
      hint: 'Add any extra details, special offers, dates, hashtags to include...',
      type: 'textarea',
      placeholder: `e.g. "Use our brand colours, mention the sale ends Sunday, include #${(bizName || 'business').replace(/\s+/g, '')}"`,
      allowSkip: true,
    },
    {
      id: 'confirm',
      question: 'Ready to generate?',
      hint: 'Review your choices and hit create!',
      type: 'confirm',
    },
  ]

  // Filter visible questions
  const visibleQuestions = allQuestions.filter((q) => !q.showWhen || q.showWhen(answers))
  const currentQ = visibleQuestions[qIndex]
  const totalQuestions = visibleQuestions.length
  const progress = Math.round(((qIndex) / Math.max(totalQuestions - 1, 1)) * 100)

  // Get format options based on content type
  const getFormatOptions = useCallback(() => {
    const ct = String(answers.contentType || '')
    return Q2_FORMATS[ct] || ['Standard']
  }, [answers.contentType])

  // Reset states when entering a new question
  useEffect(() => {
    setInputVal('')
    setCustomVal('')
    setShowCustom(false)
    setSelectedMulti([])
  }, [qIndex])

  // Handle single select answer
  const handleSelect = (val: string) => {
    if (val === 'Something else...' || val === 'Something else (type your own)') {
      setShowCustom(true)
      return
    }
    goNext({ ...answers, [currentQ.id]: val })
  }

  // Handle multi-select toggle
  const handleMultiToggle = (val: string) => {
    setSelectedMulti((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    )
  }

  // Handle multi-select submit
  const handleMultiSubmit = () => {
    if (showCustom && customVal.trim()) {
      goNext({ ...answers, [currentQ.id]: [...selectedMulti, customVal.trim()] })
    } else {
      goNext({ ...answers, [currentQ.id]: selectedMulti })
    }
  }

  // Go to next question
  const goNext = (updatedAnswers: Answers) => {
    setDirection(1)
    setAnswers(updatedAnswers)
    if (qIndex < totalQuestions - 1) {
      setQIndex((i) => i + 1)
    } else {
      handleGenerate(updatedAnswers)
    }
  }

  // Go to previous question
  const goBack = () => {
    if (qIndex > 0) {
      setDirection(-1)
      setQIndex((i) => i - 1)
    } else {
      setMode('home')
    }
  }

  // Handle final generation
  const handleGenerate = async (finalAnswers: Answers) => {
    setMode('generating')
    setIsLoading(true)

    // Build rich prompt from answers
    const contentType = String(finalAnswers.contentType || 'Content')
    const format = String(finalAnswers.format || '')
    const topic = String(finalAnswers.topic || '')
    const goal = String(finalAnswers.goal || '')
    const presenter = String(finalAnswers.presenter || '')
    const voiceGender = String(finalAnswers.voiceGender || '')
    const voiceAccent = String(finalAnswers.voiceAccent || '')
    const voiceEnergy = String(finalAnswers.voiceEnergy || '')
    const style = String(finalAnswers.style || '')
    const music = String(finalAnswers.music || '')
    const extraDetails = String(finalAnswers.extraDetails || '')
    const aiCharacter = String(finalAnswers.aiCharacter || '')

    // Build series topics if applicable
    let seriesTopics = ''
    if (format === 'Multi-part Series') {
      const topics: string[] = []
      for (let i = 2; i <= 8; i++) {
        const key = `seriesTopic${i}`
        if (finalAnswers[key]) {
          topics.push(`Video ${i - 1}: ${finalAnswers[key]}`)
        }
      }
      if (topics.length > 0) seriesTopics = '\n\nSeries breakdown:\n' + topics.join('\n')
    }

    const prompt = `Create ${contentType.toLowerCase()} content for ${bizName} (${industry}).

FORMAT: ${format}
TOPIC: ${topic}
GOAL: ${goal}
${presenter ? `PRESENTER: ${presenter}${aiCharacter ? ` - ${aiCharacter}` : ''}` : ''}
${voiceGender ? `VOICE: ${voiceGender}, ${voiceAccent} accent, ${voiceEnergy} energy` : ''}
${style ? `VISUAL STYLE: ${style}` : ''}
${music ? `MUSIC/MOOD: ${music}` : ''}
${extraDetails ? `\nEXTRA DETAILS: ${extraDetails}` : ''}
${seriesTopics}
${aboutBusiness ? `\nABOUT THE BUSINESS: ${aboutBusiness}` : ''}
${uploadedFiles.length > 0 ? `\nREFERENCE: ${uploadedFiles.length} reference image(s) uploaded.` : ''}

Please generate complete, ready-to-use content including all necessary captions, hashtags, descriptions, and formatting.`

    try {
      const response = await sendAiMessage(prompt, bizName, industry, websiteUrl, 'openai')
      setGeneratedContent(response?.reply || 'Content generated successfully!')
    } catch {
      // Fallback: generate locally
      setGeneratedContent(generateFallbackContent(finalAnswers))
    }

    setIsLoading(false)
    setMode('preview')
  }

  // Fallback content generator
  const generateFallbackContent = (finalAnswers: Answers) => {
    const ct = String(finalAnswers.contentType || '')
    const fmt = String(finalAnswers.format || '')
    const topic = String(finalAnswers.topic || '')
    const goal = String(finalAnswers.goal || '')

    if (ct === 'Caption / Hashtags' || ct === 'Carousel Post') {
      return `📱 ${fmt} for ${bizName}

${topic} ${goal ? `— designed to ${goal.toLowerCase()}` : ''}

🎯 Hook: Ever wondered what makes ${bizName} different? Here's the secret...

✨ Body: At ${bizName}, we believe in delivering excellence every single day. ${aboutBusiness ? aboutBusiness.slice(0, 100) + '...' : ''}

🚀 CTA: Follow @${bizName.replace(/\s+/g, '').toLowerCase()} for more!

#${bizName.replace(/\s+/g, '')} #${industry.replace(/\s+/g, '')} #${topic.replace(/\s+/g, '').toLowerCase()} #smallbusiness #contentcreator #trending #viral #growth`
    }

    if (ct === 'Blog Article') {
      return `# ${topic}: A Complete Guide for ${industry} Businesses

## Introduction
In today's competitive landscape, ${topic.toLowerCase()} has become essential for businesses like ${bizName}. Whether you're just starting out or looking to scale, understanding the nuances of ${topic.toLowerCase()} can make all the difference.

## Why ${topic} Matters
${aboutBusiness ? aboutBusiness.slice(0, 150) + '...' : `${bizName} understands that every business has unique needs when it comes to ${topic.toLowerCase()}.`}

## Key Strategies
1. **Focus on authenticity** — audiences connect with genuine stories
2. **Consistency is key** — show up regularly with valuable content
3. **Engage with your community** — reply to every comment and message
4. **Measure and adapt** — track what works and double down

## Conclusion
${topic} isn't just a trend — it's a powerful tool for ${goal ? goal.toLowerCase() : 'growing your business'}. Start implementing these strategies today and watch your ${industry} business thrive.

---
*Ready to create more content? Head back to the Studio!*`
    }

    if (ct === 'Full Strategy') {
      return `# ${fmt} Content Strategy for ${bizName}

## Week 1: Foundation
- **Monday**: Behind-the-scenes intro video
- **Wednesday**: Product showcase (${topic})
- **Friday**: Customer testimonial feature

## Week 2: Engagement
- **Monday**: Tips & educational content
- **Wednesday**: Trending format adaptation
- **Friday**: Community Q&A / FAQ

## Week 3: Conversion
- **Monday**: Before & after transformation
- **Wednesday**: Limited-time offer announcement
- **Friday**: User-generated content feature

## Week 4: Retention
- **Monday**: Day in the life content
- **Wednesday**: Industry insights / thought leadership
- **Friday**: Month recap + tease next month

## Hashtag Bank
#${bizName.replace(/\s+/g, '')} #${industry.replace(/\s+/g, '')} #smallbusiness #contentstrategy #growth #trending

---
*Strategy generated for ${goal ? goal.toLowerCase() : 'business growth'}*`    }

    // Default video/image content
    return `🎬 ${fmt} Script for ${bizName}

**TOPIC**: ${topic}
**GOAL**: ${goal}
**FORMAT**: ${fmt}

---

**[HOOK — 0-3 seconds]**
${(() => {
  const hooks: Record<string, string> = {
    'Product showcase': `You won't believe what ${bizName} just dropped...`,
    'Behind the scenes': `No one sees this part of ${bizName}... until now`,
    'Customer story / testimonial': `This customer changed everything for us`,
    'Tips & education': `Stop making this mistake (seriously)`,
    'Before & after': `The transformation is INSANE`,
    'FAQ': `We get asked this every single day...`,
    'Sale / promotion': `This deal ends SOON — here's what you need to know`,
    'Trending audio / dance': `When the beat drops but you're running a business`,
    'Day in the life': `POV: You're the owner of ${bizName}`,
  }
  return hooks[topic] || `This is going to change how you see ${bizName}...`
})()}

**[BODY — 3-25 seconds]**
${aboutBusiness ? aboutBusiness.slice(0, 200) : `At ${bizName}, we're passionate about what we do in the ${industry} space. Every day, we work to deliver the best for our customers.`}

${topic === 'Product showcase' ? `Take a closer look at what makes our product special. The details, the quality, the care — it's all here.` : ''}
${topic === 'Tips & education' ? `Here's what we've learned after years in ${industry}: focus on quality, stay consistent, and always put your customer first.` : ''}
${topic === 'Customer story / testimonial' ? `"${bizName} completely transformed how we approach ${industry}. I can't recommend them enough." — Happy Customer` : ''}

**[CTA — Final 5 seconds]**
✨ Follow @${bizName.replace(/\s+/g, '').toLowerCase()} for more
🔗 Link in bio
💬 Drop a comment if this resonated!

---

#${bizName.replace(/\s+/g, '')} #${industry.replace(/\s+/g, '')} #${topic.replace(/\s+/g, '').toLowerCase()} #contentcreator #smallbusiness #trending #reels #fyp`
  }

  // Handle file upload
  const handleUpload = (files: FileList) => {
    Array.from(files).forEach((f) => {
      const reader = new FileReader()
      reader.onload = (e) => setUploadedFiles((p) => [...p, e.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  // Start creating
  const handleStartCreating = (idea?: string) => {
    setMode('creating')
    setQIndex(0)
    setDirection(1)
    setAnswers(idea ? { topic: idea } : {})
    setInputVal('')
    setCustomVal('')
    setShowCustom(false)
    setSelectedMulti([])
    setUploadedFiles([])
    setGeneratedContent('')
    setGeneratedImage('')
  }

  // Get current options (dynamic for format question)
  const getCurrentOptions = (): string[] => {
    if (currentQ.id === 'format') {
      return [...getFormatOptions(), 'Something else...']
    }
    if (!currentQ.options) return []
    if (currentQ.allowCustom) {
      return [...currentQ.options, 'Something else (type your own)']
    }
    return currentQ.options
  }

  // Summary for confirm screen
  const buildSummary = () => {
    const entries = Object.entries(answers).filter(([k]) => k !== 'confirm')
    return entries.map(([k, v]) => {
      const label = visibleQuestions.find((q) => q.id === k)?.question || k
      const valStr = Array.isArray(v) ? v.join(', ') : String(v)
      return { label, value: valStr }
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050505', fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
      <WelcomeTour />

      {/* Payment toast */}
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

      <StudioBackground />

      {/* Header */}
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
          <LiveCreditGauge />
          <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: 20 }}>👤</button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: 680, margin: '0 auto', padding: '24px 20px 100px' }}>
        <AnimatePresence mode="wait">

          {/* ── HOME MODE ── */}
          {mode === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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

              <div style={{ marginTop: 28 }}>
                <p style={{ color: '#555', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>
                  ✨ AI Media Lab
                </p>
                <MediaCreator />
              </div>
            </motion.div>
          )}

          {/* ── CREATING MODE — Rolling Question Flow ── */}
          {mode === 'creating' && (
            <motion.div key="creating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Cinema Screen Frame */}
              <div style={{
                background: 'rgba(0,0,0,0.8)',
                border: '2px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: '0 0 60px rgba(255,0,153,0.1), 0 0 120px rgba(0,204,255,0.05)',
              }}>
                {/* Top bar with progress */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  {/* Traffic lights */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 5, background: '#ff3b30' }} />
                    <div style={{ width: 10, height: 10, borderRadius: 5, background: '#ffcc00' }} />
                    <div style={{ width: 10, height: 10, borderRadius: 5, background: '#28cd41' }} />
                  </div>
                  <span style={{ color: '#444', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {qIndex + 1} / {totalQuestions}
                  </span>
                  {/* Progress bar */}
                  <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <motion.div
                      style={{ height: '100%', background: 'linear-gradient(90deg,#ff0099,#00ccff)', borderRadius: 2 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                    />
                  </div>
                  {/* Back button */}
                  <button
                    onClick={goBack}
                    style={{
                      background: 'none', border: 'none', color: '#888', fontSize: 12,
                      cursor: 'pointer', padding: '4px 8px', whiteSpace: 'nowrap',
                    }}
                  >
                    ← Back
                  </button>
                </div>

                {/* Question content area */}
                <div style={{ padding: '28px 24px 24px', minHeight: 380 }}>
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={qIndex}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {/* Question text */}
                      <p style={{
                        color: '#666', fontSize: 10, letterSpacing: 2,
                        textTransform: 'uppercase', marginBottom: 6,
                      }}>
                        Question {qIndex + 1} of {totalQuestions}
                      </p>
                      <h3 style={{
                        color: '#fff', fontSize: 22, fontWeight: 700,
                        margin: '0 0 4px', lineHeight: 1.3, fontFamily: 'Inter, sans-serif',
                      }}>
                        {currentQ?.question}
                      </h3>
                      {currentQ?.hint && (
                        <p style={{ color: '#888', fontSize: 13, margin: '0 0 12px', lineHeight: 1.5 }}>
                          {currentQ.hint}
                        </p>
                      )}
                      {currentQ?.subtitle && (
                        <p style={{ color: '#ff0099', fontSize: 12, fontWeight: 600, margin: '0 0 16px' }}>
                          {currentQ.subtitle}
                        </p>
                      )}

                      {/* ── SINGLE SELECT OPTIONS ── */}
                      {(currentQ?.type === 'single') && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {/* Options grid */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: getCurrentOptions().length > 6 ? '1fr 1fr' : '1fr',
                            gap: 8,
                          }}>
                            {getCurrentOptions().map((opt) => (
                              <motion.button
                                key={opt}
                                onClick={() => handleSelect(opt)}
                                whileTap={{ scale: 0.97 }}
                                style={{
                                  background: 'rgba(255,255,255,0.03)',
                                  border: '1px solid rgba(255,255,255,0.07)',
                                  borderRadius: 12,
                                  padding: '14px 16px',
                                  color: '#fff',
                                  fontSize: 14,
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = 'rgba(255,0,153,0.4)'
                                  e.currentTarget.style.background = 'rgba(255,0,153,0.06)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                                }}
                              >
                                {opt}
                              </motion.button>
                            ))}
                          </div>

                          {/* Custom input when "Something else" selected */}
                          {showCustom && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              style={{ marginTop: 8 }}
                            >
                              <input
                                autoFocus
                                value={customVal}
                                onChange={(e) => setCustomVal(e.target.value)}
                                placeholder="Type your own..."
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && customVal.trim()) {
                                    goNext({ ...answers, [currentQ.id]: customVal.trim() })
                                  }
                                }}
                                style={{
                                  width: '100%', background: 'rgba(255,255,255,0.04)',
                                  border: '1px solid rgba(255,0,153,0.3)', borderRadius: 12,
                                  padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none',
                                  boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
                                }}
                              />
                              <button
                                onClick={() => {
                                  if (customVal.trim()) {
                                    goNext({ ...answers, [currentQ.id]: customVal.trim() })
                                  }
                                }}
                                style={{
                                  marginTop: 8, width: '100%',
                                  background: 'linear-gradient(90deg, #ff0099, #00ccff)',
                                  border: 'none', borderRadius: 10, padding: '11px',
                                  fontFamily: 'Bangers, cursive', fontSize: 16, letterSpacing: 2,
                                  color: '#000', cursor: 'pointer',
                                }}
                              >
                                Continue →
                              </button>
                            </motion.div>
                          )}

                          {/* Skip button */}
                          {currentQ?.allowSkip && (
                            <button
                              onClick={() => goNext({ ...answers, [currentQ.id]: '' })}
                              style={{
                                marginTop: 8, width: '100%', background: 'none',
                                border: 'none', color: '#555', fontSize: 12,
                                cursor: 'pointer', padding: '8px',
                              }}
                            >
                              Skip this question →
                            </button>
                          )}
                        </div>
                      )}

                      {/* ── MULTI SELECT OPTIONS ── */}
                      {currentQ?.type === 'multi' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {(currentQ.options || []).map((opt) => (
                              <motion.button
                                key={opt}
                                onClick={() => handleMultiToggle(opt)}
                                whileTap={{ scale: 0.97 }}
                                style={{
                                  background: selectedMulti.includes(opt)
                                    ? 'rgba(255,0,153,0.12)'
                                    : 'rgba(255,255,255,0.03)',
                                  border: selectedMulti.includes(opt)
                                    ? '1px solid #ff0099'
                                    : '1px solid rgba(255,255,255,0.07)',
                                  borderRadius: 12,
                                  padding: '12px 14px',
                                  color: '#fff',
                                  fontSize: 13,
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                <span style={{
                                  width: 18, height: 18, borderRadius: 4,
                                  border: selectedMulti.includes(opt) ? '2px solid #ff0099' : '2px solid rgba(255,255,255,0.2)',
                                  background: selectedMulti.includes(opt) ? '#ff0099' : 'transparent',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 10, flexShrink: 0,
                                }}>
                                  {selectedMulti.includes(opt) && '✓'}
                                </span>
                                {opt}
                              </motion.button>
                            ))}
                          </div>
                          {selectedMulti.length > 0 && (
                            <motion.button
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              onClick={handleMultiSubmit}
                              style={{
                                marginTop: 8, width: '100%',
                                background: 'linear-gradient(90deg, #ff0099, #00ccff)',
                                border: 'none', borderRadius: 10, padding: '12px',
                                fontFamily: 'Bangers, cursive', fontSize: 16, letterSpacing: 2,
                                color: '#000', cursor: 'pointer',
                              }}
                            >
                              Continue →
                            </motion.button>
                          )}
                        </div>
                      )}

                      {/* ── TEXT INPUT ── */}
                      {currentQ?.type === 'text' && (
                        <div>
                          <input
                            autoFocus
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            placeholder={currentQ.placeholder || 'Type your answer...'}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && inputVal.trim()) {
                                goNext({ ...answers, [currentQ.id]: inputVal.trim() })
                              }
                            }}
                            style={{
                              width: '100%', background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                              padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none',
                              boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
                            }}
                          />
                          <button
                            onClick={() => {
                              if (inputVal.trim()) {
                                goNext({ ...answers, [currentQ.id]: inputVal.trim() })
                              }
                            }}
                            style={{
                              marginTop: 10, width: '100%',
                              background: 'linear-gradient(90deg, #ff0099, #00ccff)',
                              border: 'none', borderRadius: 10, padding: '12px',
                              fontFamily: 'Bangers, cursive', fontSize: 16, letterSpacing: 2,
                              color: '#000', cursor: 'pointer',
                            }}
                          >
                            Continue →
                          </button>
                          {currentQ.allowSkip && (
                            <button
                              onClick={() => goNext({ ...answers, [currentQ.id]: '' })}
                              style={{
                                marginTop: 8, width: '100%', background: 'none',
                                border: 'none', color: '#555', fontSize: 12, cursor: 'pointer',
                              }}
                            >
                              Skip
                            </button>
                          )}
                        </div>
                      )}

                      {/* ── TEXTAREA ── */}
                      {currentQ?.type === 'textarea' && (
                        <div>
                          <textarea
                            autoFocus
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            placeholder={currentQ.placeholder || 'Add your details here...'}
                            rows={4}
                            style={{
                              width: '100%', background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                              padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none',
                              boxSizing: 'border-box', resize: 'none', fontFamily: 'Inter, sans-serif',
                              lineHeight: 1.5,
                            }}
                          />
                          <button
                            onClick={() => goNext({ ...answers, [currentQ.id]: inputVal.trim() })}
                            style={{
                              marginTop: 10, width: '100%',
                              background: 'linear-gradient(90deg, #ff0099, #00ccff)',
                              border: 'none', borderRadius: 10, padding: '12px',
                              fontFamily: 'Bangers, cursive', fontSize: 16, letterSpacing: 2,
                              color: '#000', cursor: 'pointer',
                            }}
                          >
                            {qIndex === totalQuestions - 1 ? '🚀 CREATE MY CONTENT' : 'Continue →'}
                          </button>
                          {currentQ.allowSkip && (
                            <button
                              onClick={() => goNext({ ...answers, [currentQ.id]: '' })}
                              style={{
                                marginTop: 8, width: '100%', background: 'none',
                                border: 'none', color: '#555', fontSize: 12, cursor: 'pointer',
                              }}
                            >
                              Skip
                            </button>
                          )}
                        </div>
                      )}

                      {/* ── AI CHARACTER GALLERY ── */}
                      {currentQ?.type === 'gallery' && (
                        <div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                            {AI_CHARACTERS.map((char) => (
                              <motion.button
                                key={char.name}
                                onClick={() => goNext({ ...answers, aiCharacter: `${char.name}: ${char.style}` })}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                style={{
                                  background: 'rgba(255,255,255,0.03)',
                                  border: '1px solid rgba(255,255,255,0.07)',
                                  borderRadius: 14,
                                  padding: '16px 10px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: 6,
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = 'rgba(0,204,255,0.4)'
                                  e.currentTarget.style.background = 'rgba(0,204,255,0.06)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                                }}
                              >
                                <span style={{ fontSize: 36 }}>{char.emoji}</span>
                                <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{char.name}</span>
                                <span style={{ color: '#666', fontSize: 10, textAlign: 'center', lineHeight: 1.3 }}>{char.style}</span>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── CONFIRM SCREEN ── */}
                      {currentQ?.type === 'confirm' && (
                        <div>
                          <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 14,
                            padding: '16px',
                            marginBottom: 16,
                            maxHeight: 280,
                            overflowY: 'auto',
                          }}>
                            {buildSummary().map((item, i) => (
                              <div
                                key={i}
                                style={{
                                  display: 'flex', justifyContent: 'space-between',
                                  padding: '6px 0',
                                  borderBottom: i < buildSummary().length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                }}
                              >
                                <span style={{ color: '#666', fontSize: 12 }}>{item.label}</span>
                                <span style={{ color: '#fff', fontSize: 12, fontWeight: 500, textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {item.value || '—'}
                                </span>
                              </div>
                            ))}
                          </div>

                          {uploadedFiles.length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                              <p style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>📎 Reference photos ({uploadedFiles.length})</p>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {uploadedFiles.slice(0, 4).map((u, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      width: 48, height: 48, borderRadius: 8,
                                      background: `url(${u}) center/cover`,
                                      border: '1px solid rgba(255,255,255,0.1)',
                                    }}
                                  />
                                ))}
                                {uploadedFiles.length > 4 && (
                                  <div style={{
                                    width: 48, height: 48, borderRadius: 8,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#888', fontSize: 11,
                                  }}>
                                    +{uploadedFiles.length - 4}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleGenerate(answers)}
                            style={{
                              width: '100%', padding: '16px',
                              background: 'linear-gradient(90deg, #ff0099, #00ccff)',
                              border: 'none', borderRadius: 14, cursor: 'pointer',
                              fontFamily: 'Bangers, cursive', fontSize: 20,
                              letterSpacing: 3, color: '#000',
                              boxShadow: '0 0 30px rgba(255,0,153,0.3)',
                            }}
                          >
                            🚀 CREATE MY CONTENT
                          </motion.button>
                          <button
                            onClick={() => { setMode('home'); setAnswers({}); setQIndex(0) }}
                            style={{
                              marginTop: 10, width: '100%', background: 'none',
                              border: 'none', color: '#555', fontSize: 12, cursor: 'pointer',
                            }}
                          >
                            Cancel and start over
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Bottom bar — file upload strip */}
                <div style={{
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  padding: '12px 20px',
                  background: 'rgba(255,255,255,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <button
                    onClick={() => fileRef.current?.click()}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8, padding: '6px 12px',
                      color: '#888', fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    📎 Upload assets
                  </button>
                  {uploadedFiles.map((u, i) => (
                    <div
                      key={i}
                      style={{
                        width: 32, height: 32, borderRadius: 6,
                        background: `url(${u}) center/cover`,
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    />
                  ))}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => e.target.files && handleUpload(e.target.files)}
                  />
                  <button
                    onClick={() => { setMode('home'); setAnswers({}); setQIndex(0) }}
                    style={{
                      marginLeft: 'auto', background: 'none', border: 'none',
                      color: '#444', fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── GENERATING MODE ── */}
          {mode === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '80px 20px' }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                style={{ fontSize: 56, display: 'inline-block', marginBottom: 24 }}
              >
                🎬
              </motion.div>
              <h3 style={{
                color: '#fff', fontSize: 24, fontFamily: 'Bangers, cursive',
                letterSpacing: 3, marginBottom: 10,
              }}>
                CREATING YOUR CONTENT
              </h3>
              <p style={{ color: '#666', fontSize: 14, marginBottom: 30 }}>
                Our AI is crafting something amazing for {bizName} ✨
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    style={{
                      width: 8, height: 8, borderRadius: 4,
                      background: i === 1 ? '#00ccff' : '#ff0099',
                    }}
                    animate={{ opacity: [1, 0.2, 1], scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── PREVIEW MODE ── */}
          {mode === 'preview' && (
            <motion.div key="preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{
                marginBottom: 16, display: 'flex',
                alignItems: 'center', justifyContent: 'space-between',
              }}>
                <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>
                  Your Content is Ready 🎉
                </h3>
                <button
                  onClick={() => setMode('home')}
                  style={{
                    background: 'none', border: 'none', color: '#555',
                    cursor: 'pointer', fontSize: 13,
                  }}
                >
                  ← Back
                </button>
              </div>

              {generatedImage && (
                <div style={{
                  marginBottom: 16, borderRadius: 12, overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <img src={generatedImage} alt="Generated" style={{ width: '100%', display: 'block' }} />
                </div>
              )}

              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, padding: 20, marginBottom: 16,
                color: '#ccc', fontSize: 14, lineHeight: 1.7,
                whiteSpace: 'pre-wrap', maxHeight: 500, overflowY: 'auto',
              }}>
                {generatedContent}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  style={{
                    background: 'linear-gradient(90deg,#ff0099,#00ccff)',
                    border: 'none', borderRadius: 10, padding: '13px',
                    fontFamily: 'Bangers, cursive', fontSize: 16,
                    letterSpacing: 2, color: '#000', cursor: 'pointer',
                  }}
                >
                  ✅ SAVE TO GALLERY
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setMode('creating')
                    setQIndex(Math.max(0, totalQuestions - 2))
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '13px',
                    color: '#fff', fontSize: 14, cursor: 'pointer',
                  }}
                >
                  ✏️ EDIT
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleGenerate(answers)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '13px',
                    color: '#fff', fontSize: 14, cursor: 'pointer',
                  }}
                >
                  🔄 REGENERATE
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ text: generatedContent })
                    } else {
                      navigator.clipboard.writeText(generatedContent)
                    }
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '13px',
                    color: '#fff', fontSize: 14, cursor: 'pointer',
                  }}
                >
                  📤 SHARE
                </motion.button>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { setMode('home'); setAnswers({}); setQIndex(0) }}
                style={{
                  marginTop: 10, width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, padding: '12px',
                  color: '#888', fontSize: 14, cursor: 'pointer',
                }}
              >
                🔄 START FRESH
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

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
        onClick={() => setShowTopup((v) => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.05)', borderRadius: 20,
          padding: '4px 10px', cursor: 'pointer',
        }}
        title="Tap to top up credits"
      >
        <span style={{ fontSize: 12 }}>⚡</span>
        <div style={{ width: 48, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${pct * 100}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
        </div>
        <span style={{ color: '#888', fontSize: 11 }}>{credits ?? '...'}</span>
      </div>

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
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#ff0099')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
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
      <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,0,153,0.06) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', bottom: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,204,255,0.06) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', top: 60, left: 10, fontSize: 28, opacity: 0.12, transform: 'rotate(-20deg)' }}>💡</div>
      <div style={{ position: 'absolute', top: 60, right: 10, fontSize: 28, opacity: 0.12, transform: 'rotate(20deg)' }}>💡</div>
      <div style={{ position: 'absolute', bottom: 80, right: 12, fontSize: 32, opacity: 0.08 }}>🎬</div>
      <div style={{ position: 'absolute', bottom: 80, left: 12, fontSize: 28, opacity: 0.08 }}>🎭</div>
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
      {items.map((item) => (
        <button key={item.path} onClick={() => navigate(item.path)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          <span style={{ color: '#555', fontSize: 10 }}>{item.label}</span>
        </button>
      ))}
    </div>
  )
}
