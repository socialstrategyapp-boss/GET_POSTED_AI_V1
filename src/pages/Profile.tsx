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

/* ------------------------------------------------------------------ */
/*  Brand Tab                                                          */
/* ------------------------------------------------------------------ */

function BrandTab() {
  const { profile, updateProfile, saving } = useProfile()
  const [form, setForm] = useState({
    business_name: '',
    industry: '',
    brand_voice: '',
    custom_brand_voice: '',
    brand_description: '',
    brand_color_primary: '#ff0099',
    brand_color_secondary: '#00ccff',
    social_instagram: '',
    social_tiktok: '',
    social_youtube: '',
    social_twitter: '',
  })
  const [isDirty, setIsDirty] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle')
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)
  const industryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (profile) {
      setForm({
        business_name: profile.business_name || '',
        industry: profile.industry || '',
        brand_voice: profile.brand_voice || '',
        custom_brand_voice: profile.custom_brand_voice || '',
        brand_description: profile.brand_description || '',
        brand_color_primary: profile.brand_color_primary || '#ff0099',
        brand_color_secondary: profile.brand_color_secondary || '#00ccff',
        social_instagram: profile.social_instagram || '',
        social_tiktok: profile.social_tiktok || '',
        social_youtube: profile.social_youtube || '',
        social_twitter: profile.social_twitter || '',
      })
      setIsDirty(false)
    }
  }, [profile])

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

  const updateField = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)
    setSaveState('idle')
  }, [])

  const handleSave = async () => {
    const success = await updateProfile(form)
    if (success) {
      setIsDirty(false)
      setSaveState('saved')
      toast.success('Brand profile saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } else {
      toast.error('Failed to save profile')
    }
  }

  const showCustomVoice =
    form.brand_voice === 'Custom' || form.custom_brand_voice.length > 0

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
          <Sparkles className="size-[18px] text-[#ff0099]" />
          <h3 className="font-['Bangers'] text-lg tracking-wide uppercase text-white">
            BRAND IDENTITY
          </h3>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-[#cccccc] mb-1.5">
              Business Name
            </label>
            <Input
              value={form.business_name}
              onChange={(e) => updateField('business_name', e.target.value)}
              placeholder="Your business name"
              className="bg-[#111] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#555] focus:border-[#ff0099] focus-visible:ring-[rgba(255,0,153,0.15)]"
            />
          </div>

          <div className="relative" ref={industryRef}>
            <label className="block text-[13px] font-medium text-[#cccccc] mb-1.5">
              Industry
            </label>
            <button
              onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
              className="w-full flex items-center justify-between bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2.5 text-[14px] text-left text-white focus:border-[#ff0099] outline-none transition-all hover:border-[rgba(255,255,255,0.2)]"
            >
              <span className={form.industry ? 'text-white' : 'text-[#555]'}>
                {form.industry || 'Select industry'}
              </span>
              <ChevronDown className="size-4 text-[#555]" />
            </button>
            <AnimatePresence>
              {showIndustryDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded-lg shadow-xl z-20 overflow-hidden"
                >
                  {industries.map((ind) => (
                    <button
                      key={ind}
                      onClick={() => {
                        updateField('industry', ind)
                        setShowIndustryDropdown(false)
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 text-[13px] text-left transition-colors hover:bg-[#1a1a1a]',
                        form.industry === ind
                          ? 'text-[#ff0099]'
                          : 'text-[#cccccc]'
                      )}
                    >
                      {ind}
                      {form.industry === ind && <Check className="size-3.5" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#cccccc] mb-2">
              Brand Voice
            </label>
            <div className="flex flex-wrap gap-2">
              {brandVoices.map((voice) => (
                <button
                  key={voice}
                  onClick={() => updateField('brand_voice', voice)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border text-[13px] font-medium transition-all',
                    form.brand_voice === voice
                      ? 'border-[#ff0099] bg-[rgba(255,0,153,0.1)] text-[#ff0099]'
                      : 'border-[rgba(255,255,255,0.1)] bg-[#111] text-[#888] hover:text-white hover:border-[rgba(255,255,255,0.2)]'
                  )}
                >
                  {form.brand_voice === voice ? (
                    <div className="size-3.5 rounded-full bg-gradient-to-r from-[#ff0099] to-[#00ccff] flex items-center justify-center">
                      <Check className="size-2.5 text-black" />
                    </div>
                  ) : (
                    <div className="size-3.5 rounded-full border border-[rgba(255,255,255,0.2)]" />
                  )}
                  {voice}
                </button>
              ))}
            </div>
            <AnimatePresence>
              {showCustomVoice && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Textarea
                    value={form.custom_brand_voice}
                    onChange={(e) =>
                      updateField('custom_brand_voice', e.target.value)
                    }
                    placeholder="Describe your custom brand voice..."
                    rows={4}
                    className="mt-3 bg-[#111] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#555] focus:border-[#ff0099] focus-visible:ring-[rgba(255,0,153,0.15)]"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#cccccc] mb-1.5">
              Brand Description{' '}
              <span className="text-[#555]">(optional)</span>
            </label>
            <Textarea
              value={form.brand_description}
              onChange={(e) =>
                updateField('brand_description', e.target.value)
              }
              placeholder="Tell us more about what your brand does..."
              rows={4}
              className="bg-[#111] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#555] focus:border-[#ff0099] focus-visible:ring-[rgba(255,0,153,0.15)]"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#cccccc] mb-2">
              Brand Colors{' '}
              <span className="text-[#555]">(optional)</span>
            </label>
            <div className="flex gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.brand_color_primary}
                  onChange={(e) =>
                    updateField('brand_color_primary', e.target.value)
                  }
                  className="size-10 rounded-full border-2 border-[rgba(255,255,255,0.1)] cursor-pointer bg-transparent"
                />
                <div>
                  <p className="text-[11px] text-[#888]">Primary</p>
                  <p className="text-[12px] text-white font-mono uppercase">
                    {form.brand_color_primary}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.brand_color_secondary}
                  onChange={(e) =>
                    updateField('brand_color_secondary', e.target.value)
                  }
                  className="size-10 rounded-full border-2 border-[rgba(255,255,255,0.1)] cursor-pointer bg-transparent"
                />
                <div>
                  <p className="text-[11px] text-[#888]">Secondary</p>
                  <p className="text-[12px] text-white font-mono uppercase">
                    {form.brand_color_secondary}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#cccccc] mb-2">
              Social Media Links
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#555]" />
                <Input
                  value={form.social_instagram}
                  onChange={(e) =>
                    updateField('social_instagram', e.target.value)
                  }
                  placeholder="@username"
                  className="pl-10 bg-[#111] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#555] focus:border-[#ff0099]"
                />
              </div>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#555]" />
                <Input
                  value={form.social_tiktok}
                  onChange={(e) =>
                    updateField('social_tiktok', e.target.value)
                  }
                  placeholder="@username"
                  className="pl-10 bg-[#111] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#555] focus:border-[#ff0099]"
                />
              </div>
              <div className="relative">
                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#555]" />
                <Input
                  value={form.social_youtube}
                  onChange={(e) =>
                    updateField('social_youtube', e.target.value)
                  }
                  placeholder="Channel URL"
                  className="pl-10 bg-[#111] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#555] focus:border-[#ff0099]"
                />
              </div>
              <div className="relative">
                <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#555]" />
                <Input
                  value={form.social_twitter}
                  onChange={(e) =>
                    updateField('social_twitter', e.target.value)
                  }
                  placeholder="@username"
                  className="pl-10 bg-[#111] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#555] focus:border-[#ff0099]"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className={cn(
              'mt-2 font-["Bangers"] uppercase tracking-wider text-[14px] px-8 py-2.5 rounded-lg transition-all',
              saveState === 'saved'
                ? 'bg-[#00ff88] text-black hover:bg-[#00ff88]/90'
                : 'bg-gradient-to-r from-[#ff0099] to-[#00ccff] text-black hover:scale-105 shadow-[0_0_20px_rgba(255,0,153,0.3)]'
            )}
          >
            {saving ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : saveState === 'saved' ? (
              <Check className="size-4 mr-2" />
            ) : null}
            {saving ? 'Saving...' : saveState === 'saved' ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>
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
