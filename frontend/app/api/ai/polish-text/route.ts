import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const text = body.text

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Text is required and must be a string' },
        { status: 400 }
      )
    }

    // Get OpenAI API key from environment
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key is not configured' },
        { status: 503 }
      )
    }

    // Call OpenAI API
    const openaiUrl = 'https://api.openai.com/v1/chat/completions'
    const model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'

    const systemPrompt = `You are a professional writing assistant. Your task is to polish and improve the provided text.

Requirements:
1. Fix all spelling and grammar mistakes
2. Improve sentence structure and flow
3. Make the text sound more professional and polished
4. Maintain the original meaning and tone
5. Keep the same level of formality
6. Preserve paragraph breaks and structure
7. Do not add new information not present in the original text
8. If the text is already well-written, make only minor improvements

Return only the polished text without any explanations or additional commentary.`

    const userPrompt = `Please polish the following text, fixing grammar, spelling, and making it sound more professional:

${text}`

    const response = await fetch(openaiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('OpenAI API error:', errorData)
      return NextResponse.json(
        { success: false, error: errorData.error?.message || 'Failed to polish text' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const polishedText = data.choices?.[0]?.message?.content?.trim()

    if (!polishedText) {
      return NextResponse.json(
        { success: false, error: 'No polished text returned from AI' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      polished_text: polishedText,
    })
  } catch (error: any) {
    console.error('Error polishing text:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to polish text' },
      { status: 500 }
    )
  }
}
