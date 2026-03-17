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
    return NextResponse.json({ error: 'OpenRouter not configured' }, { status: 500 })
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-flash-1.5',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: body.text.slice(0, 20000) }, // cap at 20k chars
      ],
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'LLM call failed' }, { status: 502 })
  }

  const llmData = await response.json()
  const rawContent = llmData.choices?.[0]?.message?.content ?? '{}'

  let parsed: unknown
  try {
    parsed = JSON.parse(rawContent)
  } catch {
    return NextResponse.json({ error: 'LLM returned invalid JSON' }, { status: 502 })
  }

  // Validate response — partial results are fine, unknown fields are stripped
  const result = parsedResumeSchema.safeParse(parsed)
  const safeData = result.success ? result.data : {}

  return NextResponse.json(safeData)
}
