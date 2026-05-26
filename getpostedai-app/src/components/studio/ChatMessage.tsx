import { useState, useEffect, useRef, memo } from 'react'
import { motion } from 'framer-motion'
import { Copy, RefreshCw, ThumbsUp, Check } from 'lucide-react'

export interface ChatMessageData {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

interface ChatMessageProps {
  message: ChatMessageData
  onRegenerate?: (id: string) => void
}

const ChatMessage = memo(function ChatMessage({ message, onRegenerate }: ChatMessageProps) {
  const [displayedContent, setDisplayedContent] = useState(message.isStreaming ? '' : message.content)
  const [copied, setCopied] = useState(false)
  const streamingRef = useRef(false)

  // Typewriter effect for AI messages
  useEffect(() => {
    if (message.isStreaming && !streamingRef.current) {
      streamingRef.current = true
      let index = 0
      const interval = setInterval(() => {
        index++
        if (index <= message.content.length) {
          setDisplayedContent(message.content.slice(0, index))
        } else {
          clearInterval(interval)
        }
      }, 30)
      return () => clearInterval(interval)
    }
  }, [message.isStreaming, message.content])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = message.content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isUser = message.role === 'user'

  const bubbleVariants = {
    hidden: isUser
      ? { opacity: 0, y: 20, x: 10 }
      : { opacity: 0, y: 20, x: -10 },
    visible: { opacity: 1, y: 0, x: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <motion.div
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      layout="position"
    >
      {/* AI Avatar (only for AI messages) */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#ff0099] to-[#00ccff] flex items-center justify-center">
          <span className="font-['Bangers'] text-xs text-black tracking-wider">AI</span>
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] min-w-0`}>
        {/* Bubble */}
        <div
          className={
            isUser
              ? 'bg-gradient-to-bl from-[rgba(255,0,153,0.15)] to-[rgba(0,204,255,0.05)] border-r-[3px] border-[#ff0099] rounded-l-xl rounded-br-none rounded-bl-xl px-4 py-3'
              : 'bg-[#0a0a0a] border-l-[3px] border-[#00ccff] rounded-r-xl rounded-br-none rounded-bl-xl px-4 py-3 shadow-[0_0_15px_rgba(0,204,255,0.05)]'
          }
        >
          <p className={`text-[15px] leading-relaxed whitespace-pre-wrap break-words ${isUser ? 'text-white' : 'text-[#cccccc]'}`}>
            {displayedContent}
            {message.isStreaming && (
              <span className="inline-block w-[2px] h-[18px] bg-[#00ccff] ml-[1px] align-middle animate-pulse" />
            )}
          </p>
        </div>

        {/* Timestamp */}
        <span className="font-mono text-[11px] text-[#555555] mt-1 px-1">
          {formatTime(message.timestamp)}
        </span>

        {/* Actions row (AI messages only) */}
        {!isUser && !message.isStreaming && (
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[#555555] hover:text-[#888888] transition-colors px-2 py-1 rounded text-xs"
              title="Copy"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
            {onRegenerate && (
              <button
                onClick={() => onRegenerate(message.id)}
                className="flex items-center gap-1 text-[#555555] hover:text-[#888888] transition-colors px-2 py-1 rounded text-xs"
                title="Regenerate"
              >
                <RefreshCw size={14} />
              </button>
            )}
            <button
              className="flex items-center gap-1 text-[#555555] hover:text-[#888888] transition-colors px-2 py-1 rounded text-xs"
              title="Like"
            >
              <ThumbsUp size={14} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
})

export default ChatMessage
