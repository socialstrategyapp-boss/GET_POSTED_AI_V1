import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Sparkles,
  User,
  BarChart3,
  Check,
  Instagram,
  Youtube,
  Twitter,
  Globe,
  Trash2,
  Loader2,
  ChevronDown,
  Moon,
  Sun,
  X,
  AlertTriangle,
  Upload,
  Camera,
  Phone,
  Mail,
  MapPin,
  Building2,
  Tag,
  Link,
} from 'lucide-react'
import { useProfile, useAuth, useContentItems } from '@/hooks/useSupabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number]

const industries = [
  'Fashion',
  'Food & Beverage',
  'Technology',
  'Fitness',
  'Beauty',
  'Travel',
  'Entertainment',
  'Education',
  'Finance',
  'Other',
]

const brandVoices = ['Playful', 'Professional', 'Bold', 'Friendly', 'Custom']

const tabList = [
  { key: 'brand', label: 'Brand Identity' },
  { key: 'account', label: 'Account' },
  { key: 'usage', label: 'Usage Analytics' },
]

const PROFILE_KEY = 'gp_profile'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    startRef.current = display
    startTimeRef.current = null
    let raf: number

    const step = (ts: number) => {
      if (startTimeRef.current === null) startTimeRef.current = ts
      const elapsed = ts - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(startRef.current + (value - startRef.current) * eased))
      if (progress < 1) raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return <>{display}</>
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/* ------------------------------------------------------------------ */
/*  Brand Tab  --  Rich Profile Form                                   */
/* ------------------------------------------------------------------ */

function BrandTab() {
  const { profile, updateProfile, saving } = useProfile()
  const [form, setForm] = useState<Record<string, string>>({
    business_name: '',
    company_name: '',
    website_url: '',
    phone: '',
    email: '',
    address: '',
    target_area: '',
    industry: '',
    brand_voice: '',
    custom_brand_voice: '',
    about_business: '',
    logo_url: '',
    brand_color_primary: '#ff0099',
    brand_color_secondary: '#00ccff',
    social_instagram: '',
    social_tiktok: '',
    social_youtube: '',
    social_twitter: '',
  })
  const [businessPhotos, setBusinessPhotos] = useState<string[]>([])
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle')
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)
  const [logoDragging, setLogoDragging] = useState(false)
  const [photosDragging, setPhotosDragging] = useState(false)
  const industryRef = useRef<HTMLDivElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const photosInputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Load profile data */
  useEffect(() => {
    if (profile) {
      const p = profile as Record<string, string | string[]>
      setForm({
        business_name: (p.business_name as string) || '',
        company_name: (p.company_name as string) || '',
        website_url: (p.website_url as string) || (p.website as string) || '',
        phone: (p.phone as string) || '',
        email: (p.email as string) || '',
        address: (p.address as string) || '',
        target_area: (p.target_area as string) || '',
        industry: (p.industry as string) || '',
        brand_voice: (p.brand_voice as string) || '',
        custom_brand_voice: (p.custom_brand_voice as string) || '',
        about_business: (p.about_business as string) || '',
        logo_url: (p.logo_url as string) || '',
        brand_color_primary: (p.brand_color_primary as string) || '#ff0099',
        brand_color_secondary: (p.brand_color_secondary as string) || '#00ccff',
        social_instagram: (p.social_instagram as string) || '',
        social_tiktok: (p.social_tiktok as string) || '',
        social_youtube: (p.social_youtube as string) || '',
        social_twitter: (p.social_twitter as string) || '',
      })
      setBusinessPhotos(
        Array.isArray(p.business_photos) ? p.business_photos : []
      )
    }
  }, [profile])

  /* Close industry dropdown on outside click */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        industryRef.current &&
        !industryRef.current.contains(e.target as Node)
      ) {
        setShowIndustryDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  /* Debounced auto-save to localStorage + Supabase */
  const triggerAutoSave = useCallback(
    (nextForm: Record<string, string>, nextPhotos: string[]) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(async () => {
        const payload = {
          ...nextForm,
          business_photos: nextPhotos,
          brand_description: nextForm.about_business,
        }
        try {
          localStorage.setItem(PROFILE_KEY, JSON.stringify(payload))
        } catch {
          /* ignore quota errors */
        }
        const success = await updateProfile(payload)
        if (success) {
          setSaveState('saved')
          setTimeout(() => setSaveState('idle'), 2000)
        }
      }, 500)
    },
    [updateProfile]
  )

  const updateField = useCallback(
    (field: string, value: string) => {
      setForm((prev) => {
        const next = { ...prev, [field]: value }
        triggerAutoSave(next, businessPhotos)
        return next
      })
    },
    [businessPhotos, triggerAutoSave]
  )

  const updatePhotos = useCallback(
    (photos: string[]) => {
      setBusinessPhotos(photos)
      triggerAutoSave(form, photos)
    },
    [form, triggerAutoSave]
  )

  /* ---- Logo Upload ---- */
  const handleLogoSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    try {
      const base64 = await readFileAsBase64(file)
      setForm((prev) => {
        const next = { ...prev, logo_url: base64 }
        triggerAutoSave(next, businessPhotos)
        return next
      })
    } catch {
      toast.error('Failed to read image')
    }
  }

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setLogoDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleLogoSelect(file)
  }

  /* ---- Business Photos Upload ---- */
  const handlePhotoSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    try {
      const base64 = await readFileAsBase64(file)
      const nextPhotos = [...businessPhotos, base64]
      updatePhotos(nextPhotos)
    } catch {
      toast.error('Failed to read image')
    }
  }

  const handlePhotosDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setPhotosDragging(false)
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/')
    )
    files.forEach((f) => handlePhotoSelect(f))
  }

  const removePhoto = (index: number) => {
    const next = businessPhotos.filter((_, i) => i !== index)
    updatePhotos(next)
  }

  const showCustomVoice =
    form.brand_voice === 'Custom' || (form.custom_brand_voice?.length ?? 0) > 0

  /* Section header gradient style */
  const sectionHeaderStyle: React.CSSProperties = {
    fontFamily: "'Bangers', cursive",
    fontSize: '16px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    background: 'linear-gradient(90deg, #ff0099, #00ccff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      {/* ========== Business Details ========== */}
      <div
        style={{
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: '#0a0a0a',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Building2 size={18} style={{ color: '#ff0099' }} />
          <span style={sectionHeaderStyle}>BUSINESS DETAILS</span>
          <div style={{ flex: 1 }} />
          {saveState === 'saved' && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{ fontSize: '12px', color: '#00ff88', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Check size={12} /> Saved
            </motion.span>
          )}
          {saving && (
            <span style={{ fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Loader2 size={12} className="animate-spin" /> Saving...
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Business Name */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cccccc', marginBottom: '6px' }}>
              Business Name
            </label>
            <Input
              value={form.business_name}
              onChange={(e) => updateField('business_name', e.target.value)}
              placeholder="Your business name"
              className="bg-[#111] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#444] focus:border-[#ff0099] focus-visible:ring-[rgba(255,0,153,0.15)]"
            />
          </div>

          {/* Company / Brand Name */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cccccc', marginBottom: '6px' }}>
              Company / Brand Name <span style={{ color: '#555' }}>(if different)</span>
            </label>
            <Input
              value={form.company_name}
              onChange={(e) => updateField('company_name', e.target.value)}
              placeholder="Your company or brand name"
              className="bg-[#111] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#444] focus:border-[#ff0099] focus-visible:ring-[rgba(255,0,153,0.15)]"
            />
          </div>

          {/* Website URL */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cccccc', marginBottom: '6px' }}>
              Website URL <span style={{ color: '#555' }}>(optional)</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#555] z-10" />
              <Input
                value={form.website_url}
                onChange={(e) => updateField('website_url', e.target.value)}
                placeholder="https://yourbusiness.com"
                className="pl-10 bg-[#111] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#444] focus:border-[#ff0099] focus-visible:ring-[rgba(255,0,153,0.15)]"
              />
            </div>
          </div>

          {/* Phone + Email (2-col on larger screens) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cccccc', marginBottom: '6px' }}>
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#555] z-10" />
                <Input
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+1 234 567 890"
                  className="pl-10 bg-[#111] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#444] focus:border-[#ff0099] focus-visible:ring-[rgba(255,0,153,0.15)]"
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cccccc', marginBottom: '6px' }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#555] z-10" />
                <Input
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="hello@yourbusiness.com"
                  className="pl-10 bg-[#111] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#444] focus:border-[#ff0099] focus-visible:ring-[rgba(255,0,153,0.15)]"
                />
              </div>
            </div>
          </div>

          {/* Business Address */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cccccc', marginBottom: '6px' }}>
              Business Address
            </label>
            <Textarea
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Street, City, State, Postcode"
              rows={3}
              className="bg-[#111] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#444] focus:border-[#ff0099] focus-visible:ring-[rgba(255,0,153,0.15)] resize-none"
            />
          </div>

          {/* Target Area / Market */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cccccc', marginBottom: '6px' }}>
              Target Area / Market
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#555] z-10" />
              <Input
                value={form.target_area}
                onChange={(e) => updateField('target_area', e.target.value)}
                placeholder="e.g. Melbourne, Australia"
                className="pl-10 bg-[#111] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#444] focus:border-[#ff0099] focus-visible:ring-[rgba(255,0,153,0.15)]"
              />
            </div>
          </div>

          {/* Industry Dropdown */}
          <div className="relative" ref={industryRef}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cccccc', marginBottom: '6px' }}>
              Industry
            </label>
            <button
              onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#111',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '14px',
                textAlign: 'left',
                color: form.industry ? '#fff' : '#444',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
            >
              <span>{form.industry || 'Select industry'}</span>
              <ChevronDown size={16} style={{ color: '#555' }} />
            </button>
            <AnimatePresence>
              {showIndustryDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: '#0a0a0a',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    zIndex: 20,
                    overflow: 'hidden',
                  }}
                >
                  {industries.map((ind) => (
                    <button
                      key={ind}
                      onClick={() => {
                        updateField('industry', ind)
                        setShowIndustryDropdown(false)
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        fontSize: '13px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                        background:
                          form.industry === ind
                            ? 'rgba(255,0,153,0.08)'
                            : 'transparent',
                        color:
                          form.industry === ind ? '#ff0099' : '#cccccc',
                        border: 'none',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = '#1a1a1a')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          form.industry === ind
                            ? 'rgba(255,0,153,0.08)'
                            : 'transparent')
                      }
                    >
                      {ind}
                      {form.industry === ind && <Check size={14} />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ========== Brand Identity ========== */}
      <div
        style={{
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: '#0a0a0a',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Sparkles size={18} style={{ color: '#00ccff' }} />
          <span style={sectionHeaderStyle}>BRAND IDENTITY</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Brand Voice Chips */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cccccc', marginBottom: '10px' }}>
              Brand Voice
            </label>
            <div className="flex flex-wrap gap-2">
              {brandVoices.map((voice) => {
                const active = form.brand_voice === voice
                return (
                  <button
                    key={voice}
                    onClick={() => updateField('brand_voice', voice)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: active
                        ? '1px solid #ff0099'
                        : '1px solid rgba(255,255,255,0.1)',
                      background: active
                        ? 'rgba(255,0,153,0.1)'
                        : '#111',
                      color: active ? '#ff0099' : '#888',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {active ? (
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          background:
                            'linear-gradient(135deg, #ff0099, #00ccff)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={10} style={{ color: '#000' }} />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          border: '1px solid rgba(255,255,255,0.2)',
                        }}
                      />
                    )}
                    {voice}
                  </button>
                )
              })}
            </div>

            <AnimatePresence>
              {showCustomVoice && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <Textarea
                    value={form.custom_brand_voice}
                    onChange={(e) =>
                      updateField('custom_brand_voice', e.target.value)
                    }
                    placeholder="Describe your custom brand voice..."
                    rows={3}
                    className="mt-3 bg-[#111] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#444] focus:border-[#ff0099] focus-visible:ring-[rgba(255,0,153,0.15)] resize-none"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Brand Colors */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cccccc', marginBottom: '10px' }}>
              Brand Colors <span style={{ color: '#555' }}>(optional)</span>
            </label>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="color"
                  value={form.brand_color_primary}
                  onChange={(e) =>
                    updateField('brand_color_primary', e.target.value)
                  }
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    background: 'transparent',
                    padding: 0,
                  }}
                />
                <div>
                  <p style={{ fontSize: '11px', color: '#888' }}>Primary</p>
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#fff',
                      fontFamily: 'monospace',
                      textTransform: 'uppercase',
                    }}
                  >
                    {form.brand_color_primary}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="color"
                  value={form.brand_color_secondary}
                  onChange={(e) =>
                    updateField('brand_color_secondary', e.target.value)
                  }
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    background: 'transparent',
                    padding: 0,
                  }}
                />
                <div>
                  <p style={{ fontSize: '11px', color: '#888' }}>Secondary</p>
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#fff',
                      fontFamily: 'monospace',
                      textTransform: 'uppercase',
                    }}
                  >
                    {form.brand_color_secondary}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== About Your Business ========== */}
      <div
        style={{
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: '#0a0a0a',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Tag size={18} style={{ color: '#ff0099' }} />
          <span style={sectionHeaderStyle}>ABOUT YOUR BUSINESS</span>
          <span style={{ fontSize: '11px', color: '#ff0099', background: 'rgba(255,0,153,0.1)', padding: '2px 8px', borderRadius: '4px', marginLeft: '4px' }}>
            GPT uses this for every response
          </span>
        </div>

        <Textarea
          value={form.about_business}
          onChange={(e) => updateField('about_business', e.target.value)}
          placeholder={
            'Tell us as much as possible about your business \u2014 what you sell, your story, your goals, who your customers are, what makes you different... The more detail, the better Get Posted AI can help you.'
          }
          rows={6}
          className="bg-[#111] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#444] focus:border-[#ff0099] focus-visible:ring-[rgba(255,0,153,0.15)] resize-none text-[14px] leading-relaxed"
        />
        <p style={{ fontSize: '11px', color: '#555', marginTop: '8px' }}>
          Example: &ldquo;We&rsquo;re a family-run bakery in Melbourne specialising in vegan donuts. Our customers are 18-35 health-conscious millennials. We want to grow our Instagram to drive foot traffic.&rdquo;
        </p>
      </div>

      {/* ========== Logo Upload ========== */}
      <div
        style={{
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: '#0a0a0a',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Camera size={18} style={{ color: '#00ccff' }} />
          <span style={sectionHeaderStyle}>LOGO</span>
        </div>

        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleLogoSelect(file)
            e.currentTarget.value = ''
          }}
          style={{ display: 'none' }}
        />

        {form.logo_url ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={form.logo_url}
              alt="Logo preview"
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'contain',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: '#111',
                padding: '8px',
              }}
            />
            <button
              onClick={() => {
                setForm((prev) => {
                  const next = { ...prev, logo_url: '' }
                  triggerAutoSave(next, businessPhotos)
                  return next
                })
              }}
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#ff3366',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
              }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div
            onClick={() => logoInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setLogoDragging(true)
            }}
            onDragLeave={() => setLogoDragging(false)}
            onDrop={handleLogoDrop}
            style={{
              border: logoDragging
                ? '2px dashed #ff0099'
                : '2px dashed rgba(255,255,255,0.15)',
              borderRadius: '12px',
              padding: '40px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: logoDragging
                ? 'rgba(255,0,153,0.05)'
                : 'transparent',
            }}
          >
            <Upload
              size={32}
              style={{
                color: logoDragging ? '#ff0099' : '#555',
                margin: '0 auto 12px',
                transition: 'color 0.2s',
              }}
            />
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '4px' }}>
              <span style={{ color: '#ff0099', fontWeight: 500 }}>Click to upload</span> or drag and drop
            </p>
            <p style={{ fontSize: '12px', color: '#555' }}>
              SVG, PNG, JPG (max 5MB)
            </p>
          </div>
        )}
      </div>

      {/* ========== Business Photos ========== */}
      <div
        style={{
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: '#0a0a0a',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Camera size={18} style={{ color: '#ff0099' }} />
          <span style={sectionHeaderStyle}>BUSINESS PHOTOS</span>
        </div>

        <input
          ref={photosInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || [])
            files.forEach((f) => handlePhotoSelect(f))
            e.currentTarget.value = ''
          }}
          style={{ display: 'none' }}
        />

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setPhotosDragging(true)
          }}
          onDragLeave={() => setPhotosDragging(false)}
          onDrop={handlePhotosDrop}
          style={{
            border: photosDragging
              ? '2px dashed #ff0099'
              : '2px dashed rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '16px',
            transition: 'all 0.2s',
            background: photosDragging
              ? 'rgba(255,0,153,0.05)'
              : 'transparent',
          }}
        >
          {/* Photo grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '12px',
            }}
          >
            {/* Add more button */}
            <button
              onClick={() => photosInputRef.current?.click()}
              style={{
                aspectRatio: '1',
                borderRadius: '10px',
                border: '2px dashed rgba(255,255,255,0.15)',
                background: '#111',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                color: '#888',
                minHeight: '100px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,0,153,0.4)'
                e.currentTarget.style.color = '#ff0099'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                e.currentTarget.style.color = '#888'
              }}
            >
              <Upload size={20} />
              <span style={{ fontSize: '11px', fontWeight: 500 }}>Add Photos</span>
            </button>

            {/* Thumbnails */}
            {businessPhotos.map((photo, index) => (
              <div
                key={index}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.08)',
                  minHeight: '100px',
                }}
              >
                <img
                  src={photo}
                  alt={`Business photo ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <button
                  onClick={() => removePhoto(index)}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.7)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    padding: 0,
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          {businessPhotos.length === 0 && (
            <p
              style={{
                textAlign: 'center',
                fontSize: '12px',
                color: '#555',
                marginTop: '12px',
              }}
            >
              Drag and drop photos here or click &ldquo;Add Photos&rdquo; to browse
            </p>
          )}
        </div>
      </div>

      {/* ========== Social Media Links ========== */}
      <div
        style={{
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: '#0a0a0a',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Link size={18} style={{ color: '#00ccff' }} />
          <span style={sectionHeaderStyle}>SOCIAL MEDIA</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#555] z-10" />
            <Input
              value={form.social_instagram}
              onChange={(e) =>
                updateField('social_instagram', e.target.value)
              }
              placeholder="@username"
              className="pl-10 bg-[#111] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#444] focus:border-[#ff0099]"
            />
          </div>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#555] z-10" />
            <Input
              value={form.social_tiktok}
              onChange={(e) =>
                updateField('social_tiktok', e.target.value)
              }
              placeholder="@username"
              className="pl-10 bg-[#111] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#444] focus:border-[#ff0099]"
            />
          </div>
          <div className="relative">
            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#555] z-10" />
            <Input
              value={form.social_youtube}
              onChange={(e) =>
                updateField('social_youtube', e.target.value)
              }
              placeholder="Channel URL"
              className="pl-10 bg-[#111] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#444] focus:border-[#ff0099]"
            />
          </div>
          <div className="relative">
            <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#555] z-10" />
            <Input
              value={form.social_twitter}
              onChange={(e) =>
                updateField('social_twitter', e.target.value)
              }
              placeholder="@username"
              className="pl-10 bg-[#111] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#444] focus:border-[#ff0099]"
            />
          </div>
        </div>
      </div>

      {/* Saved indicator footer */}
      <AnimatePresence>
        {saveState === 'saved' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: '#0a0a0a',
              border: '1px solid rgba(0,255,136,0.3)',
              borderRadius: '10px',
              color: '#00ff88',
              fontSize: '13px',
              fontWeight: 500,
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              zIndex: 100,
            }}
          >
            <Check size={16} />
            All changes saved
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Account Tab                                                        */
/* ------------------------------------------------------------------ */

function AccountTab() {
  const { user } = useAuth()
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') return
    toast.info('Account deletion request submitted')
    setDeleteDialogOpen(false)
    setConfirmText('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0a0a0a] p-6 md:p-8">
        <div className="flex items-center gap-2 mb-6">
          <User className="size-[18px] text-[#00ccff]" />
          <h3 className="font-['Bangers'] text-lg tracking-wide uppercase text-white">
            ACCOUNT
          </h3>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-[12px] text-[#888] mb-1">
              Email Address
            </label>
            <p className="text-white text-[15px]">{user?.email || '—'}</p>
          </div>

          <div>
            <label className="block text-[12px] text-[#888] mb-1">
              Sign-in Method
            </label>
            <p className="text-white text-[15px]">Magic Link</p>
          </div>

          <div>
            <label className="block text-[12px] text-[#888] mb-1">
              Member Since
            </label>
            <p className="text-white text-[15px]">
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="size-4 text-[#888]" />
              ) : (
                <Sun className="size-4 text-[#888]" />
              )}
              <div>
                <p className="text-[13px] text-white font-medium">Theme</p>
                <p className="text-[11px] text-[#888]">
                  {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                </p>
              </div>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0a0a0a] p-6 md:p-8">
        <h3 className="font-['Bangers'] text-lg tracking-wide uppercase text-white mb-6">
          NOTIFICATIONS
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-white font-medium">
                Email Notifications
              </p>
              <p className="text-[11px] text-[#888]">
                Receive updates about your content
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[rgba(255,255,255,0.06)]">
            <div>
              <p className="text-[13px] text-white font-medium">
                Push Notifications
              </p>
              <p className="text-[11px] text-[#888]">
                Browser notifications for new content
              </p>
            </div>
            <Switch
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(255,51,102,0.2)] bg-[#0a0a0a] p-6 md:p-8">
        <h3 className="font-['Bangers'] text-lg tracking-wide uppercase text-[#ff3366] mb-4">
          DANGER ZONE
        </h3>
        <p className="text-[13px] text-[#888] mb-4">
          Permanently delete your account and all associated data. This cannot
          be undone.
        </p>
        <Button
          variant="outline"
          onClick={() => setDeleteDialogOpen(true)}
          className="border-[#ff3366] text-[#ff3366] bg-transparent hover:bg-[rgba(255,51,102,0.1)] hover:text-[#ff3366]"
        >
          <Trash2 className="size-4 mr-2" />
          Delete Account
        </Button>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#0a0a0a] border border-[rgba(255,51,102,0.3)] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Bangers'] text-xl tracking-wide uppercase text-[#ff3366] flex items-center gap-2">
              <AlertTriangle className="size-5" />
              Are you absolutely sure?
            </DialogTitle>
            <DialogDescription className="text-[#888]">
              This action cannot be undone. This will permanently delete your
              account and all your content. Type{' '}
              <span className="text-white font-mono">DELETE</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="bg-[#111] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#555] focus:border-[#ff3366] focus-visible:ring-[rgba(255,51,102,0.15)]"
            />
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteDialogOpen(false)
                setConfirmText('')
              }}
              className="text-[#cccccc] hover:text-white"
            >
              <X className="size-3.5 mr-1" />
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={confirmText !== 'DELETE'}
              onClick={handleDeleteAccount}
              className="bg-[#ff3366] hover:bg-[#ff3366]/80 text-white disabled:opacity-30"
            >
              <Trash2 className="size-3.5 mr-1" />
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Usage Analytics Tab                                                */
/* ------------------------------------------------------------------ */

function UsageTab() {
  const { items } = useContentItems()

  const stats = useMemo(() => {
    const total = items.length
    const videos = items.filter((i) => i.content_type === 'video').length
    const images = items.filter((i) => i.thumbnail_url).length
    const captions = items.filter((i) => i.content_type === 'caption').length
    const scripts = items.filter((i) => i.content_type === 'script').length
    const ideas = items.filter((i) => i.content_type === 'idea').length

    const now = new Date()
    const thisMonth = items.filter((i) => {
      const d = new Date(i.created_at)
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      )
    }).length

    return { total, videos, images, captions, scripts, ideas, thisMonth }
  }, [items])

  const statCards = [
    {
      label: 'Total Content',
      value: stats.total,
      gradient: true as const,
    },
    { label: 'Videos', value: stats.videos, color: '#aa66ff' },
    { label: 'This Month', value: stats.thisMonth, color: '#00ccff' },
  ]

  const breakdown = [
    {
      label: 'Videos',
      value: stats.videos,
      color: '#aa66ff',
      max: Math.max(stats.total, 1),
    },
    {
      label: 'Images',
      value: stats.images,
      color: '#00ccff',
      max: Math.max(stats.total, 1),
    },
    {
      label: 'Captions',
      value: stats.captions,
      color: '#ff0099',
      max: Math.max(stats.total, 1),
    },
    {
      label: 'Scripts',
      value: stats.scripts,
      color: '#00ff88',
      max: Math.max(stats.total, 1),
    },
    {
      label: 'Ideas',
      value: stats.ideas,
      color: '#ffaa00',
      max: Math.max(stats.total, 1),
    },
  ]

  const planFeatures = [
    'Unlimited AI chat',
    'Unlimited video previews',
    'Advanced brand profiles',
    'Content gallery + history',
    'Priority generation',
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0a0a0a] p-6 md:p-8">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="size-[18px] text-[#00ccff]" />
          <h3 className="font-['Bangers'] text-lg tracking-wide uppercase text-white">
            USAGE THIS MONTH
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.4,
                delay: i * 0.1,
                ease: easeOutExpo,
              }}
              className="bg-[#111] rounded-xl p-5"
            >
              <p
                className={cn(
                  'font-["Bangers"] text-[32px] leading-none',
                  stat.gradient
                    ? 'bg-gradient-to-r from-[#ff0099] to-[#00ccff] bg-clip-text text-transparent'
                    : ''
                )}
                style={
                  stat.color
                    ? ({ color: stat.color } as React.CSSProperties)
                    : undefined
                }
              >
                <AnimatedNumber value={stat.value} />
              </p>
              <p className="text-[12px] text-[#888] mt-1.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)]">
          <h4 className="text-[12px] text-[#888] uppercase tracking-wider mb-4">
            Content Type Breakdown
          </h4>
          <div className="space-y-3">
            {breakdown.map((b) => (
              <div key={b.label} className="flex items-center gap-3">
                <span className="text-[12px] text-[#cccccc] w-16 shrink-0">
                  {b.label}
                </span>
                <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.round((b.value / b.max) * 100)}%`,
                    }}
                    transition={{
                      duration: 0.8,
                      ease: easeOutExpo,
                      delay: 0.2,
                    }}
                    className="h-full rounded-full"
                    style={{ background: b.color }}
                  />
                </div>
                <span className="text-[12px] text-[#888] w-8 text-right font-mono">
                  {b.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: easeOutExpo }}
        className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0a0a0a] p-6 md:p-8"
      >
        <h3 className="font-['Bangers'] text-lg tracking-wide uppercase text-white mb-4">
          YOUR PLAN
        </h3>

        <div className="flex items-center gap-3 mb-4">
          <span className="font-['Bangers'] text-[28px] bg-gradient-to-r from-[#ff0099] to-[#00ccff] bg-clip-text text-transparent leading-none">
            Pro
          </span>
          <span
            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
            style={{
              background: 'rgba(0,255,136,0.1)',
              color: '#00ff88',
              border: '1px solid rgba(0,255,136,0.3)',
            }}
          >
            Active
          </span>
        </div>
        <p className="text-[14px] text-[#888] mb-5">$19/month</p>

        <div className="space-y-2 mb-6">
          {planFeatures.map((feature) => (
            <div key={feature} className="flex items-center gap-2.5">
              <Check className="size-3.5 text-[#00ff88]" />
              <span className="text-[13px] text-[#cccccc]">{feature}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-[rgba(255,255,255,0.15)] bg-transparent text-white hover:bg-[rgba(255,255,255,0.05)] text-[13px]"
          >
            Manage Billing
          </Button>
          <Button className="bg-gradient-to-r from-[#ff0099] to-[#00ccff] text-black font-['Bangers'] uppercase tracking-wider text-[13px] hover:scale-105 transition-transform">
            Upgrade Plan
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Profile Page                                                  */
/* ------------------------------------------------------------------ */

export default function Profile() {
  const [activeTab, setActiveTab] = useState('brand')

  return (
    <div className="min-h-[100dvh] bg-black">
      <div className="max-w-[800px] mx-auto px-6 md:px-10 lg:px-16 py-8 pb-20">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: easeOutExpo }}
            className="font-['Bangers'] text-[28px] md:text-[36px] tracking-wider uppercase bg-gradient-to-r from-[#ff0099] to-[#00ccff] bg-clip-text text-transparent leading-tight"
          >
            BRAND PROFILE
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-[#888] text-[15px] mt-1"
          >
            Manage your brand identity and account settings.
          </motion.p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="mt-8 border-b border-[rgba(255,255,255,0.08)]"
        >
          <div className="flex">
            {tabList.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'relative px-5 py-3 text-[13px] font-medium transition-colors',
                  activeTab === tab.key
                    ? 'text-[#ff0099]'
                    : 'text-[#888] hover:text-[#cccccc]'
                )}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff0099]"
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <div className="mt-8">
          <AnimatePresence mode="wait">
            {activeTab === 'brand' && <BrandTab key="brand" />}
            {activeTab === 'account' && <AccountTab key="account" />}
            {activeTab === 'usage' && <UsageTab key="usage" />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
