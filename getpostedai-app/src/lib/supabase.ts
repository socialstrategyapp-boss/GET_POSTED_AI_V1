import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lpmpcprejxmgeuxdhlsj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwbXBjcHJlanhtZ2V1eGRobHNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTgwMzgsImV4cCI6MjA5NTI5NDAzOH0.MVN8MZ1gQObLRrslzUqth6nyoUNx9_-U6nYHwhOZxDw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

export type { User, Session } from '@supabase/supabase-js'

// ── App-level types (used by useSupabase.ts hooks) ───────────────────────────

export interface Profile {
  id: string
  user_id: string
  business_name: string
  industry: string
  brand_voice: string
  content_preferences: string[]
  onboarding_complete: boolean
  brand_description: string
  brand_color_primary: string
  brand_color_secondary: string
  social_instagram: string
  social_tiktok: string
  social_youtube: string
  social_twitter: string
  created_at: string
  updated_at: string
  custom_brand_voice?: string
  [key: string]: unknown
}

export interface ContentItem {
  id: string
  user_id: string
  title: string
  content_type: string
  platform: string
  content: string
  prompt_used: string
  video_url?: string
  thumbnail_url?: string | null
  url?: string
  status: string
  created_at: string
  [key: string]: unknown
}

export interface ChatSession {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  [key: string]: unknown
}

export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  [key: string]: unknown
}
