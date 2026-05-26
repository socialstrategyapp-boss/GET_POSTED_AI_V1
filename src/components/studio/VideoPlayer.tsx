import { useState, useRef, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Download,
  Share2,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Check,
} from 'lucide-react'

export type PreviewState = 'empty' | 'loading' | 'ready' | 'error'

interface VideoPlayerProps {
  videoUrl: string | null
  state: PreviewState
  aspectRatio: '9:16' | '16:9'
  onRegenerate: () => void
  errorMessage?: string
}

const VideoPlayer = memo(function VideoPlayer({
  videoUrl,
  state,
  aspectRatio,
  onRegenerate,
  errorMessage,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [shared, setShared] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }, [isMuted])

  const toggleFullscreen = useCallback(() => {
    if (!videoRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      videoRef.current.requestFullscreen()
    }
  }, [])

  const handleDownload = useCallback(() => {
    if (!videoUrl) return
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = 'generated-video.mp4'
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [videoUrl])

  const handleShare = useCallback(async () => {
    if (!videoUrl) return
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My AI Generated Video',
          text: 'Check out this AI-generated video!',
          url: videoUrl,
        })
      } else {
        await navigator.clipboard.writeText(videoUrl)
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      }
    } catch {
      // Fallback
      try {
        await navigator.clipboard.writeText(videoUrl)
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      } catch {
        // Silently fail
      }
    }
  }, [videoUrl])

  const aspectClass = aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'
  const maxWidthClass = aspectRatio === '9:16' ? 'max-w-[280px]' : 'max-w-[480px]'

  return (
    <div className="flex flex-col items-center w-full">
      {/* Video Container */}
      <div
        className={`relative w-full ${maxWidthClass} mx-auto ${aspectClass} bg-black rounded-2xl border border-[rgba(255,255,255,0.1)] overflow-hidden shadow-[0_0_30px_rgba(0,204,255,0.08)]`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <AnimatePresence mode="wait">
          {/* Empty State */}
          {state === 'empty' && (
            <motion.div
              key="empty"
              className="absolute inset-0 flex flex-col items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Sparkles size={48} className="text-[#333333] mb-3" />
              <p className="text-[14px] text-[#555555] text-center px-6">
                Your video preview will appear here
              </p>
            </motion.div>
          )}

          {/* Loading State */}
          {state === 'loading' && (
            <motion.div
              key="loading"
              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Neon Glow Ring Spinner */}
              <div className="relative w-10 h-10">
                <div
                  className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#ff0099] border-r-[#00ccff] animate-spin"
                  style={{
                    boxShadow: '0 0 15px rgba(255, 0, 153, 0.3)',
                  }}
                />
              </div>
              <p className="text-[13px] text-[#888888] uppercase tracking-wider">Generating preview...</p>
            </motion.div>
          )}

          {/* Ready State */}
          {state === 'ready' && videoUrl && (
            <motion.div
              key="ready"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-cover"
                loop
                playsInline
                onClick={togglePlay}
                preload="metadata"
              />

              {/* Controls Overlay */}
              <AnimatePresence>
                {showControls && (
                  <motion.div
                    className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-center gap-4">
                      {/* Play/Pause */}
                      <button
                        onClick={togglePlay}
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                      >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                      </button>

                      {/* Mute/Unmute */}
                      <button
                        onClick={toggleMute}
                        className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                      >
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </button>

                      {/* Fullscreen */}
                      <button
                        onClick={toggleFullscreen}
                        className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                      >
                        <Maximize size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Center play button (when paused) */}
              {!isPlaying && (
                <motion.button
                  className="absolute inset-0 flex items-center justify-center"
                  onClick={togglePlay}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-14 h-14 rounded-full bg-[#ff0099]/80 backdrop-blur-sm flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,0,153,0.4)] hover:scale-110 transition-transform">
                    <Play size={24} className="ml-1" />
                  </div>
                </motion.button>
              )}
            </motion.div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <motion.div
              key="error"
              className="absolute inset-0 flex flex-col items-center justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AlertCircle size={32} className="text-[#ff3366]" />
              <p className="text-[13px] text-[#ff3366] text-center px-6">
                {errorMessage || 'Something went wrong'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {/* Share Button - Pink circular */}
        <button
          onClick={handleShare}
          disabled={state !== 'ready' || !videoUrl}
          className="w-10 h-10 rounded-full bg-[#ff0099] flex items-center justify-center text-black shadow-[0_0_15px_rgba(255,0,153,0.3)] hover:scale-110 hover:shadow-[0_0_25px_rgba(255,0,153,0.5)] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
          title="Share"
        >
          {shared ? <Check size={18} strokeWidth={3} /> : <Share2 size={18} />}
        </button>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={state !== 'ready' || !videoUrl}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.2)] text-white text-sm hover:border-[#ff0099] hover:text-[#ff0099] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Download size={14} />
          <span>Export</span>
        </button>

        {/* Regenerate Button */}
        <button
          onClick={onRegenerate}
          disabled={state === 'loading'}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#cccccc] text-sm hover:bg-[rgba(255,255,255,0.05)] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <RefreshCw size={14} className={state === 'loading' ? 'animate-spin' : ''} />
          <span>Regenerate</span>
        </button>
      </div>
    </div>
  )
})



export default VideoPlayer
