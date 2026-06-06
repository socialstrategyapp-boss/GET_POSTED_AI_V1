import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    const { message, businessName, industry, websiteUrl } = await req.json()

    const moonshotKey = Deno.env.get('MOONSHOT_API_KEY')
    if (!moonshotKey) {
      return new Response(
        JSON.stringify({ error: 'Moonshot API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let systemPrompt = `You are GET POSTED AI, an expert social media content strategist and viral video creator powered by Moonshot AI.`

    if (businessName) {
      systemPrompt += ` You are helping "${businessName}"`
      if (industry) {
        systemPrompt += `, a business in the ${industry} industry`
      }
      systemPrompt += `.`
    }

    if (websiteUrl) {
      systemPrompt += ` Their website is ${websiteUrl}.`
    }

    systemPrompt += `

Your job is to help create amazing, viral social media content. Be creative, strategic, and actionable.

When asked for content, provide:
1. A hook/headline that grabs attention in the first 2 seconds
2. A full script or post text
3. Specific shot list or visual directions (for video)
4. 5-10 optimized hashtags
5. Best posting time recommendation
6. Call-to-action suggestions

Keep responses concise but packed with value.`

    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${moonshotKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return new Response(
        JSON.stringify({ error: `Moonshot API error: ${error}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.'

    return new Response(
      JSON.stringify({ reply, provider: 'moonshot' }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
