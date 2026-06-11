// GET POSTED AI — API Client
// ALL keys loaded from localStorage (nothing hardcoded, GitHub safe)

export type AiProvider = 'openai' | 'gemini' | 'moonshot'

// ─── KEY LOADER ────────────────────────────────────────────────────────────
// Keys stored in localStorage by the user (one-time setup)
function getKeys(): { openai: string[]; moonshot: string; runpod: string } {
  const keys: string[] = []
  for (let i = 1; i <= 5; i++) {
    const k = localStorage.getItem(`OPENAI_KEY_${i}`) || localStorage.getItem(`openai_key_${i}`)
    if (k) keys.push(k)
  }
  // Also check legacy key names
  const legacy = localStorage.getItem('OPENAI_KEY') || localStorage.getItem('openai_key')
  if (legacy) keys.push(legacy)

  return {
    openai: keys,
    moonshot: localStorage.getItem('MOONSHOT_KEY') || localStorage.getItem('moonshot_key') || '',
    runpod: localStorage.getItem('RUNPOD_KEY') || localStorage.getItem('runpod_key') || '',
  }
}

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
    return await fetch(url, { ...options, signal: controller.signal })
  } finally { clearTimeout(timer) }
}

// ─── OPENAI API ────────────────────────────────────────────────────────────
async function callOpenAI(message: string): Promise<string | null> {
  const { openai: keys } = getKeys()
  if (keys.length === 0) return null
  for (const key of keys) {
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
      })
      if (!res.ok) continue
      const data = await res.json()
      return data.choices?.[0]?.message?.content || null
    } catch { continue }
  }
  return null
}

// ─── MOONSHOT API ──────────────────────────────────────────────────────────
async function callMoonshot(message: string): Promise<string | null> {
  const { moonshot: key } = getKeys()
  if (!key) return null
  try {
    const res = await fetchWithTimeout('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [{ role: 'system', content: 'You are GET POSTED AI.' }, { role: 'user', content: message }],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch { return null }
}

// ─── MAIN EXPORT ───────────────────────────────────────────────────────────
export async function sendAiMessage(
  message: string,
  _bn?: string | null, _ind?: string | null, _wu?: string | null,
  provider: AiProvider = 'openai'
): Promise<{ reply: string; provider: string }> {
  if (provider === 'openai') {
    const r = await callOpenAI(message)
    if (r) return { reply: r, provider: 'gpt-4o' }
  }
  if (provider === 'moonshot') {
    const r = await callMoonshot(message)
    if (r) return { reply: r, provider: 'moonshot' }
  }
  // Simulated fallback
  const { biz, industry } = getProfileContext()
  return {
    reply: `🎯 CONTENT FOR ${(biz || 'your business').toUpperCase()}\n\n**Hook:** "Stop scrolling — this ${industry || 'business'} tip changes everything!"\n\n**Hashtags:** #${(industry || 'business').replace(/\s+/g, '')} #Viral\n\n**Post at:** 6-8 PM\n\n**CTA:** Follow for daily tips!`,
    provider: 'demo'
  }
}

// ─── RUNPOD API ────────────────────────────────────────────────────────────
export type RunPodJobType = 'video' | 'image' | 'voice'

export async function submitRunPodJob(type: RunPodJobType, endpointId: string, input: Record<string, unknown>): Promise<{ jobId: string; status: string }> {
  const { runpod: key } = getKeys()
  if (!key) throw new Error('RunPod key not set')
  const res = await fetchWithTimeout(`https://api.runpod.ai/v2/${endpointId}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ input }),
  }, 30000)
  if (!res.ok) throw new Error(`RunPod ${type} error: ${res.status}`)
  const data = await res.json()
  return { jobId: data.id, status: data.status }
}

export async function getRunPodStatus(endpointId: string, jobId: string) {
  const { runpod: key } = getKeys()
  const res = await fetchWithTimeout(`https://api.runpod.ai/v2/${endpointId}/status/${jobId}`, {
    headers: { 'Authorization': `Bearer ${key}` },
  }, 10000)
  const data = await res.json()
  return {
    id: jobId,
    status: data.status === 'IN_QUEUE' ? 'queued' : data.status === 'IN_PROGRESS' ? 'in-progress' : data.status === 'COMPLETED' ? 'completed' : 'failed',
    output: data.output,
    createdAt: data.createdAt || new Date().toISOString(),
  }
}

export async function pollRunPodJob(endpointId: string, jobId: string, onProgress?: (s: string) => void, timeoutMs = 300000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const job = await getRunPodStatus(endpointId, jobId)
    onProgress?.(job.status)
    if (job.status === 'completed' || job.status === 'failed') return job
    await new Promise(r => setTimeout(r, 3000))
  }
  throw new Error('Job timed out')
}

export async function generateContent(prompt: string) { return sendAiMessage(prompt) }
export async function getCredits() { return { credits: 300 } }
