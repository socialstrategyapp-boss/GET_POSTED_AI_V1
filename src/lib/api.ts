// GET POSTED AI — API Client
// Calls OpenAI, RunPod, Gemini, Moonshot directly from frontend
// Falls back to Supabase Edge Functions if available

import { supabase } from './supabase'

const API_BASE = '/api'
export type AiProvider = 'openai' | 'gemini' | 'moonshot' | 'libre'

// ─── Direct OpenAI call (works immediately, no Edge Function needed) ────────

export async function sendAiMessage(
  message: string,
  businessName?: string | null,
  industry?: string | null,
  websiteUrl?: string | null,
  provider: AiProvider = 'openai'
): Promise<{ reply: string; provider: string }> {
  // Read full profile from localStorage for rich context
  const profile = JSON.parse(localStorage.getItem('gp_profile') || '{}')
  const aboutBiz = (profile.about_business || profile.brand_description || '') as string
  const brandVoice = (profile.brand_voice || profile.custom_brand_voice || '') as string
  const profileWebsite = websiteUrl || (profile.website_url || profile.website || '') as string
  const profileBiz = businessName || (profile.businessName || profile.business_name || '') as string
  const profileIndustry = industry || (profile.industry || '') as string

  // Try OpenAI directly first (reads key from env or localStorage)
  if (provider === 'openai') {
    try {
      const keys = [
        import.meta.env.VITE_OPENAI_KEY,
        localStorage.getItem('OPENAI_KEY_1'),
        localStorage.getItem('OPENAI_KEY_2'),
        localStorage.getItem('OPENAI_KEY_3'),
      ].filter((k): k is string => !!k)

      let systemPrompt = `You are GET POSTED AI, an expert social media content strategist and viral video creator.`
      if (profileBiz) {
        systemPrompt += ` You are helping "${profileBiz}"${profileIndustry ? `, a business in the ${profileIndustry} industry` : ''}.`
      }
      if (profileWebsite) systemPrompt += ` Their website is ${profileWebsite}.`
      if (aboutBiz) systemPrompt += `\n\nABOUT THE BUSINESS:\n${aboutBiz}`
      if (brandVoice) systemPrompt += `\n\nBRAND VOICE: ${brandVoice}`
      systemPrompt += `\n\nYour job is to help create amazing, viral social media content. Be creative, strategic, and actionable.\n\nWhen asked for content, provide:\n1. A hook/headline that grabs attention in the first 2 seconds\n2. A full script or post text\n3. Specific shot list or visual directions (for video)\n4. 5-10 optimized hashtags\n5. Best posting time recommendation\n6. Call-to-action suggestions\n\nKeep responses concise but packed with value. Format with emojis and clear sections. Always reference their specific business and industry.`

      for (const key of keys) {
        try {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
              ],
              temperature: 0.8,
              max_tokens: 1500,
            }),
          })
          if (!res.ok) continue
          const data = await res.json()
          const reply = data.choices?.[0]?.message?.content
          if (reply) return { reply, provider: 'openai-gpt4o' }
        } catch { continue }
      }
    } catch { /* fallback */ }
  }

  // Try Moonshot directly
  if (provider === 'moonshot') {
    try {
      const moonKey = import.meta.env.VITE_MOONSHOT_KEY || localStorage.getItem('MOONSHOT_KEY') || ''
      const res = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${moonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'moonshot-v1-8k',
          messages: [
            { role: 'system', content: `You are GET POSTED AI, an expert social media content strategist.` },
            { role: 'user', content: message }
          ],
          temperature: 0.8,
          max_tokens: 1500,
        }),
      })
      const data = await res.json()
      const reply = data.choices?.[0]?.message?.content
      if (reply) return { reply, provider: 'moonshot' }
    } catch { /* fallback */ }
  }

  // Try Gemini directly
  if (provider === 'gemini') {
    try {
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + import.meta.env.VITE_GEMINI_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] }),
      })
      const data = await res.json()
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (reply) return { reply, provider: 'gemini' }
    } catch { /* fallback */ }
  }

  // Try Supabase Edge Function as last resort
  try {
    const fnName = provider === 'gemini' ? 'gemini-chat' : provider === 'moonshot' ? 'moonshot-chat' : 'ai-chat'
    const { data, error } = await supabase.functions.invoke(fnName, {
      body: { message, businessName, industry, websiteUrl, provider },
    })
    if (!error && data?.reply) return { reply: data.reply, provider: data.provider || provider }
  } catch { /* fallback */ }

  // Absolute fallback: simulated response
  return simulateAiResponse(message, businessName, industry)
}

// ─── RunPod Direct API (Video / Image / Voice) ──────────────────────────────

export type RunPodJobType = 'video' | 'image' | 'voice'

export interface RunPodJob {
  id: string
  type: RunPodJobType
  status: 'queued' | 'in-progress' | 'completed' | 'failed'
  input: Record<string, unknown>
  output?: { url?: string; video_url?: string; image_url?: string; audio_url?: string; message?: string }
  createdAt: string
}

const RUNPOD_KEY = import.meta.env.VITE_RUNPOD_API_KEY || ''

export async function submitRunPodJob(
  _type: RunPodJobType,
  endpointId: string,
  input: Record<string, unknown>
): Promise<{ jobId: string; status: string }> {
  const url = `https://api.runpod.ai/v2/${endpointId}/run`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RUNPOD_KEY}`,
    },
    body: JSON.stringify({ input }),
  })
  if (!res.ok) throw new Error(`RunPod error: ${res.status}`)
  const data = await res.json()
  return { jobId: data.id, status: data.status }
}

export async function getRunPodStatus(endpointId: string, jobId: string): Promise<RunPodJob> {
  const res = await fetch(`https://api.runpod.ai/v2/${endpointId}/status/${jobId}`, {
    headers: { 'Authorization': `Bearer ${RUNPOD_KEY}` },
  })
  const data = await res.json()
  return {
    id: jobId,
    type: 'image',
    status: data.status === 'IN_QUEUE' ? 'queued' : data.status === 'IN_PROGRESS' ? 'in-progress' : data.status === 'COMPLETED' ? 'completed' : 'failed',
    input: data.input || {},
    output: data.output,
    createdAt: data.createdAt || new Date().toISOString(),
  }
}

export async function pollRunPodJob(
  endpointId: string,
  jobId: string,
  onProgress?: (j: RunPodJob) => void,
  timeoutMs = 300000
): Promise<RunPodJob> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const job = await getRunPodStatus(endpointId, jobId)
    onProgress?.(job)
    if (job.status === 'completed' || job.status === 'failed') return job
    await new Promise(r => setTimeout(r, 3000))
  }
  throw new Error('Job timed out')
}

// ─── Legacy API ─────────────────────────────────────────────────────────────

export async function generateContent(prompt: string, businessName?: string, industry?: string) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${API_BASE}/generate-content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ prompt, businessName, industry }),
  })
  return res.json()
}

export async function getCredits() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { credits: 0 }
  const res = await fetch(`${API_BASE}/credits`, { headers: { Authorization: `Bearer ${session.access_token}` } })
  return res.json()
}

// ─── Simulated fallback ─────────────────────────────────────────────────────

function simulateAiResponse(message: string, businessName?: string | null, industry?: string | null): Promise<{ reply: string; provider: string }> {
  const lower = message.toLowerCase()
  const biz = businessName || 'your business'
  const ind = industry || 'your industry'
  let reply = `Here are some content ideas for ${biz}!\n\n1. **Behind-the-scenes post** — Show your process in ${ind}\n2. **Customer testimonial** — Let happy clients do the talking\n3. **Trending audio Reel** — Hop on a viral sound with your twist\n4. **Educational carousel** — "5 things I wish I knew about ${ind}"\n5. **Day-in-the-life** — Personal, authentic, high engagement\n\nWhich one would you like me to develop into a full post?`
  if (lower.includes('tiktok') || lower.includes('short')) reply = `For ${biz} on TikTok:\n\n**Hook (0-2s):** "Stop scrolling if you ${ind.toLowerCase()}..."\n**Body:** Quick tip + visual demonstration\n**CTA:** "Follow for daily ${ind.toLowerCase()} tips"\n\n**Hashtags:** #${ind.replace(/\s+/g, '')} #TikTokTips #${biz.replace(/\s+/g, '')} #Viral #FYP`
  else if (lower.includes('reel') || lower.includes('instagram')) reply = `Instagram Reel for ${biz}:\n\n**Concept:** Before & After transformation\n**Length:** 15-30 seconds\n**Audio:** Trending track (check Reels tab)\n**Text overlay:** "POV: You found the best ${ind.toLowerCase()}..."\n**Hashtags:** #Reels #${ind.replace(/\s+/g, '')} #InstagramReels #${biz.replace(/\s+/g, '')}`
  return new Promise(r => setTimeout(() => r({ reply, provider: 'demo' }), 800))
}
