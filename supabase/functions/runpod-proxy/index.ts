import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// RunPod Serverless GPU Proxy
// Routes video, image, and voice jobs to RunPod endpoints
// Keeps API keys secure (server-side only)

const RUNPOD_KEYS: Record<string, string> = {
  video: Deno.env.get('RUNPOD_VIDEO_KEY') || Deno.env.get('RUNPOD_API_KEY') || '',
  image: Deno.env.get('RUNPOD_IMAGE_KEY') || Deno.env.get('RUNPOD_API_KEY') || '',
  voice: Deno.env.get('RUNPOD_VOICE_KEY') || Deno.env.get('RUNPOD_API_KEY') || '',
  'image-upscale': Deno.env.get('RUNPOD_IMAGE_KEY') || Deno.env.get('RUNPOD_API_KEY') || '',
}

// Map job types to RunPod endpoint IDs
// You customize these after deploying your serverless endpoints
const ENDPOINT_IDS: Record<string, string> = {
  video: Deno.env.get('RUNPOD_VIDEO_ENDPOINT') || 'wan-video',
  image: Deno.env.get('RUNPOD_IMAGE_ENDPOINT') || 'sdxl',
  voice: Deno.env.get('RUNPOD_VOICE_ENDPOINT') || 'xtts',
  'image-upscale': Deno.env.get('RUNPOD_IMAGE_ENDPOINT') || 'esrgan',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const body = await req.json()
    const { action, type, input, jobId } = body

    if (!type || !ENDPOINT_IDS[type]) {
      return new Response(
        JSON.stringify({ error: `Unknown job type: ${type}. Supported: video, image, voice, image-upscale` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const endpointId = ENDPOINT_IDS[type]
    const apiKey = RUNPOD_KEYS[type]

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: `RunPod API key not configured for ${type}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ─── Submit job ──────────────────────────────────────────────────────
    if (action !== 'status') {
      const runUrl = `https://api.runpod.ai/v2/${endpointId}/run`

      const response = await fetch(runUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ input }),
      })

      if (!response.ok) {
        const errText = await response.text()
        return new Response(
          JSON.stringify({ error: `RunPod error: ${response.status} - ${errText}` }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const data = await response.json()
      return new Response(
        JSON.stringify({ jobId: data.id, status: data.status }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // ─── Check status ────────────────────────────────────────────────────
    const statusUrl = `https://api.runpod.ai/v2/${endpointId}/status/${jobId}`

    const response = await fetch(statusUrl, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })

    const data = await response.json()

    const mappedStatus = data.status === 'IN_QUEUE' ? 'queued' :
                         data.status === 'IN_PROGRESS' ? 'in-progress' :
                         data.status === 'COMPLETED' ? 'completed' : 'failed'

    return new Response(
      JSON.stringify({
        id: jobId,
        type,
        status: mappedStatus,
        input: data.input || {},
        output: data.output,
        createdAt: data.createdAt || new Date().toISOString(),
        estimatedTime: data.delayTime,
      }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
