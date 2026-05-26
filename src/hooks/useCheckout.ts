import { supabase } from '@/lib/supabase'

export type Plan = 'starter' | 'pro' | 'enterprise'
export type CreditPack = '500' | '1500' | '5000' | '12000'

async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || null
}

export async function startCheckout(plan: Plan): Promise<void> {
  const token = await getAuthToken()
  if (!token) {
    window.location.href = '/auth'
    return
  }
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ plan }),
  })
  const data = await res.json()
  if (data.url) window.location.href = data.url
  else if (data.error) alert(`Payment error: ${data.error}`)
}

export async function startTopup(pack: CreditPack): Promise<void> {
  const token = await getAuthToken()
  if (!token) {
    window.location.href = '/auth'
    return
  }
  const res = await fetch('/api/stripe/topup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ pack }),
  })
  const data = await res.json()
  if (data.url) window.location.href = data.url
  else if (data.error) alert(`Payment error: ${data.error}`)
}

export async function openBillingPortal(): Promise<void> {
  const token = await getAuthToken()
  if (!token) return
  const res = await fetch('/api/stripe/portal', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (data.url) window.location.href = data.url
}
