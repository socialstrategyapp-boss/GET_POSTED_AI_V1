// GET POSTED AI — API Client
// Supports: OpenAI (ChatGPT), Google Gemini, LibreChat (multi-provider)

import { supabase } from './supabase'

const API_BASE = '/api'

type AiProvider = 'openai' | 'gemini' | 'libre'

// ─── AI Chat ───

export async function sendAiMessage(
  message: string,
  businessName?: string | null,
  industry?: string | null,
  websiteUrl?: string | null,
  provider: AiProvider = 'openai'
): Promise<{ reply: string; provider: string }> {
  try {
    // Try Supabase Edge Function first (real AI)
    const { data, error } = await supabase.functions.invoke(
      provider === 'gemini' ? 'gemini-chat' : provider === 'libre' ? 'libre-chat' : 'ai-chat',
      {
        body: { message, businessName, industry, websiteUrl, provider },
      }
    )

    if (error) throw error
    return { reply: data.reply, provider: data.provider || provider }
  } catch {
    // Fallback to simulation
    return simulateAiResponse(message, businessName, industry)
  }
}

// ─── Legacy API Calls ───

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

export async function generateImage(prompt: string) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${API_BASE}/generate-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ prompt }),
  })
  return res.json()
}

export async function getCredits() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { credits: 0 }
  const res = await fetch(`${API_BASE}/credits`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  return res.json()
}

export async function classifyIndustry(businessName: string, websiteUrl?: string) {
  const res = await fetch(`${API_BASE}/classify-industry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessName, websiteUrl }),
  })
  return res.json()
}

// ─── Simulated AI Response (fallback when no API key) ───

function simulateAiResponse(
  message: string,
  businessName?: string | null,
  industry?: string | null
): Promise<{ reply: string; provider: string }> {
  const lower = message.toLowerCase()
  const biz = businessName || 'your business'
  const ind = industry || 'your industry'

  let reply = `I've got some great ideas for ${biz}! Let me craft something that'll really engage your audience in the ${ind} space. What platform are you thinking — Instagram, TikTok, or YouTube?`

  if (lower.includes('tiktok') || lower.includes('short')) {
    reply = `For ${biz} in ${ind}, here's a TikTok concept: Start with a hook in the first 2 seconds — show a surprising before/after or a quick tip. Use trending audio, add text overlays, and end with "Follow for more ${ind} tips!" I've drafted a 30-second script with shot-by-shot directions.`
  } else if (lower.includes('reel') || lower.includes('instagram')) {
    reply = `Perfect for ${biz}! I'm thinking a Reels format — 15-30 seconds, fast cuts, trending audio. Show your process or a quick transformation. Use 5-7 hashtags like #${ind.replace(/\s+/g, '')} #SmallBusiness. Caption: "POV: You just found the best ${ind.toLowerCase()}..."`
  } else if (lower.includes('post') || lower.includes('facebook') || lower.includes('x ')) {
    reply = `For ${biz}, I'm crafting a carousel post: Slide 1 = bold statement, Slides 2-4 = value/tips, Slide 5 = CTA. Add emojis, use short punchy text. Hashtags: #${ind.replace(/\s+/g, '')} #Entrepreneur #SmallBusinessTips`
  } else if (lower.includes('caption') || lower.includes('hashtag')) {
    reply = `Here are 3 captions for ${biz}:\n\n1. "The secret to great ${ind.toLowerCase()}? Consistency. Here's how we do it 👇"\n2. "POV: You finally found ${ind.toLowerCase()} that actually works 🙌"\n3. "3 things I wish I knew about ${ind.toLowerCase()} before I started →"\n\nHashtags: #${ind.replace(/\s+/g, '')} #SmallBusiness #${biz.replace(/\s+/g, '')}`
  } else if (lower.includes('help') || lower.includes('not sure') || lower.includes('week')) {
    reply = `No worries, ${biz}! Here's your week's content calendar:\n\nMon: Educational tip about ${ind}\nTue: Behind-the-scenes\nWed: Customer testimonial\nThu: Product highlight\nFri: Fun/relatable meme\nSat: Community spotlight\nSun: Weekly recap + preview`
  } else if (lower.includes('video') || lower.includes('viral')) {
    reply = `Viral strategy for ${biz}! Key elements: 1) Pattern interrupt in first 3 seconds, 2) Story arc with tension, 3) Emotional payoff, 4) Shareable moment. I've scripted a 45-second concept with full shot breakdown for ${ind.toLowerCase()} content!`
  }

  return new Promise((resolve) => {
    setTimeout(() => resolve({ reply, provider: 'demo' }), 1500)
  })
}
