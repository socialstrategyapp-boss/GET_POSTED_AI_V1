import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video, Image, Mic, Loader2, Download,
  Wand2, RefreshCw, X
} from 'lucide-react'
import {
  generateVideo, generateImage, generateVoice,
  pollJobUntilComplete,
  type RunPodJob,
  type RunPodJobType,
} from '@/lib/runpod'

interface MediaCreatorProps {
  businessName?: string | null
  industry?: string | null
}

const TABS = [
  { id: 'video' as RunPodJobType, label: 'Video', icon: Video, color: '#ff0099' },
  { id: 'image' as RunPodJobType, label: 'Image', icon: Image, color: '#00ccff' },
  { id: 'voice' as RunPodJobType, label: 'Voice', icon: Mic, color: '#10b981' },
]

export default function MediaCreator({ businessName, industry }: MediaCreatorProps) {
  const [activeTab, setActiveTab] = useState<RunPodJobType>('video')
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [jobResult, setJobResult] = useState<RunPodJob | null>(null)
  const [statusMessage, setStatusMessage] = useState('')

  const biz = businessName || 'your business'
  const ind = industry || 'your industry'

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return
    setIsGenerating(true)
    setJobResult(null)
    setStatusMessage('Submitting to RunPod GPU...')

    try {
      let jobId: string

      if (activeTab === 'video') {
        const result = await generateVideo(
          `For ${biz} in ${ind}: ${prompt}`,
          { width: 832, height: 480, numFrames: 81, fps: 16 }
        )
        jobId = result.jobId
      } else if (activeTab === 'image') {
        const result = await generateImage(
          `For ${biz} in ${ind}: ${prompt}`,
          { width: 1024, height: 1024, numImages: 1, style: 'photographic' }
        )
        jobId = result.jobId
      } else {
        const result = await generateVoice(prompt)
        jobId = result.jobId
      }

      setStatusMessage(`${activeTab === 'video' ? '🎬' : activeTab === 'image' ? '🖼️' : '🎙️'} Processing on GPU...`)

      const completed = await pollJobUntilComplete(
        activeTab,
        jobId,
        (job) => {
          if (job.status === 'queued') setStatusMessage('In queue...')
          else if (job.status === 'in-progress') setStatusMessage(`Rendering on GPU... ~${job.estimatedTime || '?'}s`)
        },
        activeTab === 'video' ? 600000 : 120000
      )

      setJobResult(completed)
      setStatusMessage(completed.status === 'completed' ? 'Done!' : 'Failed — using demo mode')
    } catch {
      // Fallback: simulate a result so the UI still works
      setJobResult({
        id: 'demo-' + Date.now(),
        type: activeTab,
        status: 'completed',
        input: { prompt },
        output: {
          message: activeTab === 'video'
            ? `Video generation requires a RunPod Serverless endpoint. Deploy the Wan 2.1 video template from RunPod Hub and add your endpoint ID to Supabase secrets.`
            : activeTab === 'image'
            ? `Image generation requires a RunPod Serverless endpoint. Deploy the SDXL template from RunPod Hub and add your endpoint ID to Supabase secrets.`
            : `Voice generation requires a RunPod Serverless endpoint. Deploy the XTTS template from RunPod Hub and add your endpoint ID to Supabase secrets.`,
        },
        createdAt: new Date().toISOString(),
      })
      setStatusMessage('Demo mode — deploy RunPod endpoints for real generation')
    } finally {
      setIsGenerating(false)
    }
  }

  const getPlaceholder = () => {
    if (activeTab === 'video') return `e.g. A cinematic product showcase of ${biz}, slow motion, professional lighting...`
    if (activeTab === 'image') return `e.g. Professional Instagram post for ${biz}, ${ind} aesthetic, clean design...`
    return `e.g. Welcome to ${biz}! We're excited to share our latest ${ind} tips with you...`
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Tabs */}
      <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setJobResult(null); setStatusMessage('') }}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all relative"
            style={{
              color: activeTab === tab.id ? tab.color : '#888888',
              background: activeTab === tab.id ? `${tab.color}08` : 'transparent',
            }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="mediaTab"
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: tab.color }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Prompt input */}
        <div className="mb-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={getPlaceholder()}
            rows={3}
            className="w-full p-3 rounded-xl text-sm resize-none focus:outline-none transition-all"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#ffffff',
            }}
            disabled={isGenerating}
          />
        </div>

        {/* Generate button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          style={{
            background: isGenerating
              ? 'rgba(255,255,255,0.05)'
              : activeTab === 'video' ? 'linear-gradient(135deg, #ff0099, #ff3366)'
              : activeTab === 'image' ? 'linear-gradient(135deg, #00ccff, #0066ff)'
              : 'linear-gradient(135deg, #10b981, #059669)',
            boxShadow: isGenerating ? 'none' : `0 0 20px ${activeTab === 'video' ? 'rgba(255,0,153,0.2)' : activeTab === 'image' ? 'rgba(0,204,255,0.2)' : 'rgba(16,185,129,0.2)'}`,
          }}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {statusMessage}
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Generate {activeTab === 'video' ? 'Video' : activeTab === 'image' ? 'Image' : 'Voice'}
            </>
          )}
        </motion.button>

        {/* Result */}
        <AnimatePresence>
          {jobResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 rounded-xl"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {jobResult.output?.video_url && (
                <video
                  src={jobResult.output.video_url}
                  controls
                  className="w-full rounded-lg mb-3"
                />
              )}
              {jobResult.output?.image_url && (
                <img
                  src={jobResult.output.image_url}
                  alt="Generated"
                  className="w-full rounded-lg mb-3"
                />
              )}
              {jobResult.output?.audio_url && (
                <audio
                  src={jobResult.output.audio_url}
                  controls
                  className="w-full mb-3"
                />
              )}
              {jobResult.output?.message && (
                <p className="text-sm text-[#888888]">{jobResult.output.message}</p>
              )}
              {jobResult.output?.url && (
                <a
                  href={jobResult.output.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#00ccff] hover:underline"
                >
                  <Download className="w-4 h-4" />
                  Download result
                </a>
              )}

              {/* Retry / Clear */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { setJobResult(null); setStatusMessage('') }}
                  className="flex-1 py-2 rounded-lg text-xs text-[#888888] hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <X className="w-3 h-3 inline mr-1" />
                  Close
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1 py-2 rounded-lg text-xs text-[#cccccc] hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <RefreshCw className="w-3 h-3 inline mr-1" />
                  Retry
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info */}
        {!isGenerating && !jobResult && (
          <p className="text-xs text-[#555555] mt-3 text-center">
            Powered by RunPod Serverless GPU — pay only per generation
          </p>
        )}
      </div>
    </div>
  )
}
