import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { parsedResumeSchema } from '@/lib/schemas'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM_PROMPT = `You are a resume parser. Extract structured information from the resume text and return ONLY valid JSON (no markdown, no code fences). Use this exact structure:
{
  "name": "string or null",
  "headline": "current job title or professional headline",
  "location": "city, country or null",
  "summary": "professional summary or null",
  "skills": ["skill1", "skill2"],
  "interests": ["interest1"],
  "miscellaneous": ["certification or language or publication"],
  "experiences": [
    {
      "company": "company name",
      "title": "job title",
      "start_date": "YYYY-MM or null",
      "end_date": "YYYY-MM or null",
      "is_current": true,
      "bullets": ["achievement or responsibility"]
    }
  ],
  "education": [
    {
      "school": "institution name",
      "degree": "degree type e.g. BSc",
      "field": "field of study",
      "start_date": "YYYY-MM or null",
      "end_date": "YYYY-MM or null"
    }
  ]
}`

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.text || typeof body.text !== 'string') {
    return NextResponse.json({ error: 'Missing text field' }, { status: 400 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    console.error('Missing OPENROUTER_API_KEY')
    return NextResponse.json({ error: 'OpenRouter not configured' }, { status: 500 })
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'UniSync',
    },
    body: JSON.stringify({
      model: 'z-ai/glm-5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: body.text.slice(0, 20000) },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('OpenRouter error:', response.status, errorText)
    return NextResponse.json(
      { error: `LLM call failed: ${response.status}` },
      { status: 502 }
    )
  }

  const llmData = await response.json()
  const rawContent = llmData.choices?.[0]?.message?.content ?? '{}'

  let parsed: unknown
  try {
    // Strip markdown code fences and extract JSON object
    let cleaned = rawContent
      .replace(/```(?:json)?\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()
    
    // Find the outermost JSON object (handle text before/after)
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1)
    }
    
    parsed = JSON.parse(cleaned)
  } catch {
    console.error('Failed to parse LLM response:', rawContent.slice(0, 500))
    return NextResponse.json({ error: 'LLM returned invalid JSON' }, { status: 502 })
  }

  // Validate response — partial results are fine, unknown fields are stripped
  const result = parsedResumeSchema.safeParse(parsed)
  const safeData = result.success ? result.data : {}

  return NextResponse.json(safeData)
}
