import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, Image, Mic, Loader2, Wand2, X, ExternalLink } from 'lucide-react'
import { submitRunPodJob, pollRunPodJob, type RunPodJob, type RunPodJobType } from '@/lib/api'

const TABS = [
  { id: 'video' as RunPodJobType, label: 'Video', icon: Video, color: '#ff0099', endpointKey: 'runpod_video_endpoint' },
  { id: 'image' as RunPodJobType, label: 'Image', icon: Image, color: '#00ccff', endpointKey: 'runpod_image_endpoint' },
  { id: 'voice' as RunPodJobType, label: 'Voice', icon: Mic, color: '#10b981', endpointKey: 'runpod_voice_endpoint' },
]

export default function MediaCreator() {
  const [activeTab, setActiveTab] = useState<RunPodJobType>('video')
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [jobResult, setJobResult] = useState<RunPodJob | null>(null)
  const [statusMsg, setStatusMsg] = useState('')

  // Endpoint IDs stored in localStorage so user only enters once
  const [endpoints, setEndpoints] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('runpod_endpoints')
    return saved ? JSON.parse(saved) : {}
  })
  const [showSetup, setShowSetup] = useState(false)

  const saveEndpoint = (key: string, value: string) => {
    const updated = { ...endpoints, [key]: value }
    setEndpoints(updated)
    localStorage.setItem('runpod_endpoints', JSON.stringify(updated))
  }

  const currentTab = TABS.find(t => t.id === activeTab)!
  const endpointId = endpoints[currentTab.endpointKey]

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return
    if (!endpointId) { setShowSetup(true); return }

    setIsGenerating(true)
    setJobResult(null)
    setStatusMsg('Submitting to RunPod GPU...')

    try {
      let input: Record<string, unknown> = {}
      if (activeTab === 'video') {
        input = { prompt, width: 832, height: 480, num_frames: 81, fps: 16, num_inference_steps: 30, guidance_scale: 7.5 }
      } else if (activeTab === 'image') {
        input = { prompt, negative_prompt: 'blurry, low quality, distorted', width: 1024, height: 1024, num_inference_steps: 30, guidance_scale: 7.5, num_images: 1 }
      } else {
        input = { text: prompt, language: 'en', speed: 1.0 }
      }

      const { jobId } = await submitRunPodJob(activeTab, endpointId, input)
      setStatusMsg(`${activeTab === 'video' ? '🎬' : activeTab === 'image' ? '🖼️' : '🎙️'} Rendering on GPU...`)

      const completed = await pollRunPodJob(
        endpointId, jobId,
        (job) => {
          if (job.status === 'queued') setStatusMsg('In queue...')
          else if (job.status === 'in-progress') setStatusMsg('Rendering on GPU...')
        },
        activeTab === 'video' ? 600000 : 120000
      )

      setJobResult(completed)
      setStatusMsg(completed.status === 'completed' ? 'Done!' : 'Failed')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setJobResult({
        id: 'error', type: activeTab, status: 'failed', input: { prompt },
        output: { message: `Error: ${msg}. Make sure your RunPod endpoint ID is correct and the endpoint is active.` },
        createdAt: new Date().toISOString(),
      })
      setStatusMsg('Error — check endpoint ID')
    } finally {
      setIsGenerating(false)
    }
  }

  const getPlaceholder = () => {
    if (activeTab === 'video') return 'A cinematic product showcase, slow motion, professional lighting...'
    if (activeTab === 'image') return 'Professional Instagram post, clean design, vibrant colors...'
    return 'Welcome to our business! We are excited to share our latest tips with you...'
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Tabs */}
      <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setJobResult(null) }}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all relative"
            style={{ color: activeTab === tab.id ? tab.color : '#888', background: activeTab === tab.id ? `${tab.color}08` : 'transparent' }}>
            <tab.icon className="w-4 h-4" />{tab.label}
            {activeTab === tab.id && <motion.div layoutId="mediaTab" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: tab.color }} />}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Setup banner if endpoint not set */}
        {!endpointId && !showSetup && (
          <div className="mb-3 p-3 rounded-lg text-xs" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
            <strong>RunPod endpoint ID needed</strong> — 
            <button onClick={() => setShowSetup(true)} className="underline ml-1">Click to paste your endpoint ID</button>
            {' '}or deploy from <a href="https://www.runpod.io/console/serverless" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" />RunPod Hub</a>
          </div>
        )}

        {/* Endpoint ID setup panel */}
        <AnimatePresence>
          {showSetup && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-3 p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-xs text-[#888] mb-2">Paste your RunPod endpoint ID (found in RunPod console → Serverless → your endpoint):</p>
              {TABS.map(tab => (
                <div key={tab.id} className="flex items-center gap-2 mb-2">
                  <tab.icon className="w-4 h-4" style={{ color: tab.color }} />
                  <span className="text-xs text-[#aaa] w-16">{tab.label}</span>
                  <input value={endpoints[tab.endpointKey] || ''} onChange={e => saveEndpoint(tab.endpointKey, e.target.value)}
                    placeholder={`${tab.label.toLowerCase()}-endpoint-id`}
                    className="flex-1 px-2 py-1 rounded text-xs bg-black/30 border border-white/10 text-white focus:outline-none focus:border-white/20" />
                </div>
              ))}
              <button onClick={() => setShowSetup(false)} className="text-xs text-[#888] hover:text-white mt-1">Done</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prompt */}
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={getPlaceholder()}
          rows={3} disabled={isGenerating}
          className="w-full p-3 rounded-xl text-sm resize-none focus:outline-none transition-all mb-3"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />

        {/* Generate button */}
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${currentTab.color}, ${currentTab.color}88)`, boxShadow: `0 0 20px ${currentTab.color}33` }}>
          {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" />{statusMsg}</>
            : <><Wand2 className="w-4 h-4" />Generate {currentTab.label}</>}
        </motion.button>

        {/* Result */}
        <AnimatePresence>
          {jobResult && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {jobResult.output?.video_url && <video src={jobResult.output.video_url} controls className="w-full rounded-lg mb-3" />}
              {jobResult.output?.image_url && <img src={jobResult.output.image_url} alt="" className="w-full rounded-lg mb-3" />}
              {jobResult.output?.audio_url && <audio src={jobResult.output.audio_url} controls className="w-full mb-3" />}
              {jobResult.output?.url && <a href={jobResult.output.url} target="_blank" rel="noreferrer" className="text-sm text-[#00ccff] underline">Download result</a>}
              {jobResult.output?.message && <p className="text-sm text-[#888]">{jobResult.output.message}</p>}
              <button onClick={() => { setJobResult(null); setStatusMsg('') }} className="mt-2 text-xs text-[#888] hover:text-white"><X className="w-3 h-3 inline" /> Close</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
