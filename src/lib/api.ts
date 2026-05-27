// GET POSTED AI — API Client
// Calls your Express backend (server.cjs) which uses your OpenAI key

import { supabase } from './supabase'

const API_BASE = '/api'

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
