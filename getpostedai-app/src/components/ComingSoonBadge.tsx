import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ComingSoonBadge() {
  const [shared, setShared] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)

  const handleShare = async () => {
    const shareData = {
      title: 'Something big is coming to Get Posted AI',
      text: '🚀 Get Posted AI has a special feature dropping soon. Watch this space!',
      url: 'https://getpostedai.com',
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText('🚀 Something big is coming to Get Posted AI → https://getpostedai.com')
        setShared(true)
        setTimeout(() => setShared(false), 2500)
      }
    } catch {
      // user cancelled or unsupported
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        right: 16,
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 6,
      }}
    >
      {/* Badge pill */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          background: 'rgba(10,10,10,0.92)',
          border: '1px solid rgba(255,0,153,0.3)',
          borderRadius: 999,
          boxShadow: '0 0 20px rgba(255,0,153,0.12)',
          overflow: 'hidden',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Label side */}
        <div
          style={{
            padding: '7px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            cursor: 'default',
          }}
          onMouseEnter={() => setTooltipOpen(true)}
          onMouseLeave={() => setTooltipOpen(false)}
          onTouchStart={() => setTooltipOpen(v => !v)}
        >
          {/* Pulsing dot */}
          <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
            <span style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: '#ff0099', opacity: 0.75,
              animation: 'csb-ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
            }}/>
            <span style={{
              position: 'relative', width: 8, height: 8, borderRadius: '50%', background: '#ff0099',
            }}/>
          </span>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.08em',
            background: 'linear-gradient(90deg, #ff0099, #00ccff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            whiteSpace: 'nowrap',
          }}>
            SPECIAL FEATURE
          </span>
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#555',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
          }}>
            COMING SOON
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.07)' }}/>

        {/* Share button */}
        <motion.button
          onClick={handleShare}
          whileHover={{ background: 'rgba(255,0,153,0.12)' }}
          whileTap={{ scale: 0.92 }}
          style={{
            padding: '7px 12px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            color: shared ? '#00ff88' : '#888',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.04em',
            transition: 'color 0.2s',
          }}
          aria-label="Share"
        >
          <AnimatePresence mode="wait">
            {shared ? (
              <motion.span
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#00ff88' }}
              >
                {/* Check icon */}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                COPIED
              </motion.span>
            ) : (
              <motion.span
                key="share"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {/* Share icon */}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                SHARE
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* Tooltip / teaser */}
      <AnimatePresence>
        {tooltipOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            style={{
              background: 'rgba(10,10,10,0.97)',
              border: '1px solid rgba(255,0,153,0.2)',
              borderRadius: 12,
              padding: '12px 16px',
              maxWidth: 220,
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>
              🔥 Something <strong style={{ color: '#fff' }}>big</strong> is dropping on Get Posted AI.<br/>
              <span style={{ color: '#ff0099', fontWeight: 700 }}>Watch this space.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes csb-ping {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
