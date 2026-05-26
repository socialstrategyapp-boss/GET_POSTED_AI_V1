import { memo } from 'react'
import { motion } from 'framer-motion'

const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      {/* AI Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#ff0099] to-[#00ccff] flex items-center justify-center">
        <span className="font-['Bangers'] text-xs text-black tracking-wider">AI</span>
      </div>
      {/* Typing Bubble */}
      <div className="bg-[#0a0a0a] border-l-[3px] border-[#00ccff] rounded-r-xl rounded-br-none rounded-bl-xl px-4 py-3 min-w-[72px] shadow-[0_0_15px_rgba(0,204,255,0.05)]">
        <div className="flex items-center gap-[6px]">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-[#00ccff]"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
})

export default TypingIndicator
