// Get Posted AI — Express Backend
// Port 4002 | OpenAI + Genspark + Supabase wired
'use strict'
const express   = require('express')
const path      = require('path')
const fs        = require('fs')
const { execSync, exec } = require('child_process')
require('dotenv').config()

const app  = express()
const PORT = process.env.PORT || 4002

const OPENAI_KEY = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY || ''
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lpmpcprejxmgeuxdhlsj.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''

// Supabase helper — server-side (service role, bypasses RLS)
async function supabaseAdmin() {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

// Get user from Bearer token
async function getUserFromToken(req) {
  const auth = req.headers.authorization || ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) return null
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data: { user } } = await sb.auth.getUser(token)
    return user || null
  } catch { return null }
}

app.use(express.json({ limit: '10mb' }))
app.use(express.static(path.join(__dirname, 'dist')))

// ── HEALTH ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', openai: !!OPENAI_KEY, app: 'Get Posted AI', version: '1.0.0' })
})

// ── AI CHAT ───────────────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { messages = [], profile = {}, intelligence = {}, briefingPackage = {} } = req.body
  if (!OPENAI_KEY) return res.json({ reply: 'OpenAI key not configured.' })

  // Support both old briefingPackage and new intelligence object
  const bp = (intelligence && Object.keys(intelligence).length > 0) ? intelligence : briefingPackage
  const bpClassification = bp.classification || {}
  const bpContent = bp.content_strategy || {}
  const bpCustomer = bp.customer_profile || {}
  const bpNiche = bp.niche_intelligence || {}
  const bpSEO = bp.seo_keywords || {}
  const bpIdeas = bp.ideas_bank || {}
  const subIndustry = bpClassification.primary_sub_industry_name || bpNiche.sub_industry || profile.industry || ''
  const firstName = profile.ownerFirstName || null

  const systemPrompt = `${bp.system_message || `You are the Creative Co-Pilot for Get Posted AI — dedicated to ${profile.businessName || 'this business'}.`}

${subIndustry ? `EXACT SUB-INDUSTRY: ${subIndustry}` : profile.industry ? `Industry: ${profile.industry}` : ''}
${profile.brandVoice ? `Brand Voice: ${profile.brandVoice}` : ''}
${bpCustomer.primary_buyer ? `Their Customer: ${bpCustomer.primary_buyer}` : ''}
${bpContent.best_platform ? `Best Platform: ${bpContent.best_platform}` : ''}
${bpContent.winning_tone ? `Winning Tone for this niche: ${bpContent.winning_tone}` : ''}
${bpSEO.primary?.length ? `Top Keywords: ${(bpSEO.primary || bp.seo_keywords || []).slice(0,6).join(', ')}` : ''}
${bpIdeas.video_ideas?.length ? `Ideas Bank: ${bpIdeas.video_ideas.slice(0,6).join(' | ')}` : bp.growth_ideas_bank?.length ? `Ideas Bank: ${bp.growth_ideas_bank.slice(0,6).join(' | ')}` : ''}
${bp.competitor_landscape?.content_gaps?.length ? `Content Gaps to own: ${bp.competitor_landscape.content_gaps.join(', ')}` : ''}

RULES:
- Be concise, creative, energetic
- Every suggestion is specific to this sub-industry — never generic
- Give actionable content ideas, scripts, captions
- Ask ONE clarifying question at a time if needed
- Reference their specific products/services when known
- ${firstName ? `Call them ${firstName}` : 'Be direct and personal'}
- Platform expertise: TikTok, Instagram, YouTube, Facebook, LinkedIn, Pinterest`

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }, ...messages.slice(-20)],
        max_tokens: 1200,
        temperature: 0.8
      })
    })
    const data = await resp.json()
    res.json({ reply: data.choices?.[0]?.message?.content || 'Something went wrong.' })
  } catch (e) {
    res.json({ reply: 'AI temporarily unavailable. Please try again.' })
  }
})

// ── GENERATE CONTENT (captions/scripts) ──────────────────────────────────────
app.post('/api/generate-content', async (req, res) => {
  const { businessName, industry, brandVoice, platform, contentType, topic, goal, audience } = req.body
  if (!topic) return res.status(400).json({ success: false, error: 'Topic required' })
  if (!OPENAI_KEY) return res.status(500).json({ success: false, error: 'No OpenAI key' })

  const prompt = `Generate ${contentType} for ${platform}.

Business: ${businessName || 'Not specified'}
Industry: ${industry || 'General'}
Brand Voice: ${brandVoice || 'Professional'}
Topic: ${topic}
Goal: ${goal || 'Engagement'}
Audience: ${audience || 'General audience'}

Return ONLY valid JSON with this exact structure:
{
  "hook": "attention-grabbing opening line",
  "caption": "full caption text",
  "script": "video script if applicable, otherwise null",
  "cta": "call to action",
  "hashtags": ["#tag1","#tag2","#tag3","#tag4","#tag5","#tag6","#tag7","#tag8","#tag9","#tag10"],
  "bestTime": "best time to post e.g. Tuesday 7-9pm AEST",
  "contentTips": ["tip 1","tip 2","tip 3"]
}`

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], max_tokens: 800, temperature: 0.8, response_format: { type: 'json_object' } })
    })
    const data  = await resp.json()
    const json  = JSON.parse(data.choices?.[0]?.message?.content || '{}')
    res.json({ success: true, content: json })
  } catch (e) {
    res.json({ success: false, error: e.message })
  }
})

// ── IMAGE GENERATION (Genspark gsk) ──────────────────────────────────────────
app.post('/api/generate-image', async (req, res) => {
  const { prompt, ratio = '1:1' } = req.body
  if (!prompt) return res.status(400).json({ success: false, error: 'Prompt required' })

  const outPath = `/tmp/gp-img-${Date.now()}.png`
  const cmd = `gsk img ${JSON.stringify(prompt)} -r "${ratio}" -o "${outPath}" 2>&1`

  exec(cmd, { timeout: 90000 }, async (err, stdout) => {
    if (err || !fs.existsSync(outPath)) {
      console.error('Image gen error:', err?.message, stdout)
      return res.json({ success: false, error: 'Image generation failed — try a different prompt' })
    }
    try {
      // Upload to gsk to get a public URL
      const upload = execSync(`gsk upload "${outPath}" 2>&1`, { timeout: 30000 }).toString()
      const urlMatch = upload.match(/https?:\/\/\S+/g)
      const url = urlMatch ? urlMatch[urlMatch.length - 1].trim() : null
      fs.unlinkSync(outPath)
      if (!url) throw new Error('No URL from upload')
      res.json({ success: true, url })
    } catch (e2) {
      // fallback: serve the file directly
      if (fs.existsSync(outPath)) {
        const b64 = fs.readFileSync(outPath).toString('base64')
        fs.unlinkSync(outPath)
        res.json({ success: true, url: `data:image/png;base64,${b64}` })
      } else {
        res.json({ success: false, error: 'Upload failed' })
      }
    }
  })
})

// ── VIDEO GENERATION (Genspark gsk kling) ─────────────────────────────────────
const videoJobs = new Map()

app.post('/api/generate-video', async (req, res) => {
  const { prompt, duration = 5, ratio = '9:16' } = req.body
  if (!prompt) return res.status(400).json({ success: false, error: 'Prompt required' })

  const jobId  = `vj_${Date.now()}_${Math.random().toString(36).slice(2,7)}`
  const outPath = `/tmp/gp-vid-${jobId}.mp4`

  videoJobs.set(jobId, { status: 'processing', url: null, error: null })
  res.json({ success: true, jobId })

  // Run async
  const cmd = `gsk video ${JSON.stringify(prompt)} -m "kling/v1.6/standard" -d ${duration} -r "${ratio}" -o "${outPath}" 2>&1`
  exec(cmd, { timeout: 360000 }, async (err, stdout) => {
    if (err || !fs.existsSync(outPath)) {
      console.error('Video gen error:', err?.message, stdout?.slice(0,200))
      videoJobs.set(jobId, { status: 'failed', url: null, error: 'Video generation failed' })
      return
    }
    try {
      const upload = execSync(`gsk upload "${outPath}" 2>&1`, { timeout: 60000 }).toString()
      const urlMatch = upload.match(/https?:\/\/\S+/g)
      const url = urlMatch ? urlMatch[urlMatch.length - 1].trim() : null
      fs.unlinkSync(outPath)
      if (!url) throw new Error('No URL')
      videoJobs.set(jobId, { status: 'completed', url, error: null })
    } catch (e2) {
      videoJobs.set(jobId, { status: 'failed', url: null, error: e2.message })
    }
  })
})

app.get('/api/video-status/:jobId', (req, res) => {
  const job = videoJobs.get(req.params.jobId)
  if (!job) return res.status(404).json({ status: 'not_found' })
  res.json(job)
})

// ── MASTER SUB-INDUSTRY LIST (all 250 industries × 10 subs = 2,500) ──────────
const MASTER_SUB_INDUSTRIES = [
  // Block 1 — 1–50
  ...['1.1 Fashion and clothing retail','1.2 Footwear retail','1.3 Accessories and jewellery retail','1.4 Homewares and furniture retail','1.5 Electronics retail','1.6 Toy and hobby retail','1.7 Sporting goods retail','1.8 Books and stationery retail','1.9 Gift and novelty retail','1.10 Convenience and general store'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'1',industryName:'Retail'})),
  ...['2.1 Restaurant fine dining','2.2 Restaurant casual dining','2.3 Cafe and coffee shop','2.4 Fast food and takeaway','2.5 Bakery and patisserie','2.6 Bar and pub','2.7 Food truck and mobile catering','2.8 Meal kit and meal prep delivery','2.9 Specialty food production','2.10 Catering services'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'2',industryName:'Food & Beverage'})),
  ...['3.1 General health and wellness coaching','3.2 Naturopathy and holistic health','3.3 Wellness retreat and programs','3.4 Health food and supplements retail','3.5 Corporate wellness programs','3.6 Online health platform','3.7 Weight management programs','3.8 Sleep health services','3.9 Gut health and nutrition','3.10 Immune and preventive health'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'3',industryName:'Health & Wellness'})),
  ...['4.1 Beauty salon full service','4.2 Nail salon and nail art','4.3 Lash and brow specialist','4.4 Makeup artist freelance','4.5 Spray tan and body treatments','4.6 Waxing and hair removal','4.7 Beauty school and training','4.8 Mobile beauty services','4.9 Skincare clinic and facials','4.10 Beauty product brand and retail'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'4',industryName:'Beauty & Cosmetics'})),
  ...['5.1 Gym and fitness centre','5.2 Boutique fitness studio','5.3 CrossFit and functional training','5.4 Boxing and martial arts gym','5.5 Dance fitness studio','5.6 Online fitness coaching','5.7 Fitness equipment retail','5.8 Outdoor and boot camp training','5.9 Sports performance and conditioning','5.10 Fitness app and technology'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'5',industryName:'Fitness & Gym'})),
  ...['6.1 General practice GP clinic','6.2 Specialist medical practice','6.3 Allied health clinic','6.4 Telehealth and online medical','6.5 Medical imaging and diagnostics','6.6 Pathology and testing','6.7 Private hospital or day surgery','6.8 Aged care facility','6.9 Home healthcare and nursing','6.10 Medical equipment supply'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'6',industryName:'Healthcare & Medical'})),
  ...['7.1 Physiotherapy','7.2 Chiropractic','7.3 Osteopathy','7.4 Occupational therapy','7.5 Speech pathology','7.6 Exercise physiology','7.7 Dietetics and nutrition','7.8 Podiatry','7.9 Psychology and counselling','7.10 Social work'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'7',industryName:'Allied Health'})),
  ...['8.1 Family law','8.2 Criminal law','8.3 Property and conveyancing','8.4 Commercial and corporate law','8.5 Personal injury and compensation','8.6 Immigration law','8.7 Employment law','8.8 Estate planning and probate','8.9 Intellectual property law','8.10 Boutique specialist law firm'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'8',industryName:'Legal Services'})),
  ...['9.1 General accounting practice','9.2 Tax agent and return specialist','9.3 Business advisory and CFO services','9.4 Bookkeeping services','9.5 SMSF and superannuation specialist','9.6 Financial planning and wealth','9.7 Mortgage broking','9.8 Business finance broking','9.9 Payroll services','9.10 Accounting software consulting'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'9',industryName:'Accounting & Finance'})),
  ...['10.1 Management consulting','10.2 Strategy consulting','10.3 HR and people consulting','10.4 IT consulting','10.5 Operations and process consulting','10.6 Change management consulting','10.7 Marketing consulting','10.8 Sustainability consulting','10.9 Risk and compliance consulting','10.10 Sales consulting and coaching'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'10',industryName:'Consulting'})),
  // 11–20
  ...['11.1 Mortgage broking','11.2 Financial planning and advice','11.3 Investment advisory','11.4 Insurance broking','11.5 Superannuation fund management','11.6 Credit and lending','11.7 Foreign exchange services','11.8 Asset management','11.9 Private equity and venture capital','11.10 Financial technology platform'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'11',industryName:'Financial Services'})),
  ...['12.1 Residential sales agency','12.2 Property management rental','12.3 Commercial real estate','12.4 Buyers agent','12.5 Property development','12.6 Rural and regional real estate','12.7 Holiday and short term rental','12.8 Property investment advisory','12.9 Strata and body corporate','12.10 Real estate technology platform'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'12',industryName:'Real Estate'})),
  ...['13.1 Residential home builder','13.2 Commercial construction','13.3 Renovation and fit-out','13.4 Structural engineering','13.5 Project management construction','13.6 Estimating and quantity surveying','13.7 Architectural design and drafting','13.8 Building certification','13.9 Demolition services','13.10 Construction technology'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'13',industryName:'Construction'})),
  ...['14.1 Residential electrical','14.2 Commercial electrical','14.3 Industrial electrical','14.4 Solar installation','14.5 Data and communications cabling','14.6 Air conditioning and electrical','14.7 Security system installation','14.8 EV charger installation','14.9 Electrical testing and inspection','14.10 Generator and backup power'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'14',industryName:'Trades — Electrical'})),
  ...['15.1 Residential plumbing','15.2 Commercial plumbing','15.3 Emergency plumbing','15.4 Gas fitting and installation','15.5 Hot water systems','15.6 Roofing and guttering','15.7 Drainage and stormwater','15.8 Bathroom renovations plumbing','15.9 Blocked drains specialist','15.10 Backflow prevention'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'15',industryName:'Trades — Plumbing'})),
  ...['16.1 General carpentry','16.2 Cabinet making and joinery','16.3 Decking and pergola construction','16.4 Framing and structural carpentry','16.5 Flooring installation','16.6 Furniture making','16.7 Shopfitting and retail fitout','16.8 Staircase construction','16.9 Door and window installation','16.10 Heritage timber restoration'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'16',industryName:'Trades — Carpentry'})),
  ...['17.1 Residential interior painting','17.2 Residential exterior painting','17.3 Commercial painting','17.4 Industrial painting and coatings','17.5 Decorative finishes and feature walls','17.6 Roof painting and restoration','17.7 Epoxy flooring','17.8 Airless spray painting','17.9 Graffiti removal','17.10 Signwriting and vehicle graphics'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'17',industryName:'Trades — Painting'})),
  ...['18.1 Residential garden design','18.2 Commercial landscaping','18.3 Lawn mowing and maintenance','18.4 Tree lopping and arborist','18.5 Irrigation systems','18.6 Retaining walls and paving','18.7 Swimming pool landscaping','18.8 Turf supply and laying','18.9 Native and sustainable gardens','18.10 Strata and body corporate gardens'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'18',industryName:'Landscaping'})),
  ...['19.1 Residential roofing','19.2 Commercial roofing','19.3 Roof restoration and repointing','19.4 Tile roofing','19.5 Metal and colorbond roofing','19.6 Guttering and downpipes','19.7 Skylights and roof windows','19.8 Leak detection and repair','19.9 Heritage roof restoration','19.10 Insulation installation'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'19',industryName:'Trades — Roofing'})),
  ...['20.1 House cleaning residential','20.2 End of lease cleaning','20.3 Window cleaning','20.4 Carpet and upholstery cleaning','20.5 Pest control','20.6 Pool and spa maintenance','20.7 Home security installation','20.8 Removalist and moving services','20.9 Handyman services','20.10 Appliance repair and servicing'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'20',industryName:'Home Services'})),
  // 21–50 (condensed for server efficiency — full names used for GPT classification)
  ...['21.1 Mechanical repair and servicing','21.2 Smash repair and panel beating','21.3 Tyre and wheel shop','21.4 Auto electrical','21.5 Car detailing and grooming','21.6 Windscreen repair and replacement','21.7 Car audio and accessories','21.8 Used car dealership','21.9 New car dealership','21.10 Truck and fleet servicing'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'21',industryName:'Automotive'})),
  ...['22.1 SaaS B2B software','22.2 SaaS consumer app','22.3 IT managed services','22.4 Software development','22.5 Cloud services and hosting','22.6 Tech startup','22.7 No-code and low-code platforms','22.8 Hardware and devices','22.9 Tech consulting','22.10 IT support and helpdesk'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'22',industryName:'Technology & SaaS'})),
  ...['23.1 Social media agency','23.2 SEO agency','23.3 Google Ads and PPC agency','23.4 Content marketing agency','23.5 Email marketing agency','23.6 Influencer marketing','23.7 Video marketing agency','23.8 Full-service digital agency','23.9 Marketing automation','23.10 Growth hacking and performance'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'23',industryName:'Digital Marketing'})),
  ...['24.1 WordPress development','24.2 Shopify development','24.3 Custom web app development','24.4 Frontend development','24.5 Full-stack development','24.6 UX and UI design','24.7 Web hosting and maintenance','24.8 Mobile app development','24.9 eCommerce development','24.10 Landing page and conversion design'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'24',industryName:'Web Development'})),
  ...['25.1 Wedding photography','25.2 Portrait and family photography','25.3 Commercial and product photography','25.4 Real estate photography','25.5 Event photography','25.6 Newborn and baby photography','25.7 Food photography','25.8 Fashion photography','25.9 Drone and aerial photography','25.10 Photography school and workshops'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'25',industryName:'Photography'})),
  ...['26.1 Brand identity and logo design','26.2 Print design and production','26.3 Packaging design','26.4 Motion graphics and animation','26.5 Illustration and art direction','26.6 Social media graphics','26.7 Publication and editorial design','26.8 Environmental and wayfinding design','26.9 UI and digital design','26.10 Freelance graphic designer'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'26',industryName:'Graphic Design'})),
  ...['27.1 Private tutoring','27.2 Online courses and e-learning','27.3 Vocational training and RTO','27.4 Corporate training','27.5 Language school','27.6 Music and arts school','27.7 Sports coaching and academy','27.8 Early childhood education','27.9 Special education support','27.10 Test prep and exam coaching'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'27',industryName:'Education & Training'})),
  ...['28.1 Long day care centre','28.2 Family day care','28.3 Outside school hours care','28.4 Kindergarten and preschool','28.5 Nanny and babysitting agency','28.6 Au pair agency','28.7 Baby and toddler classes','28.8 Childrens activity centre','28.9 Kids party entertainment','28.10 Childcare consulting'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'28',industryName:'Childcare'})),
  ...['29.1 Residential aged care facility','29.2 Home care and support','29.3 Community aged care programs','29.4 Dementia care specialist','29.5 Palliative and end of life care','29.6 Respite care','29.7 Aged care staffing agency','29.8 Meals on wheels and food delivery','29.9 Allied health in aged care','29.10 Aged care technology'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'29',industryName:'Aged Care'})),
  ...['30.1 Hotel and accommodation','30.2 Bed and breakfast and boutique stay','30.3 Resort and retreat','30.4 Hostel and budget accommodation','30.5 Serviced apartments','30.6 Caravan and camping park','30.7 Events venue hire','30.8 Conference and function centre','30.9 Hospitality consulting','30.10 Hospitality technology'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'30',industryName:'Hospitality'})),
  // 31–50
  ...['31.1 Travel agent retail','31.2 Tour operator','31.3 Adventure and eco tourism','31.4 Corporate travel management','31.5 Cruise specialist','31.6 Honeymoon and luxury travel','31.7 Inbound tourism and experiences','31.8 Travel technology platform','31.9 Cultural and heritage tourism','31.10 Group and educational travel'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'31',industryName:'Travel & Tourism'})),
  ...['32.1 Corporate events management','32.2 Wedding planning and coordination','32.3 Party and celebration planning','32.4 Concert and live event production','32.5 Exhibition and trade show management','32.6 Sporting event management','32.7 Conference and seminar management','32.8 Event styling and decor','32.9 AV and technical production','32.10 Entertainment booking agency'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'32',industryName:'Events'})),
  ...['33.1 Sports club and association','33.2 Leisure centre and aquatic centre','33.3 Outdoor recreation provider','33.4 Sports equipment retail','33.5 Sports coaching and academy','33.6 Sports medicine and injury clinic','33.7 Esports and gaming','33.8 Recreation and adventure park','33.9 Sports nutrition and supplements','33.10 Sports technology platform'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'33',industryName:'Sport & Recreation'})),
  ...['34.1 Veterinary clinic general practice','34.2 Pet grooming','34.3 Pet boarding and sitting','34.4 Dog training and behaviour','34.5 Pet food and products retail','34.6 Pet photography','34.7 Aquarium and exotic pets','34.8 Equestrian and horse services','34.9 Animal shelter and rescue','34.10 Pet technology and apps'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'34',industryName:'Pets & Animals'})),
  ...['35.1 Cropping and grain farming','35.2 Livestock farming and grazing','35.3 Horticulture and market gardening','35.4 Viticulture and winemaking','35.5 Aquaculture and fish farming','35.6 Organic and regenerative farming','35.7 Agricultural machinery and supply','35.8 Farm management and advisory','35.9 Rural and agribusiness consulting','35.10 Agriculture technology'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'35',industryName:'Agriculture'})),
  ...['36.1 Retail nursery general','36.2 Wholesale nursery and grower','36.3 Indoor plant specialist','36.4 Rare and collector plants','36.5 Succulent and cacti specialist','36.6 Native plant specialist','36.7 Orchid and tropical specialist','36.8 Bonsai specialist','36.9 Plant subscription box','36.10 Horticulture therapy'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'36',industryName:'Nursery & Horticulture'})),
  ...['37.1 Artisan food production','37.2 Beverage manufacturing','37.3 Meat processing and butchery','37.4 Dairy and cheese production','37.5 Bakery and confectionery production','37.6 Sauce condiment and specialty','37.7 Health and functional food','37.8 Organic certified food production','37.9 Contract food manufacturing','37.10 Food export and import'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'37',industryName:'Food Production & Manufacturing'})),
  ...['38.1 Womens fashion brand','38.2 Mens fashion brand','38.3 Childrenswear brand','38.4 Activewear and sportswear brand','38.5 Sustainable and ethical fashion','38.6 Luxury and designer fashion','38.7 Streetwear brand','38.8 Swimwear and resort wear','38.9 Accessories brand','38.10 Fashion resale and vintage'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'38',industryName:'Fashion & Apparel'})),
  ...['39.1 Residential interior design','39.2 Commercial interior design','39.3 Architectural design practice','39.4 Landscape architecture','39.5 Interior styling','39.6 Colour consulting','39.7 Kitchen and bathroom design','39.8 Furniture design and custom','39.9 Sustainable design practice','39.10 Virtual design and 3D rendering'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'39',industryName:'Interior Design & Architecture'})),
  ...['40.1 Civil and structural engineering','40.2 Mechanical engineering','40.3 Electrical engineering','40.4 Environmental engineering','40.5 Mining and resources engineering','40.6 Geotechnical engineering','40.7 Process engineering','40.8 Biomedical engineering','40.9 Aerospace engineering','40.10 Engineering consulting'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'40',industryName:'Engineering'})),
  // 41–50 + extended blocks 51–250 (representative — GPT has full context from description)
  ...['41.1 Metal fabrication and machining','41.2 Plastics manufacturing','41.3 Timber and wood products','41.4 Electronics manufacturing','41.5 Textile and garment manufacturing','41.6 Chemical manufacturing','41.7 Medical device manufacturing','41.8 Defence manufacturing','41.9 Automotive manufacturing','41.10 Contract manufacturing'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'41',industryName:'Manufacturing'})),
  ...['42.1 Road freight and trucking','42.2 Courier and parcel delivery','42.3 Warehousing and distribution','42.4 Cold chain logistics','42.5 Freight forwarding','42.6 Last mile delivery','42.7 Supply chain consulting','42.8 Fleet management','42.9 3PL and fulfilment','42.10 Logistics technology'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'42',industryName:'Logistics & Transport'})),
  ...['43.1 Solar energy installation','43.2 Wind energy','43.3 Battery storage and energy management','43.4 Oil and gas','43.5 Electricity retail and network','43.6 Water utilities','43.7 Waste to energy','43.8 Green hydrogen','43.9 Energy consulting and auditing','43.10 Smart grid technology'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'43',industryName:'Energy & Utilities'})),
  ...['44.1 Gold and precious metals mining','44.2 Coal mining','44.3 Iron ore and base metals','44.4 Lithium and battery minerals','44.5 Oil and gas exploration','44.6 Mining services and contractors','44.7 Mining technology','44.8 Environmental services mining','44.9 Geoscience and exploration','44.10 Mine safety'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'44',industryName:'Mining & Resources'})),
  ...['45.1 Film and TV production','45.2 Music production and recording','45.3 Podcast production','45.4 Digital media and publishing','45.5 Streaming platform','45.6 PR and communications','45.7 Advertising agency','45.8 Gaming and esports','45.9 Talent and entertainment agency','45.10 News and journalism'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'45',industryName:'Media & Entertainment'})),
  ...['46.1 Music artist and band','46.2 Music teacher and tutor','46.3 Recording studio','46.4 Live music venue','46.5 Arts and craft studio','46.6 Fine art gallery','46.7 Performing arts theatre and dance','46.8 Visual artist and illustrator','46.9 Arts education and workshops','46.10 Creative agency and studio'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'46',industryName:'Music & Arts'})),
  ...['47.1 Yoga studio','47.2 Meditation and mindfulness','47.3 Sound healing and therapy','47.4 Reiki and energy healing','47.5 Tarot and astrology','47.6 Crystal and metaphysical retail','47.7 Breathwork and somatic therapy','47.8 Spiritual coaching and mentoring','47.9 Wellness retreat','47.10 Pilates studio'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'47',industryName:'Spiritual & Wellness'})),
  ...['48.1 Community welfare organisation','48.2 Charity and fundraising','48.3 Social enterprise','48.4 Indigenous business and enterprise','48.5 Environmental charity','48.6 Disability support NDIS','48.7 Mental health charity','48.8 Children and youth charity','48.9 Faith-based organisation','48.10 B Corporation certified business'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'48',industryName:'Not-for-Profit & Social Enterprise'})),
  ...['49.1 Local government','49.2 State government services','49.3 Federal government','49.4 Emergency services','49.5 Defence and military','49.6 Public health administration','49.7 Regulatory body','49.8 Infrastructure and public works','49.9 Government technology','49.10 Public sector consulting'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'49',industryName:'Government & Public Sector'})),
  ...['50.1 Cryptocurrency and blockchain','50.2 Space and deep technology','50.3 Biotech and life sciences','50.4 VR and AR technology','50.5 Human longevity and biohacking','50.6 Climate tech and carbon markets','50.7 Creator economy and personal brand','50.8 Digital nomad and remote work services','50.9 Personalised and niche retail','50.10 Emerging and frontier industries'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'50',industryName:'Other / Niche'})),
  // Extended blocks 51–250 (condensed — industryName used for GPT context)
  ...['51.1 Commercial office cleaning','51.2 Industrial and warehouse cleaning','51.3 Hospital and medical cleaning','51.4 School and education facility cleaning','51.5 Strata and body corporate cleaning','51.6 Gym and fitness facility cleaning','51.7 Retail store cleaning','51.8 Construction site cleaning','51.9 Biohazard and crime scene cleaning','51.10 Graffiti removal services'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'51',industryName:'Cleaning & Facilities Management'})),
  ...['52.1 Manned security guarding','52.2 Mobile patrol security','52.3 Event security','52.4 Retail loss prevention','52.5 Close personal protection bodyguard','52.6 CCTV installation and monitoring','52.7 Alarm system installation and monitoring','52.8 Cybersecurity services','52.9 Access control systems','52.10 Security consulting and risk assessment'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'52',industryName:'Security Services'})),
  ...['53.1 Executive recruitment and search','53.2 Temporary and contract staffing','53.3 Labour hire','53.4 HR outsourcing and advisory','53.5 Payroll outsourcing','53.6 Employee engagement and culture','53.7 Workplace training and development','53.8 Outplacement and career transition','53.9 Diversity and inclusion advisory','53.10 Performance management consulting'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'53',industryName:'Human Resources & Recruitment'})),
  ...['100.1 Cryptocurrency exchange','100.2 Crypto wallet and custody','100.3 Blockchain development','100.4 NFT marketplace and creation','100.5 DeFi decentralised finance','100.6 Crypto tax accounting','100.7 Web3 consulting and development','100.8 Smart contract auditing','100.9 Tokenisation and asset management','100.10 Crypto education and community'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'100',industryName:'Cryptocurrency & Blockchain'})),
  ...['103.1 AI software development','103.2 Machine learning consulting','103.3 Natural language processing','103.4 Computer vision solutions','103.5 AI for healthcare','103.6 AI for finance and trading','103.7 AI for retail and ecommerce','103.8 Conversational AI and chatbots','103.9 AI ethics and governance consulting','103.10 AI training data and annotation'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'103',industryName:'Artificial Intelligence'})),
  ...['107.1 Payment processing solutions','107.2 Buy now pay later platform','107.3 Peer-to-peer lending platform','107.4 Robo-advisory and automated investing','107.5 Open banking solutions','107.6 Digital identity verification','107.7 RegTech regulatory technology','107.8 InsurTech insurance technology','107.9 PropTech property technology','107.10 AgriTech agricultural technology'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'107',industryName:'Fintech'})),
  ...['114.1 Social media agency full service','114.2 Instagram management specialist','114.3 TikTok content and strategy','114.4 YouTube channel management','114.5 LinkedIn B2B social media','114.6 Influencer talent management','114.7 UGC creator agency','114.8 Social commerce consulting','114.9 Community management','114.10 Social media analytics and reporting'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'114',industryName:'Social Media & Influencer'})),
  ...['151.1 Meditation app development','151.2 Mindfulness corporate programs','151.3 Mindfulness-based stress reduction','151.4 Online meditation courses','151.5 Meditation retreat centre','151.6 Mindfulness coaching','151.7 Childrens mindfulness programs','151.8 Mindfulness for schools','151.9 Sleep and relaxation programs','151.10 Breathwork and pranayama teaching'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'151',industryName:'Meditation & Mindfulness'})),
  ...['152.1 Hot yoga studio','152.2 Hatha and traditional yoga','152.3 Vinyasa and flow yoga','152.4 Yin and restorative yoga','152.5 Yoga teacher training 200hr','152.6 Online yoga platform','152.7 Yoga retreat and immersive','152.8 Aerial yoga','152.9 Yoga for seniors','152.10 Yoga for pregnancy and postnatal'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'152',industryName:'Yoga & Movement'})),
  ...['153.1 Reformer pilates studio','153.2 Mat pilates classes','153.3 Clinical pilates rehabilitation','153.4 Pilates teacher training','153.5 Online pilates platform','153.6 Pilates for athletes','153.7 Pilates for prenatal and postnatal','153.8 Pilates equipment retail','153.9 Corporate pilates programs','153.10 Pilates for aged care'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'153',industryName:'Pilates'})),
  ...['172.1 Pelvic floor physiotherapy','172.2 Womens health GP services','172.3 Fertility and IVF support','172.4 Pregnancy and antenatal care','172.5 Postnatal care and support','172.6 Menopause support clinic','172.7 Endometriosis specialist','172.8 Womens mental health','172.9 Breast health and screening','172.10 Gynaecology specialist services'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'172',industryName:"Women's Health"})),
  ...['74.1 Wedding venue','74.2 Wedding catering','74.3 Wedding photography','74.4 Wedding videography','74.5 Wedding styling and decor','74.6 Wedding cake and desserts','74.7 Wedding dress and bridal boutique','74.8 Wedding hair and makeup','74.9 Wedding music and entertainment','74.10 Honeymoon and travel planning'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'74',industryName:'Wedding Industry'})),
  ...['201.1 Kitchen renovation specialist','201.2 Bathroom renovation specialist','201.3 Laundry and utility renovation','201.4 Home extension and additions','201.5 Granny flat construction','201.6 Basement conversion','201.7 Garage conversion and fitout','201.8 Home theatre and AV installation','201.9 Solar and energy upgrade','201.10 Heritage home restoration'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'201',industryName:'Home Renovation & Improvement'})),
  ...['208.1 Residential solar installation','208.2 Commercial solar installation','208.3 Carport solar installation','208.4 Battery storage Tesla Powerwall','208.5 Off-grid solar systems','208.6 Solar hot water systems','208.7 EV charging combined with solar','208.8 Virtual power plant enrolment','208.9 Solar monitoring and performance','208.10 Solar panel cleaning and maintenance'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'208',industryName:'Solar & Battery'})),
  ...['250.1 Space tourism support services','250.2 Human longevity and biohacking','250.3 Psychedelic-assisted therapy clinical','250.4 Climate tech and carbon markets','250.5 Cellular agriculture','250.6 Ocean technology and blue economy','250.7 Digital nomad and remote work services','250.8 Creator economy support services','250.9 Personal data ownership platforms','250.10 Synthetic media and deepfake detection'].map(s=>({code:s.split(' ')[0],name:s.split(' ').slice(1).join(' '),industryCode:'250',industryName:'Emerging & Niche Industries'})),
]

// ── HELPER: GPT call ──────────────────────────────────────────────────────────
async function gptCall(prompt, maxTokens = 1200, jsonMode = true) {
  const body = {
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature: 0.5,
  }
  if (jsonMode) body.response_format = { type: 'json_object' }
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify(body),
  })
  const data = await resp.json()
  const content = data.choices?.[0]?.message?.content || '{}'
  return jsonMode ? JSON.parse(content) : content
}

// ── HELPER: Crawl with gsk ─────────────────────────────────────────────────────
function crawlUrl(url) {
  try {
    return execSync(`gsk crawl "${url}" 2>/dev/null`, { timeout: 45000 }).toString().slice(0, 6000)
  } catch {
    try {
      return execSync(`gsk crawl "${url}" --render_js 2>/dev/null`, { timeout: 60000 }).toString().slice(0, 6000)
    } catch { return '' }
  }
}

// ── PRE-CLASSIFY — fires as soon as businessName + website entered ─────────────
// Runs while user is still answering questions 3–7 in onboarding
// Returns 3–4 suggested top-level industry codes GPT thinks are most likely
app.post('/api/pre-classify', async (req, res) => {
  const { businessName, website } = req.body
  if (!businessName) return res.json({ suggestedIndustryCodes: [] })
  if (!OPENAI_KEY) return res.json({ suggestedIndustryCodes: [] })

  // Don't block — do quick search + name analysis only (no full crawl yet)
  let searchSnippet = ''
  try {
    searchSnippet = execSync(
      `gsk search "${businessName.replace(/"/g, '')} business industry" 2>/dev/null`,
      { timeout: 20000 }
    ).toString().slice(0, 2000)
  } catch {}

  const industryList = [
    '1:Retail','2:Food & Beverage','3:Health & Wellness','4:Beauty & Cosmetics',
    '5:Fitness & Gym','6:Healthcare & Medical','7:Allied Health','8:Legal Services',
    '9:Accounting & Finance','10:Consulting','11:Financial Services','12:Real Estate',
    '13:Construction','14:Trades Electrical','15:Trades Plumbing','16:Trades Carpentry',
    '17:Trades Painting','18:Landscaping','19:Trades Roofing','20:Home Services',
    '21:Automotive','22:Technology & SaaS','23:Digital Marketing','24:Web Development',
    '25:Photography','26:Graphic Design','27:Education & Training','28:Childcare',
    '29:Aged Care','30:Hospitality','31:Travel & Tourism','32:Events',
    '33:Sport & Recreation','34:Pets & Animals','35:Agriculture','36:Nursery & Horticulture',
    '37:Food Production & Manufacturing','38:Fashion & Apparel','39:Interior Design & Architecture',
    '40:Engineering','41:Manufacturing','42:Logistics & Transport','43:Energy & Utilities',
    '44:Mining & Resources','45:Media & Entertainment','46:Music & Arts',
    '47:Spiritual & Wellness','48:Not-for-Profit','49:Government','50:Other / Niche'
  ].join('\n')

  try {
    const result = await gptCall(`You are an industry classifier. Based only on the business name and any web search snippets below, return the 3 most likely industry codes from this list. Return ONLY JSON.

Business Name: ${businessName}
Website: ${website || 'not provided'}
Web search snippets: ${searchSnippet || 'none available'}

Industry list (code:name):
${industryList}

Return JSON: { "suggestedIndustryCodes": ["1","2","3"], "confidence": "high/medium/low", "reasoning": "brief reason" }`, 200)
    return res.json(result)
  } catch {
    return res.json({ suggestedIndustryCodes: [] })
  }
})

// ── FULL INTELLIGENCE SCAN — fires on profile save ────────────────────────────
// COMMAND 7 → 1 → 2 → 3 → 4 → 5 (full pipeline)
app.post('/api/scan-business', async (req, res) => {
  const { website, businessName, industry, industryCode, sells, audience, brandVoice, country = 'Australia' } = req.body
  if (!businessName) return res.status(400).json({ success: false, error: 'Business name required' })
  if (!OPENAI_KEY) return res.status(500).json({ success: false, error: 'No OpenAI key configured' })

  // Respond immediately so profile save doesn't hang — intelligence builds async
  // For now, await the core scan (< 30s), then return. Background-async on heavy parts.
  try {

    // ── STEP 1: Crawl website ─────────────────────────────────────────────────
    let crawlData = ''
    if (website) crawlData = crawlUrl(website)

    // ── STEP 2: Web search for business ──────────────────────────────────────
    let searchData = ''
    try {
      searchData = execSync(
        `gsk search "${businessName.replace(/"/g, '')} ${country}" 2>/dev/null`,
        { timeout: 20000 }
      ).toString().slice(0, 3000)
    } catch {}

    // ── STEP 3: Sub-industry classification (Guess Who elimination) ───────────
    // Uses: business name + website crawl + search snippets + user's onboarding answers
    // Eliminates from 2,500 down to exact sub-industry
    const subIndustryList = MASTER_SUB_INDUSTRIES.map(s => `${s.code} ${s.industryName} — ${s.name}`).join('\n')

    const classifyPrompt = `You are an elite business intelligence analyst with access to a master list of 2,500 business sub-industries.

Your job: Identify the EXACT sub-industry this business belongs to. Not the broad category — the precise niche.

Use the "Guess Who" elimination method:
1. Start with all 2,500 sub-industries
2. Eliminate using every piece of evidence available
3. Narrow down to 1 exact match (plus 1–2 close alternatives)

EVIDENCE:
Business Name: ${businessName}
Website URL: ${website || 'not provided'}
Industry selected by user: ${industry || 'not specified'} (code: ${industryCode || 'unknown'})
What they sell: ${sells || 'not specified'}
Who they sell to: ${audience || 'not specified'}
Brand voice: ${brandVoice || 'not specified'}
Country: ${country}

Website content (first 4000 chars):
${crawlData ? crawlData.slice(0, 4000) : 'Not available — use business name and context clues'}

Web search results:
${searchData ? searchData.slice(0, 2000) : 'Not available'}

MASTER SUB-INDUSTRY LIST:
${subIndustryList}

Return ONLY valid JSON:
{
  "primary_sub_industry_code": "36.4",
  "primary_sub_industry_name": "Rare and collector plants",
  "primary_industry_name": "Nursery & Horticulture",
  "secondary_sub_industry_code": "36.3",
  "secondary_sub_industry_name": "Indoor plant specialist",
  "confidence": "High",
  "classification_evidence": ["sells rare aroids from website copy", "prices $50-$800 suggesting collector market", "Instagram-linked plant community language"],
  "eliminated_because": "Not a general garden centre (no tools/soil mentioned), not wholesale (retail prices shown), not landscaping (no outdoor services)"
}`

    const classification = await gptCall(classifyPrompt, 800)

    // ── STEP 4: Build MASTER_BRIEFING_PACKAGE ────────────────────────────────
    const briefingPrompt = `You are the world's most advanced marketing intelligence AI. You have identified that ${businessName} operates in the sub-industry: "${classification.primary_sub_industry_name}" (${classification.primary_industry_name}).

Build a complete MASTER_BRIEFING_PACKAGE for this business. Every insight must be LASER-SPECIFIC to this exact sub-industry — not the broad industry, not generic advice.

BUSINESS CONTEXT:
Name: ${businessName}
Website: ${website || 'not provided'}
Sub-Industry: ${classification.primary_sub_industry_name}
Industry: ${classification.primary_industry_name}
Country: ${country}
Sells: ${sells || 'unknown'}
Audience: ${audience || 'unknown'}
Brand Voice: ${brandVoice || 'unknown'}
Website Content: ${crawlData ? crawlData.slice(0, 3000) : 'not available'}

Return ONLY valid JSON with this complete structure:
{
  "business_profile": {
    "name": "${businessName}",
    "tagline": "their tagline or null",
    "location": "city/state if found or null",
    "products_services": ["specific product/service 1","specific product/service 2","specific product/service 3"],
    "price_range": "budget/mid/premium",
    "unique_selling_point": "their specific USP based on evidence"
  },
  "brand_identity": {
    "voice": "specific description of their tone",
    "colours": ["#hex1","#hex2"],
    "personality": ["trait1","trait2","trait3"]
  },
  "niche_intelligence": {
    "sub_industry": "${classification.primary_sub_industry_name}",
    "industry": "${classification.primary_industry_name}",
    "confidence": "${classification.confidence}",
    "market_size_estimate": "estimated market size in ${country}",
    "growth_direction": "growing/stable/declining",
    "key_market_drivers": ["driver1","driver2","driver3"],
    "seasonal_patterns": ["e.g. peaks in spring for plant businesses"]
  },
  "customer_profile": {
    "primary_buyer": "specific description e.g. plant enthusiast aged 25-40 who follows plant accounts on Instagram",
    "age_range": "25-40",
    "platform_preference": ["Instagram","TikTok","Pinterest"],
    "purchase_triggers": ["trigger1","trigger2","trigger3"],
    "top_fears": ["fear1","fear2","fear3"],
    "top_desires": ["desire1","desire2","desire3"],
    "avg_spend": "estimated average spend per purchase",
    "research_behaviour": "how they research before buying"
  },
  "competitor_landscape": {
    "top_competitors": [
      {"name": "competitor 1","weakness": "their main weakness","opportunity": "how to beat them"},
      {"name": "competitor 2","weakness": "their main weakness","opportunity": "how to beat them"},
      {"name": "competitor 3","weakness": "their main weakness","opportunity": "how to beat them"}
    ],
    "positioning_unclaimed": "the market position no competitor currently owns in this sub-industry",
    "content_gaps": ["content topic nobody is making in this niche 1","content topic 2","content topic 3"]
  },
  "content_strategy": {
    "best_platform": "the single most important platform for this sub-industry right now",
    "best_format": "the content format that performs best in this niche",
    "posting_frequency": "optimal posting frequency",
    "winning_tone": "the tone that wins with this specific audience",
    "underserved_topic": "the single most underserved content topic in this niche"
  },
  "seo_keywords": {
    "primary": ["keyword1","keyword2","keyword3","keyword4","keyword5"],
    "long_tail": ["long tail keyword 1","long tail keyword 2","long tail keyword 3"],
    "local": ["local keyword 1","local keyword 2"],
    "fastest_win": "the single keyword this business could rank for within 90 days"
  },
  "hashtag_library": {
    "instagram_tier1_broad": ["#tag1","#tag2","#tag3","#tag4","#tag5"],
    "instagram_tier2_niche": ["#tag1","#tag2","#tag3","#tag4","#tag5","#tag6","#tag7","#tag8"],
    "instagram_tier3_local": ["#tag1","#tag2","#tag3"],
    "tiktok_trending": ["#tag1","#tag2","#tag3","#tag4","#tag5"],
    "linkedin": ["#tag1","#tag2","#tag3"]
  },
  "ideas_bank": {
    "video_ideas": [
      "Specific video idea 1 for this exact sub-industry",
      "Specific video idea 2",
      "Specific video idea 3",
      "Specific video idea 4",
      "Specific video idea 5",
      "Specific video idea 6",
      "Specific video idea 7",
      "Specific video idea 8",
      "Specific video idea 9",
      "Specific video idea 10"
    ],
    "image_ideas": ["Specific image idea 1","Specific image idea 2","Specific image idea 3","Specific image idea 4","Specific image idea 5"],
    "blog_ideas": [
      {"title": "SEO blog title 1","keyword": "target keyword","why_ranks": "brief reason"},
      {"title": "SEO blog title 2","keyword": "target keyword","why_ranks": "brief reason"},
      {"title": "SEO blog title 3","keyword": "target keyword","why_ranks": "brief reason"}
    ],
    "series_concept": {
      "name": "Unique branded series name for this business",
      "concept": "What the series covers",
      "why_audience_loves_it": "Specific reason this audience will follow it"
    }
  },
  "audience_persona": {
    "name": "Give them a name e.g. Plant Parent Priya",
    "description": "Who they are in 2 sentences",
    "what_makes_them_buy": "The specific trigger",
    "what_makes_them_leave": "The specific turn-off",
    "content_they_love": ["format1","format2"],
    "content_they_hate": ["format1","format2"]
  },
  "roadmap_2yr": {
    "overview": "One sentence framing what success looks like for this business in 2 years — specific to their sub-industry",
    "month_1": {
      "theme": "Foundation — the one thing that unlocks everything else",
      "week_1": {
        "focus": "single focus for this week",
        "actions": ["specific action 1","specific action 2","specific action 3"],
        "win": "the one result they should see by end of week 1"
      },
      "week_2": {
        "focus": "single focus",
        "actions": ["action 1","action 2","action 3"],
        "win": "result by end of week 2"
      },
      "week_3": {
        "focus": "single focus",
        "actions": ["action 1","action 2","action 3"],
        "win": "result by end of week 3"
      },
      "week_4": {
        "focus": "First milestone review + double down",
        "actions": ["action 1","action 2","action 3"],
        "win": "what they should have achieved by end of month 1"
      }
    },
    "month_2": {
      "theme": "theme for month 2",
      "focus": "what to build this month",
      "actions": ["action 1","action 2","action 3","action 4","action 5"],
      "milestone": "measurable result by end of month 2"
    },
    "month_3": {
      "theme": "theme for month 3",
      "focus": "what to build this month",
      "actions": ["action 1","action 2","action 3","action 4","action 5"],
      "milestone": "measurable result by end of month 3",
      "checkin_prompt": "At 3 months — review these 3 things and book your progress check-in"
    },
    "months_4_to_6": {
      "theme": "theme for this quarter",
      "month_4": { "focus": "focus", "key_action": "the most important move this month", "milestone": "result" },
      "month_5": { "focus": "focus", "key_action": "key action", "milestone": "result" },
      "month_6": { "focus": "focus", "key_action": "key action", "milestone": "result", "checkin_prompt": "6-month mark — time for your progress check-in report" }
    },
    "months_7_to_12": {
      "theme": "Scaling what works — cutting what doesn't",
      "q3": { "focus": "months 7-9 focus", "big_move": "the single most important strategic move", "milestone": "result" },
      "q4": { "focus": "months 10-12 focus", "big_move": "strategic move", "milestone": "end of year 1 result", "checkin_prompt": "12-month anniversary — full progress report time" }
    },
    "year_2": {
      "theme": "From business to brand",
      "h1": {
        "focus": "months 13-18 focus",
        "big_moves": ["strategic move 1","strategic move 2"],
        "milestone": "where they should be at 18 months"
      },
      "h2": {
        "focus": "months 19-24 focus",
        "big_moves": ["strategic move 1","strategic move 2"],
        "milestone": "where they should be at 24 months — the 2-year vision achieved"
      }
    },
    "checkin_schedule": {
      "month_3": "Progress check — are you on track? Quick 5-question review unlocks your updated 90-day plan",
      "month_6": "Halfway review — what changed, what worked, what to pivot. Updated roadmap generated",
      "month_12": "Year 1 complete — full business review, new 12-month plan, celebrate your wins"
    }
  },
  "system_message": "You are the dedicated AI content creation partner for ${businessName}. You are an expert in ${classification.primary_sub_industry_name} — the specific niche this business operates in. You know their competitors, their customers, their keywords, their content opportunities, and their full 2-year growth roadmap. Every suggestion you make is laser-focused on this exact sub-industry. You never give generic advice. You speak to the owner by their first name when known. You make every session feel like you have been working with this business for years."
}`

    const briefingPackage = await gptCall(briefingPrompt, 2000)

    // Merge classification into package
    briefingPackage.classification = classification

    // Save intelligence to Supabase if user token present
    try {
      const user = await getUserFromToken(req)
      if (user && SUPABASE_SERVICE_KEY) {
        const sb = await supabaseAdmin()
        await sb.from('intelligence').upsert({
          user_id: user.id,
          briefing_package: briefingPackage,
          sub_industry: classification.primary_sub_industry_name,
          industry_code: classification.primary_sub_industry_code,
          scanned_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      }
    } catch { /* silent */ }

    res.json({
      success: true,
      intelligence: briefingPackage,
      sub_industry: classification.primary_sub_industry_name,
      industry: classification.primary_industry_name,
      confidence: classification.confidence,
    })

  } catch (e) {
    console.error('Intelligence scan error:', e.message)
    res.json({ success: false, error: e.message })
  }
})

// ── SUPABASE PROFILE API ───────────────────────────────────────────────────────
app.get('/api/profile', async (req, res) => {
  const user = await getUserFromToken(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const sb = await supabaseAdmin()
    const { data, error } = await sb.from('profiles').select('*').eq('id', user.id).single()
    if (error) return res.status(404).json({ error: 'Profile not found' })
    res.json({ profile: data })
  } catch (e) {
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/credits', async (req, res) => {
  const user = await getUserFromToken(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const sb = await supabaseAdmin()
    const { data } = await sb.from('profiles').select('credits, plan, credits_reset_at').eq('id', user.id).single()
    res.json({ credits: data?.credits ?? 0, plan: data?.plan ?? 'starter', credits_reset_at: data?.credits_reset_at })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/credits/spend', async (req, res) => {
  const user = await getUserFromToken(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const { amount, description } = req.body
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' })
  try {
    const sb = await supabaseAdmin()
    const { data: profile } = await sb.from('profiles').select('credits').eq('id', user.id).single()
    const current = profile?.credits ?? 0
    if (current < amount) return res.status(402).json({ error: 'Insufficient credits', credits: current })
    const newBalance = current - amount
    await sb.from('profiles').update({ credits: newBalance }).eq('id', user.id)
    await sb.from('credit_ledger').insert({
      user_id: user.id, amount: -amount, type: 'spend',
      description: description || 'Content generation', balance_after: newBalance,
    })
    res.json({ success: true, credits: newBalance, spent: amount })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/intelligence/save', async (req, res) => {
  const user = await getUserFromToken(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const { briefing_package, sub_industry, industry_code } = req.body
  try {
    const sb = await supabaseAdmin()
    await sb.from('intelligence').upsert({
      user_id: user.id, briefing_package, sub_industry, industry_code, scanned_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── STRIPE PAYMENTS ───────────────────────────────────────────────────────────
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

// Stripe price IDs per plan (set in .env once you create products in Stripe dashboard)
const PLAN_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER || '',
  pro: process.env.STRIPE_PRICE_PRO || '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || '',
}

const PLAN_CREDITS = { starter: 300, pro: 1000, enterprise: 4000 }

function getStripe() {
  if (!STRIPE_SECRET || STRIPE_SECRET === 'sk_test_placeholder') return null
  return require('stripe')(STRIPE_SECRET)
}

// Create checkout session → redirect to Stripe hosted page
app.post('/api/stripe/checkout', async (req, res) => {
  const user = await getUserFromToken(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const { plan } = req.body
  const stripe = getStripe()
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured yet' })
  const priceId = PLAN_PRICES[plan]
  if (!priceId || priceId.includes('placeholder')) return res.status(400).json({ error: 'Invalid plan' })
  try {
    const sb = await supabaseAdmin()
    const { data: profile } = await sb.from('profiles').select('stripe_customer_id, email').eq('id', user.id).single()

    // Get or create Stripe customer
    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        metadata: { supabase_uid: user.id },
      })
      customerId = customer.id
      await sb.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `https://getpostedai.com/studio?payment=success&plan=${plan}`,
      cancel_url: `https://getpostedai.com/studio?payment=cancelled`,
      metadata: { supabase_uid: user.id, plan },
      subscription_data: { metadata: { supabase_uid: user.id, plan } },
    })
    res.json({ url: session.url, session_id: session.id })
  } catch (e) {
    console.error('Stripe checkout error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// Create credit top-up checkout
app.post('/api/stripe/topup', async (req, res) => {
  const user = await getUserFromToken(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const { pack } = req.body // '500' | '1500' | '5000' | '12000'
  const stripe = getStripe()
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured yet' })

  const TOPUP_PRICES = {
    '500':   { amount: 1999, credits: 500 },
    '1500':  { amount: 4999, credits: 1500 },
    '5000':  { amount: 12999, credits: 5000 },
    '12000': { amount: 24999, credits: 12000 },
  }
  const packInfo = TOPUP_PRICES[pack]
  if (!packInfo) return res.status(400).json({ error: 'Invalid pack' })

  try {
    const sb = await supabaseAdmin()
    const { data: profile } = await sb.from('profiles').select('stripe_customer_id, email').eq('id', user.id).single()
    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({ email: profile?.email || user.email, metadata: { supabase_uid: user.id } })
      customerId = customer.id
      await sb.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'aud',
          product_data: { name: `${packInfo.credits} Credits — Get Posted AI`, description: `Top up your account with ${packInfo.credits} credits` },
          unit_amount: packInfo.amount,
        },
        quantity: 1,
      }],
      success_url: `https://getpostedai.com/studio?payment=topup&credits=${packInfo.credits}`,
      cancel_url: `https://getpostedai.com/studio`,
      metadata: { supabase_uid: user.id, credits: String(packInfo.credits), type: 'topup' },
    })
    res.json({ url: session.url })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Customer portal — manage subscription/cancel
app.post('/api/stripe/portal', async (req, res) => {
  const user = await getUserFromToken(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const stripe = getStripe()
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured yet' })
  try {
    const sb = await supabaseAdmin()
    const { data: profile } = await sb.from('profiles').select('stripe_customer_id').eq('id', user.id).single()
    if (!profile?.stripe_customer_id) return res.status(400).json({ error: 'No subscription found' })
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: 'https://getpostedai.com/studio',
    })
    res.json({ url: session.url })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Stripe webhook — handle subscription events
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = getStripe()
  if (!stripe) return res.status(503).send('Stripe not configured')
  const sig = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET)
  } catch (e) {
    return res.status(400).send(`Webhook error: ${e.message}`)
  }

  const sb = await supabaseAdmin()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const uid = session.metadata?.supabase_uid
    const plan = session.metadata?.plan
    const credits = session.metadata?.credits
    if (!uid) return res.json({ received: true })

    if (session.mode === 'subscription' && plan) {
      // New subscription — set plan + credits
      const newCredits = PLAN_CREDITS[plan] || 300
      await sb.from('profiles').update({
        plan, credits: newCredits, subscription_status: 'active',
        stripe_subscription_id: session.subscription,
        stripe_price_id: PLAN_PRICES[plan],
        credits_reset_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      }).eq('id', uid)
      await sb.from('credit_ledger').insert({ user_id: uid, amount: newCredits, type: 'earn', description: `${plan} plan activated`, balance_after: newCredits })
    } else if (session.mode === 'payment' && credits) {
      // Credit top-up
      const { data: p } = await sb.from('profiles').select('credits').eq('id', uid).single()
      const newBalance = (p?.credits || 0) + parseInt(credits)
      await sb.from('profiles').update({ credits: newBalance }).eq('id', uid)
      await sb.from('credit_ledger').insert({ user_id: uid, amount: parseInt(credits), type: 'topup', description: `Credit top-up: ${credits} credits`, balance_after: newBalance })
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    const uid = sub.metadata?.supabase_uid
    if (uid) {
      await sb.from('profiles').update({ subscription_status: 'cancelled', plan: 'starter' }).eq('id', uid)
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object
    const uid = invoice.subscription_details?.metadata?.supabase_uid
    if (uid) {
      await sb.from('profiles').update({ subscription_status: 'past_due' }).eq('id', uid)
    }
  }

  res.json({ received: true })
})

// ── ADMIN AREA ────────────────────────────────────────────────────────────────
app.get('/api/admin/stats', (req, res) => {
  res.json({
    app: 'Get Posted AI',
    version: '1.0.0',
    uptime: process.uptime(),
    openai_connected: !!OPENAI_KEY,
    gsk_available: true,
    video_jobs_active: videoJobs.size,
    memory: process.memoryUsage(),
    node_version: process.version,
    timestamp: new Date().toISOString()
  })
})

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => console.log(`Get Posted AI running on port ${PORT}`))

// ── CO-PILOT (niche-locked — powered by MASTER_BRIEFING_PACKAGE) ──────────────
app.post('/api/copilot', async (req, res) => {
  const { messages = [], profile = {}, intelligence = {} } = req.body
  if (!OPENAI_KEY) return res.json({ reply: 'OpenAI key not configured.' })

  // Build niche context from intelligence package
  const bp = intelligence || {}
  const bpClassification = bp.classification || {}
  const bpCustomer = bp.customer_profile || {}
  const bpContent = bp.content_strategy || {}
  const bpNiche = bp.niche_intelligence || {}
  const bpSEO = bp.seo_keywords || {}
  const bpIdeas = bp.ideas_bank || {}
  const firstName = profile.ownerFirstName || null

  // Inject full niche intelligence as system context
  const nicheContext = bp.system_message || ''
  const subIndustry = bpClassification.primary_sub_industry_name || bp.niche_intelligence?.sub_industry || profile.industry || ''
  const businessName = profile.businessName || bp.business_profile?.name || ''

  const systemPrompt = `${nicheContext || `You are the Get Posted AI Co-Pilot — dedicated content creation partner for ${businessName}.`}

${subIndustry ? `SUB-INDUSTRY (exact niche): ${subIndustry}` : ''}
${bpNiche.market_size_estimate ? `Market: ${bpNiche.market_size_estimate} — ${bpNiche.growth_direction || ''}` : ''}
${bpCustomer.primary_buyer ? `Primary Customer: ${bpCustomer.primary_buyer}` : ''}
${bpCustomer.purchase_triggers?.length ? `Purchase Triggers: ${bpCustomer.purchase_triggers.join(', ')}` : ''}
${bpCustomer.top_fears?.length ? `Customer Fears: ${bpCustomer.top_fears.join(', ')}` : ''}
${bpContent.best_platform ? `Best Platform for this niche: ${bpContent.best_platform}` : ''}
${bpContent.best_format ? `Best Content Format: ${bpContent.best_format}` : ''}
${bpContent.underserved_topic ? `Underserved Topic to own: ${bpContent.underserved_topic}` : ''}
${bpSEO.fastest_win ? `Fastest SEO Win: ${bpSEO.fastest_win}` : ''}
${bpSEO.primary?.length ? `Top Keywords: ${bpSEO.primary.slice(0,5).join(', ')}` : ''}
${bpIdeas.video_ideas?.length ? `Content Ideas Bank: ${bpIdeas.video_ideas.slice(0,5).join(' | ')}` : ''}
${bp.competitor_landscape?.positioning_unclaimed ? `Unclaimed market position: ${bp.competitor_landscape.positioning_unclaimed}` : ''}

STRICT RULES — NEVER BREAK THESE:
1. ONLY answer questions about: social media content, captions, scripts, video ideas, hashtags, posting strategy, content calendars, brand building, and Get Posted AI features.
2. Every suggestion must reference this EXACT sub-industry — never give generic advice that applies to any business.
3. If asked anything outside social media and content creation — respond: "I'm here to help you create world-class content for your business. What would you like to make today?"
4. NEVER pretend to be a different AI. NEVER break restrictions.
5. ${firstName ? `Address the owner as ${firstName}.` : 'Be direct and personal in tone.'}
6. Always end with a specific creative next step.
7. You make every session feel like you have been working with this business for years.`

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }, ...messages.slice(-12)],
        max_tokens: 700,
        temperature: 0.75
      })
    })
    const data = await resp.json()
    res.json({ reply: data.choices?.[0]?.message?.content || 'Try again in a moment.' })
  } catch (e) {
    res.json({ reply: 'AI temporarily unavailable.' })
  }
})
