import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number]

function getProfile() {
  try {
    return JSON.parse(localStorage.getItem('gp_profile') || localStorage.getItem('gp_profile_v1') || '{}')
  } catch { return {} }
}
function getIntelligence() {
  try { return JSON.parse(localStorage.getItem('gp_intelligence') || '{}') } catch { return {} }
}
function getStudioSession() {
  try { return JSON.parse(localStorage.getItem('gp_studio_session') || '{}') } catch { return {} }
}

export default function CoPilot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pulse, setPulse] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Stop pulsing after first open
  const handleOpen = () => {
    setOpen(true)
    setPulse(false)
    if (messages.length === 0) {
      const profile = getProfile()
      const intelligence = getIntelligence()
      const studioSession = getStudioSession()
      const name = profile.ownerFirstName || profile.businessName || null
      const subIndustry = intelligence?.niche_intelligence?.sub_industry || profile.industry || null
      const lastContent = studioSession?.answers?.subject || studioSession?.answers?.subjectCustom || null
      
      let greeting = `Hey${name ? ` ${name}` : ''}! 👋 I'm your Get Posted AI Co-Pilot.\n\n`
      if (subIndustry) {
        greeting += `I know you're in **${subIndustry}** — so everything I suggest is built for YOUR niche, not a generic business.\n\n`
      }
      if (lastContent) {
        greeting += `I can see you're working on: *"${lastContent}"* — want me to help with that, or something different?`
      } else {
        greeting += `I'm here to create content, write captions, script videos, and grow your brand on social media. What are we making?`
      }
      setMessages([{ role: 'assistant', content: greeting }])
    }
  }

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const profile = getProfile()
      const intelligence = getIntelligence()
      const studioSession = getStudioSession()
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].slice(-12),
          profile,
          intelligence,
          studioSession, // Co-pilot knows exactly what's being built in Studio
        })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Try again in a moment.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection issue — try again.' }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages])

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {/* ── Floating Button ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 20,
          zIndex: 9999,
        }}
      >
        <AnimatePresence>
          {!open && (
            <motion.button
              key="fab"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: easeOutExpo }}
              onClick={handleOpen}
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff0099, #00ccff)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: pulse
                  ? '0 0 0 0 rgba(255,0,153,0.5)'
                  : '0 4px 24px rgba(255,0,153,0.4)',
                animation: pulse ? 'copilot-pulse 2s infinite' : 'none',
                position: 'relative',
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Open AI Co-Pilot"
            >
              {/* Sparkle icon */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="cp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fff"/>
                    <stop offset="100%" stopColor="#ffe0f7"/>
                  </linearGradient>
                </defs>
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
                  stroke="url(#cp-grad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 3v4M19 17v4M3 5h4M17 19h4" stroke="url(#cp-grad)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {/* Notification dot on first load */}
              {pulse && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 12, height: 12, borderRadius: '50%',
                  background: '#00ff88', border: '2px solid #000',
                  animation: 'copilot-dot 1.5s infinite',
                }}/>
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── Chat Panel ── */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.28, ease: easeOutExpo }}
              style={{
                position: 'fixed',
                bottom: 20,
                right: 16,
                width: 'min(380px, calc(100vw - 32px))',
                height: 'min(520px, calc(100dvh - 100px))',
                background: '#0a0a0a',
                border: '1px solid rgba(255,0,153,0.25)',
                borderRadius: 18,
                boxShadow: '0 8px 60px rgba(255,0,153,0.15), 0 0 0 1px rgba(255,255,255,0.04)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                zIndex: 9999,
              }}
            >
              {/* Header */}
              <div style={{
                padding: '14px 16px',
                background: 'linear-gradient(135deg, rgba(255,0,153,0.12), rgba(0,204,255,0.08))',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#ff0099,#00ccff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
                        stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#000"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'Bangers, sans-serif', letterSpacing: '0.05em' }}>
                      CO-PILOT
                    </div>
                    <div style={{ fontSize: 11, color: '#00ff88', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', display: 'inline-block' }}/>
                      Content AI — Online
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{
                      maxWidth: '85%',
                      padding: '10px 13px',
                      borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, #ff0099, #cc007a)'
                        : 'rgba(255,255,255,0.06)',
                      color: '#fff',
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: 'flex', gap: 5, padding: '10px 13px', background: 'rgba(255,255,255,0.06)', borderRadius: '14px 14px 14px 4px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {[0,1,2].map(i => (
                      <span key={i} style={{
                        width: 7, height: 7, borderRadius: '50%', background: '#ff0099',
                        animation: `copilot-bounce 1.2s ${i*0.15}s infinite`,
                        display: 'inline-block',
                      }}/>
                    ))}
                  </div>
                )}
                <div ref={bottomRef}/>
              </div>

              {/* Quick suggestions */}
              {messages.length <= 1 && (
                <div style={{ padding: '0 12px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['Write a caption', 'Script a Reel', 'Hashtag ideas', 'Plan my week'].map(s => (
                    <button key={s} onClick={() => { setInput(s); inputRef.current?.focus() }}
                      style={{
                        fontSize: 11, padding: '5px 10px', borderRadius: 999,
                        background: 'rgba(255,0,153,0.08)', border: '1px solid rgba(255,0,153,0.2)',
                        color: '#ff0099', cursor: 'pointer', fontWeight: 600,
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div style={{
                padding: '10px 12px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', gap: 8, alignItems: 'flex-end',
                flexShrink: 0,
              }}>
                {/* Mic button — tap to speak, Co-pilot transcribes + improves */}
                <MicButton onTranscript={(text) => setInput(prev => prev ? prev + ' ' + text : text)} />

                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => {
                    setInput(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 90) + 'px'
                  }}
                  onKeyDown={onKey}
                  placeholder="Type or speak your message…"
                  rows={1}
                  disabled={loading}
                  style={{
                    flex: 1, background: '#111', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '9px 13px', color: '#fff', fontSize: 13,
                    resize: 'none', outline: 'none', fontFamily: 'Inter, sans-serif',
                    maxHeight: 90, minHeight: 38,
                  }}
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || loading}
                  style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: input.trim() && !loading ? 'linear-gradient(135deg,#ff0099,#00ccff)' : 'rgba(255,255,255,0.08)',
                    border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !loading ? '#000' : '#555'} strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes copilot-pulse {
          0% { box-shadow: 0 0 0 0 rgba(255,0,153,0.55); }
          70% { box-shadow: 0 0 0 16px rgba(255,0,153,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,0,153,0); }
        }
        @keyframes copilot-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }
        @keyframes copilot-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </>
  )
}

// ── Mic Button — speak → transcribe → Co-pilot improves ─────────────────────
function MicButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  const toggle = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Try Chrome on Android.')
      return
    }

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-AU'
    recognitionRef.current = recognition

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      onTranscript(transcript)
    }
    recognition.start()
  }

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
      title={listening ? 'Tap to stop recording' : 'Tap to speak — Co-pilot will transcribe and improve your message'}
      style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0, border: 'none',
        background: listening
          ? 'rgba(255,0,153,0.25)'
          : 'rgba(255,255,255,0.06)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
        boxShadow: listening ? '0 0 16px rgba(255,0,153,0.4)' : 'none',
      }}
    >
      {listening ? (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff0099">
            <circle cx="12" cy="12" r="8"/>
          </svg>
        </motion.div>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      )}
    </motion.button>
  )
}

