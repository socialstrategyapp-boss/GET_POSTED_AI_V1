# RunPod Serverless GPU Setup Guide

> For GET POSTED AI — Video, Image & Voice Generation
> Your RunPod API Keys are in your local `.env` file (not on GitHub)

---

## Architecture

```
User → GitHub Pages (static site) → Supabase Edge Functions → RunPod Serverless GPU
                                         ↓
                                    OpenAI API (chat)
```

**GitHub Pages** = Free static hosting for the website
**Supabase Edge Functions** = Serverless API (handles auth, chat, RunPod proxy)
**RunPod Serverless** = GPU compute for video/image/voice (pay per use)

---

## Step 1: Deploy Video Endpoint (Wan 2.1)

You're already on RunPod Serverless > Deploy. Do this:

1. Click **"Start from a Hub listing"**
2. Click **"Video"** tab
3. Search for **"Wan 2.1"** or **"Wan"** — click it
4. Template settings:
   - **GPU**: `RTX A6000` (48GB) or `RTX A4000` (16GB) — cheaper
   - **Workers**: `Min 0` `Max 5` (scales to zero when idle = free when not in use)
   - **FlashBoot**: ON (faster cold starts)
   - **Idle Timeout**: `60` seconds
5. Click **"Deploy"**
6. After deploy, click **"API"** tab — copy the **Endpoint ID** (looks like `abc123def-456g`)

Save it as: `RUNPOD_VIDEO_ENDPOINT`

---

## Step 2: Deploy Image Endpoint (SDXL or FLUX)

1. Go to **Serverless > Deploy**
2. Click **"Start from a Hub listing"**
3. Click **"Image"** tab
4. Search for **"SDXL"** or **"FLUX"** — click FLUX for better quality
5. Template settings:
   - **GPU**: `RTX A4000` (16GB) — enough for images
   - **Workers**: `Min 0` `Max 5`
   - **FlashBoot**: ON
   - **Idle Timeout**: `60` seconds
6. Click **"Deploy"**
7. Copy the **Endpoint ID**

Save it as: `RUNPOD_IMAGE_ENDPOINT`

---

## Step 3: Deploy Voice Endpoint (XTTS)

1. Go to **Serverless > Deploy**
2. Click **"Start from a Hub listing"**
3. Click **"Audio"** tab
4. Search for **"XTTS"** — click it
5. Template settings:
   - **GPU**: `RTX A4000` (16GB)
   - **Workers**: `Min 0` `Max 3`
   - **FlashBoot**: ON
6. Click **"Deploy"**
7. Copy the **Endpoint ID**

Save it as: `RUNPOD_VOICE_ENDPOINT`

---

## Step 4: Set Supabase Secrets

After all 3 endpoints are deployed, go to your Supabase Dashboard:

**https://supabase.com/dashboard/project/lpmpcprejxmgeuxdhlsj/settings/functions**

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `RUNPOD_API_KEY` | Your RunPod key (from `.env`) |
| `RUNPOD_VIDEO_ENDPOINT` | Your Wan 2.1 endpoint ID |
| `RUNPOD_IMAGE_ENDPOINT` | Your FLUX/SDXL endpoint ID |
| `RUNPOD_VOICE_ENDPOINT` | Your XTTS endpoint ID |

---

## Step 5: Deploy the Edge Function

In your Supabase Dashboard:

1. Go to **Edge Functions**
2. Click **"New Function"**
3. Name it: `runpod-proxy`
4. Paste the code from: `supabase/functions/runpod-proxy/index.ts` in the repo
5. Click **"Deploy"**

---

## Costs (Estimated)

| Service | Usage | Cost |
|---------|-------|------|
| GitHub Pages | Static hosting | **FREE** |
| Supabase Edge Functions | API calls | **FREE** (500K/month) |
| RunPod Video (Wan 2.1) | Per 5-sec video | ~$0.05-0.15 |
| RunPod Image (FLUX) | Per image | ~$0.01-0.03 |
| RunPod Voice (XTTS) | Per 30-sec audio | ~$0.005-0.01 |
| OpenAI GPT-4o-mini | Per chat | ~$0.00015/1K tokens |

**When idle**: RunPod scales to zero workers = **$0**

---

## What Each Template Does

| Template | What it generates | Use in app |
|----------|------------------|------------|
| **Wan 2.1** | AI videos from text prompts | Video ads, product demos, social clips |
| **FLUX/SDXL** | AI images from text prompts | Instagram posts, ads, thumbnails |
| **XTTS** | AI voice / voice cloning | Voiceovers, narrations, brand voice |

---

## Frontend Integration

The app already has:
- `src/lib/runpod.ts` — RunPod API client
- `src/components/studio/MediaCreator.tsx` — Video/Image/Voice UI
- `supabase/functions/runpod-proxy/index.ts` — Secure proxy

Once endpoints are deployed, the **Generate Video/Image/Voice** buttons in Studio will work automatically.
