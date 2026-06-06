# GET POSTED AI — Handoff Document

> **Created**: 2026-06-07
> **Repo**: https://github.com/socialstrategyapp-boss/GET_POSTED_AI_V1
> **Live Preview**: https://mnf2lumq6cpjo.kimi.page
> **Domain**: getpostedai.com (owned on Namecheap, DNS not yet configured)

---

## 1. Project Overview

GET POSTED AI is an AI-powered social media content creation studio. Users enter their business details, then chat with AI to generate viral content ideas, scripts, captions, and strategies for TikTok, Instagram, YouTube, Facebook, X/Twitter, and LinkedIn.

**Stack**: React 19 + TypeScript + Vite + Tailwind CSS v3.4.19 + shadcn/ui + Framer Motion + Supabase

---

## 2. What Works Right Now

| Feature | Status |
|---------|--------|
| Landing page (Home) | Ready — centered "GET POSTED AI" headline |
| Auth (magic link + Google) | Ready — with Demo Mode bypass button |
| Onboarding (5-step) | Ready — business name, industry, brand voice, website URL |
| Profile Setup | Ready |
| **Studio (AI Chat)** | Ready — multi-provider AI with full question flow |
| Gallery | Ready |
| Profile | Ready — with website URL field |
| Schedule | Ready |
| CoPilot widget | Ready — floating AI assistant |
| Welcome Tour | Ready |
| **5 Quick Prompts** | Ready — TikTok, Facebook, Reels, Help, Custom |
| **Content question flow** | Ready — platform, style, visuals, music, presenter, voice, etc. |
| API client (api.ts) | Ready — OpenAI, Gemini, LibreChat + simulation fallback |
| **Edge Functions (code)** | Ready — ai-chat, gemini-chat, libre-chat |
| **Supabase Edge Functions (deployed)** | NOT YET — needs `supabase functions deploy` |
| Stripe payments | Backend code ready — needs real Stripe keys + deploy |
| Custom domain | NOT YET — needs DNS config |

---

## 3. Project Structure

```
src/
  pages/
    Home.tsx           Landing page — hero, features, CTA
    Auth.tsx           Login/signup + Demo Mode button
    Onboarding.tsx     5-step brand setup wizard
    ProfileSetup.tsx   Profile configuration
    Studio.tsx         AI chat studio with full question flow
    Gallery.tsx        Content history grid
    Profile.tsx        Brand settings, account, usage
    Schedule.tsx       Content calendar
  components/
    Navbar.tsx, Footer.tsx, Layout.tsx  Shared layout
    CoPilot.tsx        Floating AI assistant
    WelcomeTour.tsx    Onboarding tour
    studio/            ChatMessage, TypingIndicator, VideoPlayer
    auth/              GoogleIcon, GradientText, NeonFlow, NeonSpinner
  lib/
    api.ts             AI client (multi-provider)
    supabase.ts        Supabase client
  hooks/
    useSupabase.ts     Supabase auth hook
    useCheckout.ts     Stripe checkout hook
    use-mobile.ts      Mobile detection

supabase/
  functions/
    ai-chat/index.ts      OpenAI GPT-4o-mini Edge Function
    gemini-chat/index.ts  Google Gemini Edge Function
    libre-chat/index.ts   Multi-provider Edge Function
  supabase-schema.sql      Database schema

server.cjs               Express backend with Stripe routes
```

---

## 4. AI Provider Architecture

The app supports 3 AI providers via Supabase Edge Functions:

1. **OpenAI** (`ai-chat` function) — uses `gpt-4o-mini`, reads `OPENAI_API_KEY` from Supabase secrets
2. **Google Gemini** (`gemini-chat` function) — reads `GEMINI_API_KEY` from Supabase secrets
3. **LibreChat** (`libre-chat` function) — multi-provider aggregator

The `api.ts` client tries the Edge Function first, then falls back to simulated responses.

---

## 5. The 5 Quick Prompts (Studio.tsx)

```typescript
const QUICK_PROMPTS = [
  'A TikTok or YouTube Short video with viral content',
  'Help me generate a post on X or Facebook with an image for my business',
  'Generate Reels with this week\'s trending audio and captions',
  "Not sure, can you help me make this week's content?",
  'Describe in the box below what you would like to make and I can help you',
]
```

---

## 6. The Content Question Flow (Studio.tsx)

When users pick a quick prompt or type a message, Studio guides them through a detailed question flow:

- **Platform**: TikTok, Instagram, YouTube Shorts, Facebook, LinkedIn, Twitter/X, All Platforms
- **Content Type**: Video, Image/Photo, Caption/Post, Blog Article
- **Video Style**: Cinematic, Hands Only, AI Presenter, Before & After, Faceless Tutorial, UGC, Talking Head, Documentary, Trend Adaptation, Lifestyle
- **Visual Feel**: Cinematic & Moody, Bright & Airy, Warm & Golden Hour, Dark & Premium, Natural & Organic, Bold & High Energy
- **Music**: Trending Audio, Upbeat, Calm, High Energy, Soft, Instrumental, None
- **Presenter**: Gender, Age, Style, Hair, Accessories, Background
- **Voice**: Warm & Friendly, Authoritative, Fun & Upbeat, Calm, Bold, No voiceover
- **Accent**: Australian, American, British, Indian, New Zealand, Neutral

The `buildQuestions()` function dynamically filters questions based on previous answers + user's profile data.

---

## 7. Supabase Project

| Setting | Value |
|---------|-------|
| Project URL | `https://lpmpcprejxmgeuxdhlsj.supabase.co` |
| Project Ref | `lpmpcprejxmgeuxdhlsj` |
| Anon Key | See `.env` file (not on GitHub) |
| Service Key | See `.env` file (not on GitHub) |

---

## 8. Remaining Tasks for Next Agent

### Priority 1 — Deploy Edge Functions

```bash
# Install Supabase CLI if not already
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref lpmpcprejxmgeuxdhlsj

# Set secrets (keys are in .env file — get from previous agent or user)
supabase secrets set OPENAI_API_KEY=<from .env OPENAI_KEY>
supabase secrets set OPENAI_KEY_2=<from .env OPENAI_KEY_2>
supabase secrets set OPENAI_KEY_3=<from .env OPENAI_KEY_3>
supabase secrets set GEMINI_API_KEY=<from .env GEMINI_API_KEY>

# Deploy all functions
supabase functions deploy ai-chat
supabase functions deploy gemini-chat
supabase functions deploy libre-chat
```

### Priority 2 — Stripe Activation

The `server.cjs` has Stripe routes but needs real Stripe keys. Get them from:
https://dashboard.stripe.com/apikeys

Then set in `.env`:
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ENTERPRISE` (create products in Stripe Dashboard)

### Priority 3 — Custom Domain

1. In Namecheap DNS for `getpostedai.com`, set:
   - A Record `@` → `185.199.108.153` (GitHub Pages)
   - CNAME `www` → `socialstrategyapp-boss.github.io`
2. In GitHub repo Settings > Pages > Custom domain → `getpostedai.com`
3. Enable HTTPS

### Priority 4 — GROWTH DYNAMO Audit Page

The user requested a "GROWTH DYNAMO" business audit tool. This was discussed but NOT fully implemented (not in routes). It should be a separate page at `/audit` with:
- Business audit questionnaire
- Growth strategy report generation
- Gold/emerald visual theme

### Priority 5 — Moonshot AI Integration

Two Moonshot AI keys are in `.env`. The user wanted these as additional AI providers. Add to `api.ts` and create a new Edge Function (`moonshot-chat`).

### Priority 6 — RunPod Deployment (Optional)

The user has 3 RunPod API keys. They mentioned wanting GPU cloud deployment. The current architecture uses Supabase Edge Functions (serverless, pay-per-use) which is the better fit. RunPod would only be needed for heavy video generation workloads.

---

## 9. File Checklist — What's On GitHub

| File/Folder | Status |
|-------------|--------|
| `src/pages/*.tsx` (8 pages) | Yes |
| `src/components/*.tsx` | Yes |
| `src/lib/api.ts` | Yes |
| `src/lib/supabase.ts` | Yes |
| `supabase/functions/ai-chat/` | Yes |
| `supabase/functions/gemini-chat/` | Yes |
| `supabase/functions/libre-chat/` | Yes |
| `supabase-schema.sql` | Yes |
| `server.cjs` | Yes |
| `.env` | **NO** — gitignored, kept locally only |
| `.env.example` | Yes (template, no real keys) |
| `.gitignore` | Yes (has `.env`) |
| `package.json` | Yes |
| `README.md` | Yes |

---

## 10. API Key Inventory (Keys are in local `.env` only)

**IMPORTANT**: The `.env` file is gitignored and contains ALL real keys. It lives locally at `/mnt/agents/output/app/.env`. The next agent will need these keys from the previous agent or the user directly.

### Key Types and Counts:

| Provider | Count | Location |
|----------|-------|----------|
| OpenAI Service Keys | 3 | `.env` — `OPENAI_KEY`, `OPENAI_KEY_2`, `OPENAI_KEY_3` |
| OpenAI User Keys | 2 | `.env` — `OPENAI_USER_KEY_1`, `OPENAI_USER_KEY_2` |
| Google Gemini | 1 | `.env` — `GEMINI_API_KEY` (placeholder, needs real key) |
| Moonshot AI | 2 | `.env` — `MOONSHOT_KEY_1`, `MOONSHOT_KEY_2` |
| RunPod API | 3 | `.env` — `RUNPOD_KEY_1`, `RUNPOD_KEY_2`, `RUNPOD_KEY_3` |
| Supabase Anon | 1 | `.env` — `SUPABASE_ANON_KEY` |
| Supabase Service | 1 | `.env` — `SUPABASE_SERVICE_KEY` |
| Stripe | 3+ | `.env` — all `STRIPE_*` vars (placeholders, need real keys) |

**To get real keys from user:**
- Google Gemini: https://aistudio.google.com/app/apikey
- Stripe: https://dashboard.stripe.com/apikeys

---

## 11. How to Continue Development

1. **Clone the repo**:
   ```bash
   git clone https://github.com/socialstrategyapp-boss/GET_POSTED_AI_V1.git
   cd GET_POSTED_AI_V1
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Add the `.env` file** (get keys from previous agent or user):
   ```bash
   cp .env.example .env
   # Fill in all real keys
   ```

4. **Run dev server**:
   ```bash
   npm run dev
   ```

5. **Build**:
   ```bash
   npm run build
   ```

---

## 12. Quick Reference: Supabase SQL Schema

The file `supabase-schema.sql` contains the full database schema. Key tables:

- `profiles` — user brand profiles (business name, industry, website, brand voice)
- `chat_history` — AI conversation history
- `content_items` — generated content pieces for the gallery
- `subscriptions` — Stripe subscription tracking
- `usage_logs` — credit usage tracking

---

## 13. Notes for Next Agent

- The user (Neilos / @socialstrategyapp-boss) owns `getpostedai.com` on Namecheap
- He has 3 OpenAI service keys, 2 OpenAI user keys, 2 Moonshot keys, 3 RunPod keys
- He wants **serverless** deployment (pay-per-use, not persistent pods)
- The current architecture (Supabase Edge Functions) is the correct approach
- He mentioned wanting Stripe payments integrated
- The "20 questions" referenced in earlier conversations IS the content question flow in Studio.tsx — it's already built
- The user gets frustrated if things don't work — prioritize getting the Edge Functions deployed so AI chat uses real OpenAI instead of simulation
- Demo Mode lets anyone use the app without signing in — keep this working
