import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { startCheckout, type Plan } from '@/hooks/useCheckout'
import {
  Sparkles,
  Video,
  MessageSquare,
  Palette,
  Zap,
  Shield,
  Check,
  Play,
  ChevronDown,
} from 'lucide-react'
import Layout from '@/components/Layout'

/* ═══════════════════════════════════════════
   EASING TOKENS
   ═══════════════════════════════════════════ */
const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number]
const easeOutBack = [0.34, 1.56, 0.64, 1] as [number, number, number, number]

const viewportOnce = { once: true, margin: "-100px" as const }

/* ═══════════════════════════════════════════
   NEON FLOW EFFECT (mouse-tracking gradient)
   ═══════════════════════════════════════════ */
function useNeonFlow(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
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
  }, [ref])
}

/* ═══════════════════════════════════════════
   SECTION 1: NAVIGATION BAR
   ═══════════════════════════════════════════ */
function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: easeOutExpo }}
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center"
      style={{
        background: scrolled ? 'rgba(0, 0, 0, 0.7)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        transition: 'background 0.3s, backdrop-filter 0.3s',
      }}
    >
      <div className="max-w-7xl mx-auto w-full px-6 md:px-10 flex items-center justify-between">
        <Link to="/" className="font-bangers text-xl gradient-text tracking-wider">
          GET POSTED AI
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollTo('features')}
            className="text-sm font-medium text-[#888888] hover:text-white transition-colors duration-200"
          >
            Features
          </button>
          <button
            onClick={() => scrollTo('how-it-works')}
            className="text-sm font-medium text-[#888888] hover:text-white transition-colors duration-200"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollTo('pricing')}
            className="text-sm font-medium text-[#888888] hover:text-white transition-colors duration-200"
          >
            Pricing
          </button>
        </div>
        <Link to="/auth" className="btn-primary text-sm py-2 px-5">
          Get Started Free
        </Link>
      </div>
    </motion.nav>
  )
}

/* ═══════════════════════════════════════════
   SECTION 2: HERO
   ═══════════════════════════════════════════ */
function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null)
  useNeonFlow(heroRef)

  const headlineWords = 'TURN YOUR IDEAS INTO VIRAL CONTENT'.split(' ')

  return (
    <section
      ref={heroRef}
      className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden neon-flow"
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/hero-bg-mesh.png)',
          opacity: 0.4,
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Neon badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: easeOutBack, delay: 0.2 }}
          className="mb-6"
        >
          <span className="neon-badge animate-glow-pulse">
            AI-POWERED CONTENT STUDIO
          </span>
        </motion.div>

        {/* Headline */}
        <h1 className="font-bangers text-5xl md:text-7xl uppercase tracking-[0.1em] leading-none mb-6">
          {headlineWords.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                ease: easeOutExpo,
                delay: 0.4 + i * 0.08,
              }}
              className="inline-block mr-[0.25em] gradient-text"
              style={{
                textShadow: '0 0 40px rgba(255,0,153,0.3), 0 0 80px rgba(0,204,255,0.2)',
              }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOutExpo, delay: 0.8 }}
          className="text-lg md:text-xl text-[#cccccc] max-w-xl mx-auto mb-10 leading-relaxed"
        >
          Create stunning social media posts, videos, and captions with AI. Tell us
          your brand story, and watch the magic happen.
        </motion.p>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOutExpo, delay: 1.0 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/auth"
            className="btn-primary text-lg px-10 py-4 animate-glow-pulse"
          >
            START CREATING
          </Link>
          <button className="btn-secondary flex items-center gap-2">
            <Play className="w-4 h-4" />
            SEE HOW IT WORKS
          </button>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <ChevronDown className="w-6 h-6 text-[#888888] animate-scroll-chevron" />
      </motion.div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   SECTION 3: SOCIAL PROOF BAR
   ═══════════════════════════════════════════ */
function SocialProofBar() {
  const items = [
    'Trusted by 10,000+ creators',
    'Instagram',
    'TikTok',
    'YouTube',
    'X / Twitter',
    'Reels',
    'Shorts',
    'Unlimited content',
  ]

  return (
    <section
      className="relative overflow-hidden py-5"
      style={{
        background: 'rgba(10, 10, 10, 0.9)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex animate-ticker-scroll hover:[animation-play-state:paused]">
        {[...items, ...items, ...items, ...items].map((item, i) => (
          <div
            key={i}
            className="flex-shrink-0 px-8 text-sm font-medium text-[#555555] whitespace-nowrap"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   SECTION 4: FEATURES
   ═══════════════════════════════════════════ */
const features = [
  {
    icon: Sparkles,
    title: 'AI Content Generation',
    description:
      'Describe your idea in plain English. Our AI generates captions, scripts, and visual concepts tailored to your brand voice and audience.',
  },
  {
    icon: Video,
    title: 'Video Preview & Export',
    description:
      'See your content come to life with real-time video preview. Export in any format — Reels, TikTok, Shorts — optimized for every platform.',
  },
  {
    icon: MessageSquare,
    title: 'Conversational Creation',
    description:
      'Chat naturally with your AI creative assistant. Iterate, refine, and perfect your content through a natural back-and-forth conversation.',
  },
  {
    icon: Palette,
    title: 'Brand Voice Memory',
    description:
      'Your AI remembers your brand. Store your business profile, tone preferences, and visual style for consistently on-brand content every time.',
  },
  {
    icon: Zap,
    title: 'Real-Time Collaboration',
    description:
      'Watch your content generate in real-time. See AI thinking, make mid-generation edits, and collaborate with your creative assistant live.',
  },
  {
    icon: Shield,
    title: 'Secure & Persistent',
    description:
      'All your conversations, brand profiles, and content history securely stored in the cloud. Never lose a great idea again.',
  },
]

function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative bg-black py-24 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6, ease: easeOutExpo }}
        >
          <h2 className="font-bangers text-4xl md:text-5xl gradient-text mb-3">
            EVERYTHING YOU NEED TO GET POSTED AI
          </h2>
          <p className="text-lg text-[#888888]">
            One studio. Unlimited content. Zero creative blocks.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              className="neon-card group"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, ease: easeOutExpo, delay: i * 0.1 }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-5 transition-all duration-300"
                style={{
                  background: 'rgba(255, 0, 153, 0.08)',
                  border: '1px solid rgba(255, 0, 153, 0.15)',
                }}
              >
                <feature.icon className="w-8 h-8 text-[#ff0099]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-base text-[#888888] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   SECTION 5: HOW IT WORKS
   ═══════════════════════════════════════════ */
const steps = [
  {
    number: '01',
    title: 'Set Up Your Brand Profile',
    description:
      'Enter your business name, industry, and brand voice. Our onboarding wizard makes it effortless to get started.',
    image: '/feature-ai-brain.png',
  },
  {
    number: '02',
    title: 'Create Through Conversation',
    description:
      'Describe what you want in natural language. Our AI understands context, references your brand, and generates content ideas instantly.',
    image: '/feature-chat-spark.png',
  },
  {
    number: '03',
    title: 'Preview, Export & Share',
    description:
      'Watch your content come alive in the video preview panel. Export in your desired format and post directly to any social platform.',
    image: '/feature-video-wand.png',
  },
]

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative py-24 md:py-32"
      style={{
        background: 'linear-gradient(180deg, #000000, #0a000a, #000000)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6, ease: easeOutExpo }}
        >
          <h2 className="font-bangers text-4xl md:text-5xl gradient-text">
            FROM IDEA TO POSTED IN 3 STEPS
          </h2>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line (desktop only) */}
          <div
            className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2"
            style={{
              background: 'linear-gradient(180deg, #ff0099, #00ccff)',
            }}
          />

          {steps.map((step, i) => (
            <div
              key={i}
              className={`relative flex flex-col lg:flex-row items-center gap-8 lg:gap-16 mb-20 last:mb-0 ${
                i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
              }`}
            >
              {/* Dot on timeline */}
              <div
                className="hidden lg:block absolute left-1/2 top-8 -translate-x-1/2 w-4 h-4 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #ff0099, #00ccff)',
                  boxShadow: '0 0 15px rgba(255, 0, 153, 0.5), 0 0 30px rgba(0, 204, 255, 0.3)',
                }}
              />

              {/* Content side */}
              <motion.div
                className={`flex-1 ${i % 2 === 0 ? 'lg:text-right' : 'lg:text-left'}`}
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.15 }}
              >
                <motion.span
                  className="font-bangers text-6xl md:text-7xl block"
                  style={{ color: '#ff0099', opacity: 0.3 }}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 0.3 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.3, ease: easeOutExpo }}
                >
                  {step.number}
                </motion.span>
                <h3 className="text-2xl font-semibold text-white mt-2 mb-3">
                  {step.title}
                </h3>
                <p className="text-base text-[#888888] leading-relaxed max-w-md mx-auto lg:mx-0">
                  {step.description}
                </p>
              </motion.div>

              {/* Visual side */}
              <motion.div
                className="flex-1 flex justify-center"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.4, ease: easeOutExpo, delay: 0.3 }}
              >
                <img
                  src={step.image}
                  alt={step.title}
                  className="rounded-xl max-w-sm w-full"
                  style={{
                    boxShadow: '0 0 30px rgba(255, 0, 153, 0.1)',
                  }}
                />
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   SECTION 6: SHOWCASE / PREVIEW
   ═══════════════════════════════════════════ */
function ShowcaseSection() {
  return (
    <section className="relative bg-black py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6, ease: easeOutExpo }}
        >
          <h2 className="font-bangers text-4xl md:text-5xl gradient-text mb-3">
            SEE WHAT YOU CAN CREATE
          </h2>
          <p className="text-base text-[#888888]">
            A glimpse into your new content workflow
          </p>
        </motion.div>

        {/* Image with stats overlay */}
        <div className="relative max-w-4xl mx-auto">
          <motion.div
            className="group"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.8, ease: easeOutExpo }}
          >
            <img
              src="/social-preview-mockup.png"
              alt="Social media content preview"
              className="w-full rounded-2xl transition-all duration-400 group-hover:scale-[1.02]"
              style={{
                boxShadow:
                  '0 0 60px rgba(255, 0, 153, 0.1), 0 0 120px rgba(0, 204, 255, 0.05)',
              }}
            />
          </motion.div>

          {/* Floating stats */}
          <motion.div
            className="absolute bottom-6 right-6 rounded-xl px-6 py-4 hidden sm:block"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.3 }}
            style={{
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="space-y-1 text-sm text-[#cccccc]">
              <div>
                <span className="text-[#ff0099] font-bold">10,000+</span> creators
              </div>
              <div>
                <span className="text-[#ff0099] font-bold">50+</span> industries
              </div>
              <div>
                <span className="text-[#ff0099] font-bold">Unlimited</span> content
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   SECTION 7: PRICING
   ═══════════════════════════════════════════ */
const plans = [
  {
    name: 'STARTER',
    price: '$49.99',
    period: '/month AUD',
    featured: false,
    features: [
      '300 credits included/month',
      '6 videos per month (up to 65 seconds)',
      '6 AI images per month',
      '6 social posts/captions',
      'Blog maker (3 posts/month)',
      '1 brand profile',
      'Website scan & brand intelligence',
      'Content gallery & history',
      'Co-pilot (limited)',
      'Email support',
    ],
    cta: 'Get Started',
    ctaStyle: 'secondary' as const,
  },
  {
    name: 'PRO',
    price: '$99.99',
    period: '/month AUD',
    featured: true,
    badge: 'MOST POPULAR',
    features: [
      '1,000 credits included/month',
      'Video every day if you want',
      'Unlimited blog creation',
      '25 AI images per month',
      'Unlimited social posts/captions',
      '3 brand profiles',
      'AI presenter / character builder',
      'Voice cloning — use your own voice',
      'Billboard content ideas wall',
      'Content calendar & scheduling',
      'Priority AI generation',
      'Priority support',
    ],
    cta: 'Start Creating',
    ctaStyle: 'primary' as const,
  },
  {
    name: 'ENTERPRISE',
    price: '$299.99',
    period: '/month AUD',
    featured: false,
    features: [
      '4,000 credits included/month',
      'Everything in Pro',
      'Unlimited blogs + white-label export',
      '100 AI images per month',
      'Up to 5 team members',
      'Unlimited brand profiles',
      'Agency-ready reports & sign-off',
      'API access',
      'Dedicated account manager',
      'Custom onboarding',
    ],
    cta: 'Contact Us',
    ctaStyle: 'secondary' as const,
  },
]

function PricingSection() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handlePlanClick = async (planName: string, ctaText: string) => {
    if (ctaText === 'Contact Us') { window.location.href = 'mailto:hello@getpostedai.com'; return }
    setLoadingPlan(planName)
    try {
      await startCheckout(planName.toLowerCase() as Plan)
    } catch {
      setLoadingPlan(null)
    }
  }

  return (
    <section
      id="pricing"
      className="relative bg-[#0a0a0a] py-24 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6, ease: easeOutExpo }}
        >
          <h2 className="font-bangers text-4xl md:text-5xl gradient-text mb-3">
            SIMPLE PRICING
          </h2>
          <p className="text-base text-[#888888]">
            Start free. Scale when you&apos;re ready.
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              className={`relative rounded-xl p-8 transition-all duration-300 hover:-translate-y-1 ${
                plan.featured
                  ? 'border border-[rgba(255,0,153,0.3)]'
                  : 'border border-white/[0.08]'
              }`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.6, ease: easeOutExpo, delay: 0.15 + i * 0.12 }}
              style={{
                background: '#0a0a0a',
                boxShadow: plan.featured
                  ? '0 0 30px rgba(255, 0, 153, 0.08)'
                  : 'none',
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="neon-badge text-xs">{plan.badge}</span>
                </div>
              )}

              {/* Plan name */}
              <h3
                className={`font-bangers text-xl mb-4 ${
                  plan.featured ? 'gradient-text' : 'text-[#888888]'
                }`}
              >
                {plan.name}
              </h3>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-bold text-white">{plan.price}</span>
                <span className="text-base text-[#888888]">{plan.period}</span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, fi) => (
                  <li key={fi} className="flex items-start gap-3 text-sm text-[#cccccc]">
                    <Check className="w-4 h-4 text-[#00ff88] flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handlePlanClick(plan.name, plan.cta)}
                disabled={loadingPlan === plan.name}
                className={`w-full text-center ${plan.ctaStyle === 'primary' ? 'btn-primary animate-glow-pulse' : 'btn-secondary'}`}
                style={{ opacity: loadingPlan === plan.name ? 0.7 : 1, cursor: loadingPlan === plan.name ? 'not-allowed' : 'pointer' }}
              >
                {loadingPlan === plan.name ? '⏳ Redirecting...' : plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   SECTION 8: CTA FOOTER
   ═══════════════════════════════════════════ */
function CTAFooterSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  useNeonFlow(sectionRef)

  const ctaWords = 'READY TO GET POSTED AI?'.split(' ')

  return (
    <section
      ref={sectionRef}
      className="relative py-32 md:py-40 neon-flow"
      style={{
        background: 'linear-gradient(180deg, #0a0a0a, #000000)',
      }}
    >
      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <h2 className="font-bangers text-4xl md:text-6xl mb-4">
          {ctaWords.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block mr-[0.2em] gradient-text"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.6, ease: easeOutExpo, delay: i * 0.06 }}
            >
              {word}
            </motion.span>
          ))}
        </h2>

        <motion.p
          className="text-lg text-[#888888] max-w-lg mx-auto mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.4 }}
        >
          Join thousands of creators turning ideas into viral content. Start for
          free — no credit card required.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.6 }}
        >
          <Link
            to="/auth"
            className="btn-primary text-lg px-10 py-4 animate-glow-pulse inline-block"
          >
            START CREATING FREE
          </Link>

          <p className="mt-6 text-sm text-[#888888]">
            Already have an account?{' '}
            <Link
              to="/auth"
              className="text-[#00ccff] hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   LANDING PAGE: COMPOSITE
   ═══════════════════════════════════════════ */
export default function Home() {
  return (
    <Layout showNav={false} showFooter={true}>
      <LandingNav />
      <HeroSection />
      <SocialProofBar />
      <FeaturesSection />
      <HowItWorksSection />
      <ShowcaseSection />
      <PricingSection />
      <CTAFooterSection />
    </Layout>
  )
}
