// GET POSTED AI — RunPod Serverless GPU Client
// Handles video generation, image generation, and voice synthesis

import { supabase } from './supabase'

// ─── Types ─────────────────────────────────────────────────────────────────
export type RunPodJobType = 'video' | 'image' | 'voice' | 'image-upscale'

export interface RunPodJob {
  id: string
  type: RunPodJobType
  status: 'queued' | 'in-progress' | 'completed' | 'failed'
  input: Record<string, unknown>
  output?: {
    url?: string
    message?: string
    video_url?: string
    image_url?: string
    audio_url?: string
  }
  createdAt: string
  estimatedTime?: number
}

// ─── Job Submission ────────────────────────────────────────────────────────

export async function submitRunPodJob(
  type: RunPodJobType,
  input: Record<string, unknown>
): Promise<{ jobId: string; status: string }> {
  try {
    // Use Supabase Edge Function to call RunPod (hides API key)
    const { data, error } = await supabase.functions.invoke('runpod-proxy', {
      body: { type, input },
    })

    if (error) throw error
    return { jobId: data.jobId, status: data.status }
  } catch {
    // Fallback: call RunPod directly from client (less secure but works for demo)
    return submitRunPodDirect(type, input)
  }
}

// Direct RunPod call (used when Edge Function isn't deployed)
async function submitRunPodDirect(
  type: RunPodJobType,
  input: Record<string, unknown>
): Promise<{ jobId: string; status: string }> {
  const endpoints: Record<RunPodJobType, string> = {
    video: 'https://api.runpod.ai/v2/wan-video/run',      // Wan 2.1 video
    image: 'https://api.runpod.ai/v2/sdxl/run',           // SDXL image
    voice: 'https://api.runpod.ai/v2/xtts/run',           // XTTS voice
    'image-upscale': 'https://api.runpod.ai/v2/esrgan/run', // ESRGAN upscale
  }

  const keys: Record<RunPodJobType, string> = {
    video: import.meta.env.VITE_RUNPOD_VIDEO_KEY || '',
    image: import.meta.env.VITE_RUNPOD_IMAGE_KEY || '',
    voice: import.meta.env.VITE_RUNPOD_VOICE_KEY || '',
    'image-upscale': import.meta.env.VITE_RUNPOD_IMAGE_KEY || '',
  }

  const response = await fetch(endpoints[type], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${keys[type]}`,
    },
    body: JSON.stringify({ input }),
  })

  if (!response.ok) {
    throw new Error(`RunPod ${type} error: ${response.status}`)
  }

  const data = await response.json()
  return { jobId: data.id, status: data.status }
}

// ─── Job Status Polling ────────────────────────────────────────────────────

export async function getJobStatus(
  type: RunPodJobType,
  jobId: string
): Promise<RunPodJob> {
  try {
    const { data, error } = await supabase.functions.invoke('runpod-proxy', {
      body: { action: 'status', type, jobId },
    })

    if (error) throw error
    return data as RunPodJob
  } catch {
    return getJobStatusDirect(type, jobId)
  }
}

async function getJobStatusDirect(
  type: RunPodJobType,
  jobId: string
): Promise<RunPodJob> {
  const baseUrls: Record<RunPodJobType, string> = {
    video: 'https://api.runpod.ai/v2/wan-video',
    image: 'https://api.runpod.ai/v2/sdxl',
    voice: 'https://api.runpod.ai/v2/xtts',
    'image-upscale': 'https://api.runpod.ai/v2/esrgan',
  }

  const keys: Record<RunPodJobType, string> = {
    video: import.meta.env.VITE_RUNPOD_VIDEO_KEY || '',
    image: import.meta.env.VITE_RUNPOD_IMAGE_KEY || '',
    voice: import.meta.env.VITE_RUNPOD_VOICE_KEY || '',
    'image-upscale': import.meta.env.VITE_RUNPOD_IMAGE_KEY || '',
  }

  const response = await fetch(`${baseUrls[type]}/status/${jobId}`, {
    headers: { 'Authorization': `Bearer ${keys[type]}` },
  })

  const data = await response.json()

  return {
    id: jobId,
    type,
    status: data.status === 'IN_QUEUE' ? 'queued' :
            data.status === 'IN_PROGRESS' ? 'in-progress' :
            data.status === 'COMPLETED' ? 'completed' : 'failed',
    input: data.input || {},
    output: data.output,
    createdAt: data.createdAt || new Date().toISOString(),
    estimatedTime: data.delayTime,
  }
}

// ─── Convenience: Video Generation ─────────────────────────────────────────

export async function generateVideo(
  prompt: string,
  options?: {
    width?: number
    height?: number
    numFrames?: number
    fps?: number
  }
): Promise<{ jobId: string }> {
  return submitRunPodJob('video', {
    prompt,
    width: options?.width || 832,
    height: options?.height || 480,
    num_frames: options?.numFrames || 81,
    fps: options?.fps || 16,
    num_inference_steps: 30,
    guidance_scale: 7.5,
  })
}

// ─── Convenience: Image Generation ─────────────────────────────────────────

export async function generateImage(
  prompt: string,
  options?: {
    width?: number
    height?: number
    numImages?: number
    style?: string
  }
): Promise<{ jobId: string }> {
  return submitRunPodJob('image', {
    prompt,
    negative_prompt: 'blurry, low quality, distorted, ugly, deformed',
    width: options?.width || 1024,
    height: options?.height || 1024,
    num_inference_steps: 30,
    guidance_scale: 7.5,
    num_images: options?.numImages || 1,
    style_preset: options?.style || 'photographic',
  })
}

// ─── Convenience: Voice Synthesis ──────────────────────────────────────────

export async function generateVoice(
  text: string,
  speakerReferenceUrl?: string
): Promise<{ jobId: string }> {
  return submitRunPodJob('voice', {
    text,
    speaker_reference_url: speakerReferenceUrl || '',
    language: 'en',
    speed: 1.0,
  })
}

// ─── Convenience: Voice Cloning ────────────────────────────────────────────

export async function cloneVoice(
  text: string,
  audioUrl: string
): Promise<{ jobId: string }> {
  return submitRunPodJob('voice', {
    text,
    speaker_reference_url: audioUrl,
    language: 'en',
    speed: 1.0,
  })
}

// ─── Poll until complete ───────────────────────────────────────────────────

export async function pollJobUntilComplete(
  type: RunPodJobType,
  jobId: string,
  onProgress?: (job: RunPodJob) => void,
  timeoutMs = 300000
): Promise<RunPodJob> {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    const job = await getJobStatus(type, jobId)
    onProgress?.(job)

    if (job.status === 'completed' || job.status === 'failed') {
      return job
    }

    // Wait before next poll (longer for video)
    const waitTime = type === 'video' ? 5000 : type === 'image' ? 2000 : 1000
    await new Promise(r => setTimeout(r, waitTime))
  }

  throw new Error('Job timed out')
}
