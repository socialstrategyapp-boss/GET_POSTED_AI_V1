import { useState, useRef } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'

const BUSINESS_SIZES = [
  { label: 'Sole Trader', emoji: '🧑', desc: 'Just me' },
  { label: 'Family Business', emoji: '🏡', desc: '2–5 people' },
  { label: 'Small Business', emoji: '🌱', desc: '5–20 people' },
  { label: 'Growing', emoji: '📈', desc: '20–50 people' },
  { label: 'Established', emoji: '🏢', desc: '50+ people' },
]

export default function ProfileSetup() {
  const navigate = useNavigate()
  const onboarding = JSON.parse(localStorage.getItem('gp_onboarding') || '{}')
  const fileInputLogo = useRef<HTMLInputElement>(null)
  const fileInputBanner = useRef<HTMLInputElement>(null)
  const fileInputOwner = useRef<HTMLInputElement>(null)
  const fileInputMedia = useRef<HTMLInputElement>(null)

  // Strip emoji prefix from onboarding answers like "📦 Products" → "Products"
  const stripEmoji = (val: string) => val.replace(/^[\p{Emoji}\s]+/u, '').trim()

  const [form, setForm] = useState({
    businessName: onboarding.businessName || '',
    website: onboarding.website || '',
    ownerFirstName: '',
    ownerLastName: '',
    phone: '',
    email: '',
    address: '',
    postAddress: '',
    country: 'Australia',
    timezone: 'Australia/Sydney',
    businessSize: '',
    industry: onboarding.industry || '',
    industryCode: onboarding.industryCode || '',
    sells: stripEmoji(onboarding.sells || ''),
    audience: stripEmoji(onboarding.audience || ''),
    brandVoiceFromOnboarding: stripEmoji(onboarding.brandVoice || ''),
    contentPref: stripEmoji(onboarding.contentPref || ''),
    desc1: '',
    desc2: '',
    desc3: '',
    instagram: '', tiktok: '', facebook: '', youtube: '', linkedin: '', x: '', pinterest: '',
    brandColours: ['#ff0099', '#00ccff', '#ffffff'],
  })

  const [logoUrl, setLogoUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [ownerUrl, setOwnerUrl] = useState('')
  const [mediaFiles, setMediaFiles] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [scanMsg, setScanMsg] = useState('')

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleFile = (file: File, setter: (url: string) => void) => {
    const reader = new FileReader()
    reader.onload = e => setter(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleMediaFiles = (files: FileList) => {
    Array.from(files).forEach(f => {
      const reader = new FileReader()
      reader.onload = e => setMediaFiles(p => [...p, e.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setScanMsg('Saving your profile ✨')
    const profile = { ...form, logoUrl, bannerUrl, ownerUrl, mediaFiles }
    localStorage.setItem('gp_profile', JSON.stringify(profile))

    // Save to Supabase if user is authenticated
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
          business_name: form.businessName,
          website: form.website,
          owner_first_name: form.ownerFirstName,
          owner_last_name: form.ownerLastName,
          phone: form.phone,
          address: form.address,
          country: form.country,
          timezone: form.timezone,
          business_size: form.businessSize,
          industry: form.industry,
          industry_code: form.industryCode,
          sells: form.sells,
          audience: form.audience,
          brand_voice: form.brandVoiceFromOnboarding,
          content_pref: form.contentPref,
          desc1: form.desc1,
          desc2: form.desc2,
          desc3: form.desc3,
          instagram: form.instagram,
          tiktok: form.tiktok,
          facebook: form.facebook,
          youtube: form.youtube,
          linkedin: form.linkedin,
          x_twitter: form.x,
          pinterest: form.pinterest,
          logo_url: logoUrl,
          banner_url: bannerUrl,
          owner_photo_url: ownerUrl,
          onboarding_done: true,
        }, { onConflict: 'id' })
      }
    } catch { /* silent fallback to localStorage */ }

    // Always fire intelligence scan — with or without website
    setScanMsg('Building your intelligence file — this is where the magic happens 🔍')
    try {
      const scanPayload = {
        businessName: form.businessName,
        website: form.website || '',
        industry: form.industry,
        industryCode: onboarding.industryCode || '',
        sells: onboarding.sells || '',
        audience: onboarding.audience || '',
        brandVoice: onboarding.brandVoice || '',
        country: form.country || 'Australia',
        desc1: form.desc1,
        desc2: form.desc2,
        desc3: form.desc3,
      }
      const response = await fetch('/api/scan-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scanPayload),
      })
      const data = await response.json()
      if (data.success && data.intelligence) {
        localStorage.setItem('gp_intelligence', JSON.stringify(data.intelligence))
        setScanMsg(`✅ Got it — you're in ${data.sub_industry || data.industry}. Taking you to your studio 🚀`)
      } else {
        setScanMsg('All set! Taking you to your studio 🚀')
      }
    } catch {
      setScanMsg('All set! Taking you to your studio 🚀')
    }

    setTimeout(() => navigate('/studio'), 1600)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', fontFamily: 'Inter, sans-serif', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ padding: '24px 24px 0', maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{
          fontFamily: 'Bangers, cursive', fontSize: 28, letterSpacing: 3,
          background: 'linear-gradient(90deg, #ff0099, #00ccff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          BUILD YOUR PROFILE
        </h1>
        <p style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
          The more you give us, the better your content looks. Every field helps.
        </p>
      </div>

      {/* Co-pilot tip */}
      <div style={{ maxWidth: 640, margin: '16px auto 0', padding: '0 24px' }}>
        <div style={{
          background: 'rgba(255,0,153,0.08)', border: '1px solid rgba(255,0,153,0.2)',
          borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 20 }}>✨</span>
          <div>
            <p style={{ color: '#ff0099', fontSize: 13, fontWeight: 600, margin: 0 }}>Hey! I'm already looking you up.</p>
            <p style={{ color: '#888', fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
              Fill in what you can — even a little goes a long way. Upload photos of your business and products too. The more I have, the more your content will look like it was made just for you.
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px' }}>

        {/* Banner + Logo + Owner photo */}
        <Section title="Your Brand Look">
          {/* Banner */}
          <div
            onClick={() => fileInputBanner.current?.click()}
            style={{
              width: '100%', height: 140, borderRadius: 12, cursor: 'pointer',
              background: bannerUrl ? `url(${bannerUrl}) center/cover` : 'rgba(255,255,255,0.04)',
              border: '2px dashed rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {!bannerUrl && <p style={{ color: '#555', fontSize: 13 }}>📸 Upload a banner photo</p>}
            <input ref={fileInputBanner} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], setBannerUrl)} />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            {/* Logo */}
            <div onClick={() => fileInputLogo.current?.click()} style={{
              width: 80, height: 80, borderRadius: 40, cursor: 'pointer',
              background: logoUrl ? `url(${logoUrl}) center/cover` : 'rgba(255,0,153,0.1)',
              border: '2px solid rgba(255,0,153,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {!logoUrl && <span style={{ fontSize: 24 }}>🏷️</span>}
              <input ref={fileInputLogo} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], setLogoUrl)} />
            </div>

            {/* Owner photo */}
            <div onClick={() => fileInputOwner.current?.click()} style={{
              width: 80, height: 80, borderRadius: 40, cursor: 'pointer',
              background: ownerUrl ? `url(${ownerUrl}) center/cover` : 'rgba(0,204,255,0.1)',
              border: '2px solid rgba(0,204,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {!ownerUrl && <span style={{ fontSize: 24 }}>👤</span>}
              <input ref={fileInputOwner} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], setOwnerUrl)} />
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ color: '#666', fontSize: 12, lineHeight: 1.5 }}>
                <span style={{ color: '#ff0099' }}>Logo</span> + <span style={{ color: '#00ccff' }}>your photo</span> help us put your real brand in every video. Optional but highly recommended.
              </p>
            </div>
          </div>
        </Section>

        {/* Business details */}
        <Section title="Business Details">
          <Field label="Business Name *" value={form.businessName} onChange={v => set('businessName', v)} placeholder="The Plant Collective" />
          <Field label="Website URL" value={form.website} onChange={v => set('website', v)} placeholder="https://yoursite.com.au" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Owner First Name" value={form.ownerFirstName} onChange={v => set('ownerFirstName', v)} placeholder="Neil" />
            <Field label="Owner Last Name" value={form.ownerLastName} onChange={v => set('ownerLastName', v)} placeholder="Smith" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Phone" value={form.phone} onChange={v => set('phone', v)} placeholder="+61 4XX XXX XXX" />
            <Field label="Email" value={form.email} onChange={v => set('email', v)} placeholder="you@business.com.au" />
          </div>
          <Field label="Business Address" value={form.address} onChange={v => set('address', v)} placeholder="123 Main St, Sydney NSW 2000" />
          <Field label="Postal Address (if different)" value={form.postAddress} onChange={v => set('postAddress', v)} placeholder="PO Box 123..." />
        </Section>

        {/* Business size */}
        <Section title="Business Size">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {BUSINESS_SIZES.map(s => (
              <motion.button key={s.label} onClick={() => set('businessSize', s.label)}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: form.businessSize === s.label ? 'linear-gradient(90deg,#ff0099,#00ccff)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                  padding: '10px 16px', color: '#fff', cursor: 'pointer', textAlign: 'left',
                }}>
                <div style={{ fontSize: 20 }}>{s.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: form.businessSize === s.label ? 'rgba(0,0,0,0.7)' : '#666' }}>{s.desc}</div>
              </motion.button>
            ))}
          </div>
        </Section>

        {/* Describe your business — 3 boxes with mic */}
        <Section title="Tell Us About Your Business">
          <TextArea label='What does your business do?' value={form.desc1} onChange={v => set('desc1', v)} placeholder="Describe what you sell or offer..." />
          <TextArea label='Who are your customers?' value={form.desc2} onChange={v => set('desc2', v)} placeholder="Who do you help and what do they care about..." />
          <TextArea label='What makes you different?' value={form.desc3} onChange={v => set('desc3', v)} placeholder="Your unique edge over everyone else..." />
        </Section>

        {/* Brand colours — 3 colours, always filled */}
        <Section title="Brand Colours">
          <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>
            Pick up to 3 colours that represent your brand. These appear in your videos and images.
          </p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {form.brandColours.map((c, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 28,
                  background: c, border: '3px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  boxShadow: `0 0 16px ${c}44`,
                }}>
                  <input type="color" value={c}
                    onChange={e => {
                      const cols = [...form.brandColours]
                      cols[i] = e.target.value
                      setForm(p => ({ ...p, brandColours: cols }))
                    }}
                    style={{
                      position: 'absolute', inset: 0, width: '100%', height: '100%',
                      opacity: 0, cursor: 'pointer', border: 'none',
                    }}
                  />
                </div>
                <p style={{ color: '#555', fontSize: 10, marginTop: 6, fontFamily: 'monospace' }}>{c.toUpperCase()}</p>
                <p style={{ color: '#444', fontSize: 10, marginTop: 0 }}>
                  {i === 0 ? 'Primary' : i === 1 ? 'Secondary' : 'Accent'}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* Social handles */}
        <Section title="Social Media Handles">
          {[
            { key: 'instagram', label: '📸 Instagram', placeholder: '@yourhandle' },
            { key: 'tiktok', label: '🎵 TikTok', placeholder: '@yourhandle' },
            { key: 'facebook', label: '📘 Facebook', placeholder: 'facebook.com/yourpage' },
            { key: 'youtube', label: '▶️ YouTube', placeholder: 'youtube.com/@yourchannel' },
            { key: 'linkedin', label: '💼 LinkedIn', placeholder: 'linkedin.com/company/...' },
            { key: 'x', label: '𝕏 Twitter/X', placeholder: '@yourhandle' },
            { key: 'pinterest', label: '📌 Pinterest', placeholder: '@yourhandle' },
          ].map(s => (
            <Field key={s.key} label={s.label} value={form[s.key as keyof typeof form] as string}
              onChange={v => set(s.key, v)} placeholder={s.placeholder} />
          ))}
        </Section>

        {/* Media upload gallery */}
        <Section title="Upload Your Photos & Videos">
          <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>
            Upload anything — product photos, your store, your team. These get used in your content. The more the better.
          </p>
          <div
            onClick={() => fileInputMedia.current?.click()}
            style={{
              border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 12,
              padding: 24, textAlign: 'center', cursor: 'pointer',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <p style={{ color: '#555', fontSize: 14 }}>📎 Tap to upload photos, videos, logos</p>
            <input ref={fileInputMedia} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }}
              onChange={e => e.target.files && handleMediaFiles(e.target.files)} />
          </div>
          {mediaFiles.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
              {mediaFiles.map((url, i) => (
                <div key={i} style={{
                  aspectRatio: '1', borderRadius: 8,
                  background: `url(${url}) center/cover`, border: '1px solid rgba(255,255,255,0.1)',
                }} />
              ))}
            </div>
          )}
        </Section>

        {/* Save button */}
        <AnimatePresence>
          {scanMsg && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: 'center', color: '#ff0099', fontSize: 14, marginBottom: 16, padding: '12px', background: 'rgba(255,0,153,0.08)', borderRadius: 10 }}>
              {scanMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={handleSave}
          disabled={!form.businessName || saving}
          whileTap={{ scale: 0.97 }}
          style={{
            width: '100%', background: 'linear-gradient(90deg, #ff0099, #00ccff)',
            color: '#000', fontFamily: 'Bangers, cursive', fontSize: 20,
            letterSpacing: 3, padding: '16px', borderRadius: 14,
            border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            opacity: !form.businessName ? 0.5 : 1,
          }}
        >
          {saving ? 'SETTING UP YOUR WORKSPACE ✨' : 'SAVE & START CREATING →'}
        </motion.button>

        <p style={{ color: '#444', fontSize: 12, textAlign: 'center', marginTop: 12 }}>
          You can edit all of this any time from your profile page
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder: string }) {
  return (
    <div>
      <label style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 4 }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: '100%', background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 14,
          outline: 'none', boxSizing: 'border-box',
        }}
        onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,0,153,0.5)'}
        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
      />
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder: string }) {
  return (
    <div>
      <label style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 4 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
          style={{
            width: '100%', background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: '11px 44px 11px 14px', color: '#fff', fontSize: 14,
            outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'Inter, sans-serif',
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,0,153,0.5)'}
          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
        <button style={{
          position: 'absolute', right: 10, top: 10, background: 'none', border: 'none',
          cursor: 'pointer', fontSize: 18, opacity: 0.5,
        }} title="Speak instead of type">🎙️</button>
      </div>
    </div>
  )
}
