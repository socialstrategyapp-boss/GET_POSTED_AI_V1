import { Routes, Route } from 'react-router-dom'
import { ToastContainer } from '@/components/Toast'
import Home from '@/pages/Home'
import CoPilot from '@/components/CoPilot'
import ComingSoonBadge from '@/components/ComingSoonBadge'
import Auth from '@/pages/Auth'
import Onboarding from '@/pages/Onboarding'
import ProfileSetup from '@/pages/ProfileSetup'
import Studio from '@/pages/Studio'
import Gallery from '@/pages/Gallery'
import Profile from '@/pages/Profile'
import Schedule from '@/pages/Schedule'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/schedule" element={<Schedule />} />
      </Routes>
      <ToastContainer />
      <CoPilot />
      <ComingSoonBadge />
    </>
  )
}
