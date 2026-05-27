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
    const { message, businessName, industry, websiteUrl, provider } = await req.json()

    // Route to the right AI provider
    const targetProvider = provider || 'openai'

    if (targetProvider === 'gemini') {
      const geminiKey = Deno.env.get('GEMINI_API_KEY')
      if (!geminiKey) {
        return new Response(JSON.stringify({ error: 'Gemini key not set' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: buildPrompt(message, businessName, industry, websiteUrl) }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 1500 },
          }),
        }
      )

      const data = await response.json()
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.'
      return new Response(JSON.stringify({ reply, provider: 'gemini' }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })

    } else {
      // Default: OpenAI
      const openAiKey = Deno.env.get('OPENAI_API_KEY')
      if (!openAiKey) {
        return new Response(JSON.stringify({ error: 'OpenAI key not set' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: buildSystemPrompt(businessName, industry, websiteUrl) },
            { role: 'user', content: message }
          ],
          temperature: 0.8,
          max_tokens: 1500,
        }),
      })

      const data = await response.json()
      const reply = data.choices?.[0]?.message?.content || 'No response from OpenAI.'
      return new Response(JSON.stringify({ reply, provider: 'openai' }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})

function buildSystemPrompt(businessName?: string, industry?: string, websiteUrl?: string): string {
  let prompt = `You are GET POSTED AI, an expert social media content strategist.`
  if (businessName) {
    prompt += ` Helping "${businessName}"`
    if (industry) prompt += ` in the ${industry} industry`
    prompt += `.`
  }
  if (websiteUrl) prompt += ` Website: ${websiteUrl}.`
  prompt += `

Provide: hook, script, shot list, hashtags, posting time, CTA.`
  return prompt
}

function buildPrompt(message: string, businessName?: string, industry?: string, websiteUrl?: string): string {
  return `${buildSystemPrompt(businessName, industry, websiteUrl)}\n\nUser: ${message}`
}
