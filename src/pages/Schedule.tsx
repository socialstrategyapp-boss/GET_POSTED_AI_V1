import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function Schedule() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: '#050505', fontFamily: 'Inter, sans-serif', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h1 style={{ fontFamily: 'Bangers, cursive', fontSize: 22, letterSpacing: 3, background: 'linear-gradient(90deg,#ff0099,#00ccff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
          CONTENT SCHEDULE
        </h1>
        <button onClick={() => navigate('/studio')} style={{ background: 'none', border: 'none', color: '#666', fontSize: 13, cursor: 'pointer' }}>← Studio</button>
      </div>

      <div style={{ padding: '24px 20px', maxWidth: 640, margin: '0 auto' }}>

        {/* Optimise button */}
        <motion.button whileTap={{ scale: 0.97 }}
          style={{
            width: '100%', marginBottom: 20,
            background: 'linear-gradient(90deg, #ff0099, #00ccff)',
            border: 'none', borderRadius: 12, padding: '14px',
            fontFamily: 'Bangers, cursive', fontSize: 18, letterSpacing: 2, color: '#000', cursor: 'pointer',
          }}>
          ⚡ AUTO-OPTIMISE POSTING TIMES
        </motion.button>

        {/* Weekly calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 24 }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign: 'center' }}>
              <p style={{ color: '#555', fontSize: 11, marginBottom: 6 }}>{d}</p>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#333', fontSize: 18 }}>+</span>
              </div>
            </div>
          ))}
        </div>

        {/* Scheduled posts placeholder */}
        <p style={{ color: '#555', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>Scheduled Posts</p>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <p style={{ color: '#444', fontSize: 14 }}>No posts scheduled yet.</p>
          <p style={{ color: '#333', fontSize: 12 }}>Create content in the Studio and schedule it here.</p>
          <button onClick={() => navigate('/studio')} style={{
            marginTop: 12, background: 'none', border: '1px solid rgba(255,0,153,0.3)',
            borderRadius: 8, padding: '8px 20px', color: '#ff0099', fontSize: 13, cursor: 'pointer',
          }}>Go to Studio →</button>
        </div>

        {/* Manual share note */}
        <div style={{ marginTop: 20, background: 'rgba(0,204,255,0.06)', border: '1px solid rgba(0,204,255,0.15)', borderRadius: 10, padding: '12px 16px' }}>
          <p style={{ color: '#00ccff', fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>📤 Manual Sharing Available</p>
          <p style={{ color: '#666', fontSize: 12, margin: 0 }}>
            When your content is ready, tap Share to post it directly to your chosen platform via your phone's share sheet. Social API connections coming soon.
          </p>
        </div>
      </div>

      {/* Bottom nav */}
      <BottomNav />
    </div>
  )
}

function BottomNav() {
  const navigate = useNavigate()
  const items = [
    { icon: '🏠', label: 'Studio', path: '/studio' },
    { icon: '🖼️', label: 'Gallery', path: '/gallery' },
    { icon: '📅', label: 'Schedule', path: '/schedule' },
    { icon: '👤', label: 'Profile', path: '/profile' },
  ]
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', justifyContent: 'space-around', padding: '10px 0 20px',
    }}>
      {items.map(item => (
        <button key={item.path} onClick={() => navigate(item.path)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          <span style={{ color: '#555', fontSize: 10 }}>{item.label}</span>
        </button>
      ))}
    </div>
  )
}
