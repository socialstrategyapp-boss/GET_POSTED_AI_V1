import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, TrendingUp, Target, Users, Zap,
  Video, Palette,
  ChevronRight, CheckCircle2, Circle, ArrowLeft,
  RefreshCw
} from 'lucide-react'

// ── Audit sections ──────────────────────────────────────────────────────────
const AUDIT_SECTIONS = [
  {
    id: 'brand',
    title: 'Brand Foundation',
    icon: Palette,
    color: '#10b981',
    glow: 'rgba(16,185,129,0.3)',
    questions: [
      { id: 'b1', q: 'Does your business have a clear, memorable name?', options: ['Yes, it stands out', 'It\'s okay but could be better', 'No, it\'s confusing/generic'] },
      { id: 'b2', q: 'Do you have a consistent logo, colour palette, and font style?', options: ['Yes, fully branded', 'Partial — inconsistent', 'No branding at all'] },
      { id: 'b3', q: 'Can someone understand what you do in under 5 seconds on your profile?', options: ['Crystal clear', 'Somewhat clear', 'Confusing / vague'] },
      { id: 'b4', q: 'Do you have a tagline or slogan?', options: ['Yes, it\'s catchy & clear', 'Yes but needs work', 'No tagline'] },
    ],
  },
  {
    id: 'content',
    title: 'Content Strategy',
    icon: Video,
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.3)',
    questions: [
      { id: 'c1', q: 'How often do you post content?', options: ['Daily', '3-5 times/week', '1-2 times/week', 'Rarely / never'] },
      { id: 'c2', q: 'Do you use video content (Reels, TikTok, Shorts)?', options: ['Yes, regularly', 'Occasionally', 'No, only static posts', 'No video at all'] },
      { id: 'c3', q: 'Do you have a content calendar or plan?', options: ['Yes, planned ahead', 'Ad-hoc / when I remember', 'No plan at all'] },
      { id: 'c4', q: 'Are you using trending audio, hashtags, and formats?', options: ['Always on trend', 'Sometimes', 'Rarely', 'Never'] },
    ],
  },
  {
    id: 'audience',
    title: 'Audience & Engagement',
    icon: Users,
    color: '#06b6d4',
    glow: 'rgba(6,182,212,0.3)',
    questions: [
      { id: 'a1', q: 'Do you know who your ideal customer is?', options: ['Very specific persona', 'Broad idea', 'Not really sure'] },
      { id: 'a2', q: 'Do you reply to comments and DMs consistently?', options: ['Always', 'Sometimes', 'Rarely', 'Never'] },
      { id: 'a3', q: 'Are you building an email or SMS list?', options: ['Yes, actively growing', 'Have a small list', 'Not collecting contacts'] },
      { id: 'a4', q: 'Do you collaborate with other creators or brands?', options: ['Regularly', 'Occasionally', 'Never'] },
    ],
  },
  {
    id: 'growth',
    title: 'Growth & Conversion',
    icon: TrendingUp,
    color: '#f97316',
    glow: 'rgba(249,115,22,0.3)',
    questions: [
      { id: 'g1', q: 'Do you track analytics (views, clicks, conversions)?', options: ['Yes, weekly review', 'Glance occasionally', 'Never check'] },
      { id: 'g2', q: 'Do you have a clear call-to-action in your posts?', options: ['Every post has a CTA', 'Sometimes', 'Rarely / never'] },
      { id: 'g3', q: 'Are you running any paid ads?', options: ['Meta / Google ads running', 'Boosted a few posts', 'No paid advertising'] },
      { id: 'g4', q: 'Do you have a website or landing page?', options: ['Professional website', 'Basic landing page', 'Link-in-bio only', 'No web presence'] },
    ],
  },
]

// ── Score ranges for report ─────────────────────────────────────────────────
function getReportLevel(score: number) {
  if (score >= 85) return { label: 'GROWTH CHAMPION', emoji: '🏆', color: '#fbbf24', desc: 'You\'re crushing it! Minor tweaks will take you to the top 1%.' }
  if (score >= 65) return { label: 'GROWTH BUILDER', emoji: '🚀', color: '#f59e0b', desc: 'Strong foundation. Focus on the flagged areas for rapid growth.' }
  if (score >= 45) return { label: 'GROWTH STARTER', emoji: '🌱', color: '#10b981', desc: 'Good start! A few strategic changes will unlock serious momentum.' }
  return { label: 'GROWTH SEED', emoji: '🌰', color: '#06b6d4', desc: 'Huge opportunity ahead! Implement the priority actions to get moving fast.' }
}

function getSectionAdvice(sectionId: string, score: number): string[] {
  const advice: Record<string, Record<string, string[]>> = {
    brand: {
      low: ['Create a simple logo using Canva or hire a designer on Fiverr', 'Pick 2 brand colours and stick to them everywhere', 'Write a one-sentence bio that clearly says what you do and who you help'],
      mid: ['Refine your tagline to be more memorable and benefit-driven', 'Audit all your profiles — ensure colours, fonts, and logos match', 'Add your website URL to every social profile'],
      high: ['Your brand is strong — consider brand guidelines document', 'Explore trademarking your business name', 'A brand refresh video series could boost engagement'],
    },
    content: {
      low: ['Start with 3 posts per week minimum — consistency beats perfection', 'Create 5 Reels/TikToks this week using trending audio', 'Use GET POSTED AI to generate a full month content calendar in one click'],
      mid: ['Increase video content to 60%+ of your posts', 'Batch-create content — film 5 videos in one session', 'Start using a content scheduler to post consistently'],
      high: ['Your content game is solid — double down on what performs best', 'Experiment with longer-form content (YouTube, blog posts)', 'Launch a weekly series to build audience anticipation'],
    },
    audience: {
      low: ['Define your ideal customer — age, interests, pain points, platform', 'Reply to EVERY comment for the next 7 days', 'Add a lead magnet (free guide, checklist, discount) to collect emails'],
      mid: ['Create a customer survey to learn what your audience wants', 'Join 3 communities where your ideal customers hang out', 'Start a newsletter or weekly update for your list'],
      high: ['Launch a referral or affiliate programme', 'Host a live Q&A or webinar to deepen connections', 'Collaborate with a complementary brand for cross-promotion'],
    },
    growth: {
      low: ['Set up Google Analytics and Meta Pixel on your website', 'Add a clear CTA to every post: "Link in bio", "DM me", "Shop now"', 'Run a small Meta ad test (£5/day for 5 days) to learn what works'],
      mid: ['Review your analytics weekly — double down on top-performing content', 'A/B test different CTAs to see what drives more clicks', 'Set up retargeting ads for website visitors'],
      high: ['Scale your winning ad campaigns', 'Set up automated email sequences for new leads', 'Consider expanding to a new platform where your audience is growing'],
    },
  }
  const level = score >= 70 ? 'high' : score >= 45 ? 'mid' : 'low'
  return advice[sectionId]?.[level] || advice[sectionId]?.mid || ['Focus on improving this area']
}

// ── Component ───────────────────────────────────────────────────────────────
export default function Audit() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0) // 0 = intro, 1-4 = sections, 5 = results
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [sectionScores, setSectionScores] = useState<Record<string, number>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)

  // Calculate section score from answers
  const calcSectionScore = (sectionIdx: number) => {
    const section = AUDIT_SECTIONS[sectionIdx]
    const sectionAnswers = section.questions.map(q => answers[q.id]).filter(Boolean)
    if (sectionAnswers.length === 0) return 0
    // Best answer = highest index, so normalize
    let total = 0
    section.questions.forEach(q => {
      const ans = answers[q.id]
      const idx = q.options.indexOf(ans)
      total += Math.max(0, ((q.options.length - 1 - idx) / (q.options.length - 1)) * 25)
    })
    return Math.round(total)
  }

  const totalScore = Object.values(sectionScores).reduce((a, b) => a + b, 0)
  const report = getReportLevel(totalScore)

  const handleAnswer = (answer: string) => {
    const section = AUDIT_SECTIONS[step - 1]
    const q = section.questions[currentQuestion]
    const newAnswers = { ...answers, [q.id]: answer }
    setAnswers(newAnswers)

    // Move to next question or next section
    if (currentQuestion < section.questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 200)
    } else {
      // Section complete — calculate score
      const score = calcSectionScore(step - 1)
      setSectionScores(prev => ({ ...prev, [section.id]: score }))
      setTimeout(() => {
        if (step < 4) {
          setStep(step + 1)
          setCurrentQuestion(0)
        } else {
          setStep(5)
        }
      }, 400)
    }
  }

  // ── Intro Screen ─────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4" style={{ background: '#0a0a0a' }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
              <Sparkles className="w-4 h-4" />
              FREE Business Audit
            </div>

            <h1 className="font-bangers text-5xl md:text-7xl tracking-wider mb-4"
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #10b981, #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 30px rgba(251,191,36,0.3))',
              }}>
              GROWTH DYNAMO
            </h1>
            <p className="text-[#888888] text-lg mb-10 max-w-xl mx-auto">
              Answer 16 quick questions across 4 key areas. Get a personalised growth report with actionable recommendations for your business.
            </p>

            {/* Score preview circles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-2xl mx-auto">
              {AUDIT_SECTIONS.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${s.glow}`,
                  }}
                >
                  <s.icon className="w-6 h-6 mb-2" style={{ color: s.color }} />
                  <p className="text-xs text-[#888888]">{s.title}</p>
                  <p className="text-lg font-bold" style={{ color: s.color }}>/{s.questions.length}</p>
                </motion.div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setStep(1); setCurrentQuestion(0) }}
              className="btn-primary text-lg py-4 px-10"
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #10b981)',
                boxShadow: '0 0 40px rgba(251,191,36,0.3)',
              }}
            >
              <Zap className="w-5 h-5 inline mr-2" />
              Start My Audit
              <ChevronRight className="w-5 h-5 inline ml-2" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    )
  }

  // ── Results Screen ───────────────────────────────────────────────────────
  if (step === 5) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4" style={{ background: '#0a0a0a' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Score Header */}
            <div className="text-center mb-10">
              <motion.div
                className="inline-flex items-center justify-center w-32 h-32 rounded-full mb-4"
                style={{
                  background: `conic-gradient(${report.color} ${totalScore * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 100 }}
              >
                <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: '#0a0a0a' }}>
                  <span className="font-bangers text-4xl" style={{ color: report.color }}>{totalScore}</span>
                </div>
              </motion.div>
              <h2 className="font-bangers text-4xl tracking-wider mb-2" style={{ color: report.color }}>
                {report.emoji} {report.label}
              </h2>
              <p className="text-[#888888] max-w-lg mx-auto">{report.desc}</p>
            </div>

            {/* Section Breakdown */}
            <div className="grid gap-4 mb-10">
              {AUDIT_SECTIONS.map((s, i) => {
                const score = sectionScores[s.id] || 0
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.glow}` }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <s.icon className="w-5 h-5" style={{ color: s.color }} />
                        <span className="font-medium">{s.title}</span>
                      </div>
                      <span className="font-bangers text-xl" style={{ color: s.color }}>{score}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${s.color}, ${s.color}88)` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                      />
                    </div>

                    {/* Advice */}
                    <div className="mt-3 space-y-1">
                      {getSectionAdvice(s.id, score).map((tip, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-[#aaaaaa]">
                          <Target className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: s.color }} />
                          {tip}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setStep(0); setAnswers({}); setSectionScores({}); setCurrentQuestion(0) }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#cccccc' }}
              >
                <RefreshCw className="w-4 h-4" />
                Retake Audit
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/studio')}
                className="btn-primary flex items-center gap-2 px-6 py-3"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24, #10b981)',
                  boxShadow: '0 0 30px rgba(251,191,36,0.2)',
                }}
              >
                <Sparkles className="w-4 h-4" />
                Go to Studio
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // ── Question Screen ──────────────────────────────────────────────────────
  const section = AUDIT_SECTIONS[step - 1]
  const question = section.questions[currentQuestion]
  const progress = ((step - 1) * 4 + currentQuestion) / 16 * 100

  return (
    <div className="min-h-screen pt-20 pb-12 px-4" style={{ background: '#0a0a0a' }}>
      <div className="max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => step > 1 ? setStep(step - 1) : setStep(0)} className="text-[#888888] hover:text-white flex items-center gap-1 text-sm">
              <ArrowLeft className="w-4 h-4" />
              {step === 1 && currentQuestion === 0 ? 'Back' : 'Prev'}
            </button>
            <span className="text-xs text-[#888888]">Question {(step - 1) * 4 + currentQuestion + 1} of 16</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${section.color}, ${section.color}66)` }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {/* Section tabs */}
          <div className="flex gap-2 mt-3">
            {AUDIT_SECTIONS.map((s, i) => (
              <div key={s.id} className="flex-1 h-1 rounded-full"
                style={{
                  background: i < step - 1 ? s.color : i === step - 1 ? s.glow : 'rgba(255,255,255,0.05)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${section.id}-${currentQuestion}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            {/* Section badge */}
            <div className="flex items-center gap-2 mb-4">
              <section.icon className="w-5 h-5" style={{ color: section.color }} />
              <span className="text-sm font-medium" style={{ color: section.color }}>{section.title}</span>
              <span className="text-xs text-[#888888]">— {currentQuestion + 1}/{section.questions.length}</span>
            </div>

            <h2 className="text-xl md:text-2xl font-medium mb-8 leading-snug">
              {question.q}
            </h2>

            <div className="space-y-3">
              {question.options.map((opt, idx) => {
                const isSelected = answers[question.id] === opt
                return (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(opt)}
                    className="w-full text-left p-4 rounded-xl flex items-center gap-3 transition-all"
                    style={{
                      background: isSelected ? `${section.color}15` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSelected ? section.color + '60' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: section.color }} />
                    ) : (
                      <Circle className="w-5 h-5 shrink-0 text-[#555555]" />
                    )}
                    <span className={isSelected ? 'text-white' : 'text-[#cccccc]'}>{opt}</span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
