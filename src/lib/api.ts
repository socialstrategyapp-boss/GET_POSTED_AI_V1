// GET POSTED AI — API Client
// Uses VITE_ env vars (injected at build time from .env)
// No hardcoded keys in source — GitHub safe

export type AiProvider = 'openai' | 'gemini' | 'moonshot'

// ─── KEYS from VITE env (injected by Vite at build from .env) ─────────────
const OPENAI_KEYS = [
  import.meta.env.VITE_OPENAI_KEY_1,
  import.meta.env.VITE_OPENAI_KEY_2,
  import.meta.env.VITE_OPENAI_KEY_3,
].filter(Boolean) as string[]

const MOONSHOT_KEY = (import.meta.env.VITE_MOONSHOT_KEY || '') as string

const RUNPOD_KEY = (import.meta.env.VITE_RUNPOD_API_KEY || '') as string

// ─── PROFILE CONTEXT ───────────────────────────────────────────────────────
function getProfileContext() {
  try {
    const p = JSON.parse(localStorage.getItem('gp_profile') || '{}')
    return {
      biz: p.businessName || p.business_name || '',
      industry: p.industry || '',
      website: p.website_url || p.websiteUrl || p.website || '',
      about: p.about_business || p.brand_description || '',
      voice: p.brand_voice || p.custom_brand_voice || '',
    }
  } catch { return { biz: '', industry: '', website: '', about: '', voice: '' } }
}

function buildSystemPrompt() {
  const { biz, industry, website, about, voice } = getProfileContext()
  let s = 'You are GET POSTED AI, an expert social media content strategist and viral video creator.'
  if (biz) s += ` You are helping "${biz}"${industry ? `, a ${industry} business` : ''}.`
  if (website) s += ` Website: ${website}.`
  if (about) s += `\n\nAbout the business:\n${about}`
  if (voice) s += `\nBrand voice: ${voice}.`
  s += `\n\nProvide: 1) attention-grabbing hook, 2) full script/caption, 3) visual directions, 4) 5-10 hashtags, 5) best posting time, 6) CTA. Format with emojis and clear sections.`
  return s
}

// ─── Fetch with timeout ────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

// ─── OPENAI API ────────────────────────────────────────────────────────────
async function callOpenAI(message: string): Promise<string | null> {
  if (OPENAI_KEYS.length === 0) return null
  for (const key of OPENAI_KEYS) {
    try {
      const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: buildSystemPrompt() },
            { role: 'user', content: message }
          ],
          temperature: 0.8,
          max_tokens: 1500,
        }),
      }, 15000)
      if (!res.ok) continue
      const data = await res.json()
      const reply = data.choices?.[0]?.message?.content
      if (reply) return reply
    } catch { continue }
  }
  return null
}

// ─── MOONSHOT API ──────────────────────────────────────────────────────────
async function callMoonshot(message: string): Promise<string | null> {
  if (!MOONSHOT_KEY) return null
  try {
    const res = await fetchWithTimeout('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${MOONSHOT_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          { role: 'system', content: 'You are GET POSTED AI.' },
          { role: 'user', content: message }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    }, 15000)
    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch { return null }
}

// ─── SUPABASE EDGE FUNCTION (CORS-safe proxy) ──────────────────────────────
import { supabase } from './supabase'

async function callSupabaseEdge(message: string): Promise<string | null> {
  try {
    // 5-second timeout for Supabase Edge Function
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase timeout')), 5000)
    )
    const invokePromise = supabase.functions.invoke('ai-chat', { body: { message } })
    const { data, error } = await Promise.race([invokePromise, timeoutPromise])
    if (error) return null
    return data?.reply || null
  } catch { return null }
}

// ─── MAIN EXPORT ───────────────────────────────────────────────────────────
export async function sendAiMessage(
  message: string,
  _businessName?: string | null,
  _industry?: string | null,
  _websiteUrl?: string | null,
  provider: AiProvider = 'openai'
): Promise<{ reply: string; provider: string }> {
  if (provider === 'openai') {
    // Try direct OpenAI first (fastest, 15s timeout)
    const directReply = await callOpenAI(message)
    if (directReply) return { reply: directReply, provider: 'gpt-4o' }

    // Fallback: Supabase Edge Function (5s timeout)
    const edgeReply = await callSupabaseEdge(message)
    if (edgeReply) return { reply: edgeReply, provider: 'gpt-4o' }
  }
  if (provider === 'moonshot') {
    const reply = await callMoonshot(message)
    if (reply) return { reply, provider: 'moonshot' }
  }
  return simulateResponse(message)
}

function simulateResponse(_message: string): { reply: string; provider: string } {
  const { biz, industry } = getProfileContext()
  const b = biz || 'your business'
  const i = industry || 'your industry'
  return {
    reply: `🎯 CONTENT FOR ${b.toUpperCase()}\n\n**Hook:** "Stop scrolling — this ${i} tip changes everything!"\n\n**Script:** Hey everyone! Welcome back to ${b}. Today we're sharing something our customers absolutely love.\n\n**Hashtags:** #${i.replace(/\s+/g, '')} #Viral #Trending\n\n**Post at:** 6-8 PM for best engagement\n\n**CTA:** Follow ${b} for daily tips!`,
    provider: 'demo'
  }
}

// ─── RUNPOD API ────────────────────────────────────────────────────────────
export type RunPodJobType = 'video' | 'image' | 'voice'

export async function submitRunPodJob(
  type: RunPodJobType,
  endpointId: string,
  input: Record<string, unknown>
): Promise<{ jobId: string; status: string }> {
  if (!RUNPOD_KEY) throw new Error('RunPod key not configured')
  const res = await fetchWithTimeout(`https://api.runpod.ai/v2/${endpointId}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RUNPOD_KEY}` },
    body: JSON.stringify({ input }),
  }, 30000)
  if (!res.ok) throw new Error(`RunPod ${type} error: ${res.status}`)
  const data = await res.json()
  return { jobId: data.id, status: data.status }
}

export async function getRunPodStatus(endpointId: string, jobId: string) {
  const res = await fetchWithTimeout(`https://api.runpod.ai/v2/${endpointId}/status/${jobId}`, {
    headers: { 'Authorization': `Bearer ${RUNPOD_KEY}` },
  }, 10000)
  const data = await res.json()
  return {
    id: jobId,
    status: data.status === 'IN_QUEUE' ? 'queued' : data.status === 'IN_PROGRESS' ? 'in-progress' : data.status === 'COMPLETED' ? 'completed' : 'failed',
    output: data.output,
    createdAt: data.createdAt || new Date().toISOString(),
  }
}

export async function pollRunPodJob(
  endpointId: string,
  jobId: string,
  onProgress?: (status: string) => void,
  timeoutMs = 300000
) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const job = await getRunPodStatus(endpointId, jobId)
    onProgress?.(job.status)
    if (job.status === 'completed' || job.status === 'failed') return job
    await new Promise(r => setTimeout(r, 3000))
  }
  throw new Error('Job timed out')
}

// Legacy exports
export async function generateContent(prompt: string) {
  return sendAiMessage(prompt, null, null, null, 'openai')
}

export async function getCredits() {
  return { credits: 300 }
}
