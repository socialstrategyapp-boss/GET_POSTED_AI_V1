import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile, ContentItem, ChatSession, ChatMessage } from '@/lib/supabase'
import type { User, Session, AuthError, Provider } from '@supabase/supabase-js'

export type { Profile, ContentItem, ChatSession, ChatMessage } from '@/lib/supabase'

// ─── Demo Mode ───
const DEMO_USER: User = {
  id: 'demo-user-123',
  email: 'demo@getpostedai.com',
  user_metadata: { full_name: 'Demo User' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  role: 'authenticated',
  updated_at: new Date().toISOString(),
  identities: [],
  factors: [],
} as unknown as User

const DEMO_SESSION: Session = {
  user: DEMO_USER,
  access_token: 'demo-token',
  refresh_token: 'demo-refresh',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
} as unknown as Session

export function isDemoMode(): boolean {
  return localStorage.getItem('demoMode') === 'true'
}

export function enableDemoMode(): void {
  localStorage.setItem('demoMode', 'true')
}

export function disableDemoMode(): void {
  localStorage.removeItem('demoMode')
}

// Demo profile
const DEMO_PROFILE: Profile = {
  id: 'demo-profile',
  user_id: 'demo-user-123',
  business_name: 'Bloom & Grow Gardens',
  industry: 'Plants & Garden',
  brand_voice: 'Friendly',
  content_preferences: ['video', 'images'],
  onboarding_complete: true,
  brand_description: 'We help people bring nature indoors with beautiful plants and gardening tips.',
  brand_color_primary: '#2d5a27',
  brand_color_secondary: '#8fbc8f',
  social_instagram: '@bloomandgrow',
  social_tiktok: '@bloomgrow',
  social_youtube: 'BloomAndGrowGardens',
  social_twitter: '@bloomandgrow',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

// Demo gallery items
const DEMO_ITEMS: ContentItem[] = [
  { id: 'demo-1', user_id: 'demo-user-123', title: 'Spring Planting Tips Reel', content_type: 'video', platform: 'instagram', content: '🌱 Top 5 plants to start your spring garden! Watch till the end for our #1 pick!', prompt_used: 'Create a 30-second reel about spring planting tips', video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', thumbnail_url: null, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', status: 'completed', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'demo-2', user_id: 'demo-user-123', title: 'Monstera Monday Post', content_type: 'caption', platform: 'instagram', content: '🌿 It\'s Monstera Monday! Did you know these tropical beauties can grow up to 10 feet tall indoors? Share your Monstera pics below! 👇', prompt_used: 'Write an Instagram caption about Monstera plants', status: 'completed', created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 'demo-3', user_id: 'demo-user-123', title: 'Indoor Garden Setup', content_type: 'video', platform: 'tiktok', content: 'Transform any room into a green oasis! Here\'s how we set up this stunning indoor garden for under $100 🪴✨', prompt_used: 'Create a TikTok video script about indoor garden setup', video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', thumbnail_url: null, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', status: 'completed', created_at: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: 'demo-4', user_id: 'demo-user-123', title: 'Succulent Care Guide', content_type: 'caption', platform: 'youtube', content: '🌵 New video: The ultimate succulent care guide! Learn how to keep your succulents thriving year-round.', prompt_used: 'Write a YouTube community post about succulent care', status: 'completed', created_at: new Date(Date.now() - 86400000 * 10).toISOString() },
  { id: 'demo-5', user_id: 'demo-user-123', title: 'Plant Haul Video', content_type: 'video', platform: 'instagram', content: 'We went plant shopping and found some RARE specimens! 🌿👀', prompt_used: 'Create a plant haul video reel', video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', thumbnail_url: null, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', status: 'completed', created_at: new Date(Date.now() - 86400000 * 12).toISOString() },
  { id: 'demo-6', user_id: 'demo-user-123', title: 'Watering Schedule Template', content_type: 'idea', platform: 'instagram', content: '💧 Never overwater again! Use our free watering schedule template. Link in bio!', prompt_used: 'Generate a social media post about a watering schedule template', status: 'completed', created_at: new Date(Date.now() - 86400000 * 14).toISOString() },
]

// Demo chat sessions
const DEMO_SESSIONS: ChatSession[] = [
  { id: 'demo-session-1', user_id: 'demo-user-123', title: 'Spring Campaign Ideas', created_at: new Date(Date.now() - 86400000 * 2).toISOString(), updated_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'demo-session-2', user_id: 'demo-user-123', title: 'Product Launch Video', created_at: new Date(Date.now() - 86400000 * 5).toISOString(), updated_at: new Date(Date.now() - 86400000 * 5).toISOString() },
]

// Demo chat messages
const DEMO_MESSAGES: ChatMessage[] = [
  { id: 'demo-msg-1', session_id: 'demo-session-1', role: 'user', content: 'Create a spring campaign for our plant shop featuring monstera plants', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'demo-msg-2', session_id: 'demo-session-1', role: 'assistant', content: '🌿 Here\'s your spring Monstera campaign! I\'ve created a video showcasing the top Monstera care tips. The content highlights your expertise and drives engagement with a call-to-action to visit your shop!', created_at: new Date(Date.now() - 86400000 * 2 + 60000).toISOString() },
  { id: 'demo-msg-3', session_id: 'demo-session-1', role: 'user', content: 'Make it more fun and casual for TikTok', created_at: new Date(Date.now() - 86400000 * 2 + 120000).toISOString() },
  { id: 'demo-msg-4', session_id: 'demo-session-1', role: 'assistant', content: '🎵 TikTok-ready! I\'ve remixed your Monstera content with trending audio vibes — fast cuts, text overlays, and a playful hook: "POV: your Monstera is thriving and so are you" 🌱✨', created_at: new Date(Date.now() - 86400000 * 2 + 180000).toISOString() },
]

/* ─────────── Auth Hook ─────────── */

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

interface UseAuthReturn extends AuthState {
  isDemo: boolean
  signInWithOtp: (email: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  })

  useEffect(() => {
    // Check for demo mode first
    if (isDemoMode()) {
      setState({
        user: DEMO_USER,
        session: DEMO_SESSION,
        loading: false,
      })
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session: session ?? null,
        loading: false,
      })
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isDemoMode()) {
        setState({
          user: session?.user ?? null,
          session: session ?? null,
          loading: false,
        })
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const signInWithOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/onboarding` },
    })
    return { error }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google' as Provider,
      options: { redirectTo: `${window.location.origin}/onboarding` },
    })
    return { error }
  }, [])

  const signOut = useCallback(async () => {
    disableDemoMode()
    const { error } = await supabase.auth.signOut()
    setState({ user: null, session: null, loading: false })
    return { error }
  }, [])

  return {
    ...state,
    isDemo: isDemoMode(),
    signInWithOtp,
    signInWithGoogle,
    signOut,
  }
}

/* ─────────── Profile Hook ─────────── */

interface UseProfileReturn {
  profile: Profile | null
  loading: boolean
  error: Error | null
  saving: boolean
  fetchProfile: () => Promise<void>
  saveProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>
}

export function useProfile(userId?: string): UseProfileReturn {
  // Demo mode: return demo profile immediately
  if (isDemoMode()) {
    return {
      profile: DEMO_PROFILE,
      loading: false,
      error: null,
      saving: false,
      fetchProfile: async () => {},
      saveProfile: async () => ({ error: null }),
      updateProfile: async () => ({ error: null }),
    }
  }

  const { user } = useAuth()
  const targetUserId = userId || user?.id
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!targetUserId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: supaError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single()

      if (supaError) throw supaError
      setProfile(data as Profile)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [targetUserId])

  const saveProfile = useCallback(
    async (data: Partial<Profile>) => {
      if (!targetUserId) return { error: new Error('No user ID') }
      setSaving(true)
      try {
        const { error: supaError } = await supabase
          .from('profiles')
          .upsert(
            { user_id: targetUserId, ...data, updated_at: new Date().toISOString() } as Record<string, unknown>,
            { onConflict: 'user_id' }
          )
        if (supaError) throw supaError
        await fetchProfile()
        return { error: null }
      } catch (err) {
        return { error: err as Error }
      } finally {
        setSaving(false)
      }
    },
    [targetUserId, fetchProfile]
  )

  // Alias for compatibility
  const updateProfile = saveProfile

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return { profile, loading, error, saving, fetchProfile, saveProfile, updateProfile }
}

/* ─────────── Chat Sessions Hook ─────────── */

interface UseChatSessionsReturn {
  sessions: ChatSession[]
  loading: boolean
  error: Error | null
  fetchSessions: () => Promise<void>
  createSession: (title?: string) => Promise<{ data: ChatSession | null; error: Error | null }>
}

export function useChatSessions(userId?: string): UseChatSessionsReturn {
  // Demo mode: return demo sessions
  if (isDemoMode()) {
    return {
      sessions: DEMO_SESSIONS,
      loading: false,
      error: null,
      fetchSessions: async () => {},
      createSession: async (title = 'New Session') => {
        const newSession: ChatSession = {
          id: `demo-session-${Date.now()}`,
          user_id: 'demo-user-123',
          title: title || 'New Session',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        DEMO_SESSIONS.unshift(newSession)
        return { data: newSession, error: null }
      },
    }
  }

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchSessions = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: supaError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (supaError) throw supaError
      setSessions(data || [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const createSession = useCallback(
    async (title = 'New Session') => {
      if (!userId) return { data: null, error: new Error('No user ID') }
      try {
        const { data, error: supaError } = await supabase
          .from('chat_sessions')
          .insert({ user_id: userId, title })
          .select()
          .single()

        if (supaError) throw supaError
        setSessions((prev) => [data as ChatSession, ...prev])
        return { data: data as ChatSession, error: null }
      } catch (err) {
        return { data: null, error: err as Error }
      }
    },
    [userId]
  )

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  return { sessions, loading, error, fetchSessions, createSession }
}

/* ─────────── Chat Messages Hook ─────────── */

interface UseChatMessagesReturn {
  messages: ChatMessage[]
  loading: boolean
  error: Error | null
  sendMessage: (content: string, sessionId: string) => Promise<{ error: Error | null }>
  fetchMessages: (sessionId: string) => Promise<void>
}

export function useChatMessages(userId?: string): UseChatMessagesReturn {
  // Demo mode: return demo messages with simulated send
  if (isDemoMode()) {
    // We need to use a ref to track messages state for the simulated send
    const demoMessagesRef = useRef<ChatMessage[]>([...DEMO_MESSAGES])

    return {
      get messages() {
        return demoMessagesRef.current
      },
      loading: false,
      error: null,
      sendMessage: async (content: string, _sessionId: string) => {
        const userMsg: ChatMessage = {
          id: `demo-msg-${Date.now()}`,
          session_id: _sessionId,
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        }
        demoMessagesRef.current = [...demoMessagesRef.current, userMsg]

        // Simulate AI response after 1.5s
        setTimeout(() => {
          const aiResponses = [
            '🌿 Great idea! I\'ve drafted a post that highlights your plant expertise. Want me to adjust the tone or add a call-to-action?',
            '🪴 Love it! Here\'s a caption that pairs perfectly with your plant photos. Should I also suggest some hashtags?',
            '🌱 Awesome concept! I\'ve created a video script that\'ll engage your plant-loving audience. Want me to make it shorter?',
          ]
          const aiMsg: ChatMessage = {
            id: `demo-msg-${Date.now() + 1}`,
            session_id: _sessionId,
            role: 'assistant',
            content: aiResponses[Math.floor(Math.random() * aiResponses.length)],
            created_at: new Date().toISOString(),
          }
          demoMessagesRef.current = [...demoMessagesRef.current, aiMsg]
        }, 1500)

        return { error: null }
      },
      fetchMessages: async (_sessionId: string) => {
        // Already loaded from demo data
      },
    }
  }

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchMessages = useCallback(async (sessionId: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: supaError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (supaError) throw supaError
      setMessages(data || [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  const sendMessage = useCallback(
    async (content: string, sessionId: string) => {
      if (!userId) return { error: new Error('No user ID') }
      try {
        const { error: supaError } = await supabase
          .from('chat_messages')
          .insert({
            session_id: sessionId,
            role: 'user',
            content,
          })

        return { error: supaError }
      } catch (err) {
        return { error: err as Error }
      }
    },
    [userId]
  )

  // Real-time subscription
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { messages, loading, error, sendMessage, fetchMessages }
}

/* ─────────── Content Items Hook ─────────── */

interface UseContentItemsReturn {
  items: ContentItem[]
  loading: boolean
  error: Error | null
  fetchItems: () => Promise<void>
  deleteItem: (id: string) => Promise<{ error: Error | null }>
}

export function useContentItems(userId?: string): UseContentItemsReturn {
  // Demo mode: return demo items
  if (isDemoMode()) {
    return {
      items: DEMO_ITEMS,
      loading: false,
      error: null,
      fetchItems: async () => {},
      deleteItem: async (id: string) => {
        const idx = DEMO_ITEMS.findIndex((item) => item.id === id)
        if (idx !== -1) DEMO_ITEMS.splice(idx, 1)
        return { error: null }
      },
    }
  }

  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchItems = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: supaError } = await supabase
        .from('content_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (supaError) throw supaError
      setItems(data || [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const deleteItem = useCallback(
    async (id: string) => {
      try {
        const { error: supaError } = await supabase.from('content_items').delete().eq('id', id)
        if (supaError) throw supaError
        setItems((prev) => prev.filter((item) => item.id !== id))
        return { error: null }
      } catch (err) {
        return { error: err as Error }
      }
    },
    []
  )

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  return { items, loading, error, fetchItems, deleteItem }
}
