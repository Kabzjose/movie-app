import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

function extractJsonArray(text: string) {
  const cleaned = text.replace(/```json|```/g, '').trim()

  if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
    return cleaned
  }

  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']')

  if (start !== -1 && end !== -1 && end > start) {
    return cleaned.slice(start, end + 1)
  }

  return cleaned
}

export async function POST(req: NextRequest) {
  try {
    const geminiKey = process.env.GEMINI_API_KEY

    if (!geminiKey) {
      return NextResponse.json({ error: 'Missing GEMINI_API_KEY on the server' }, { status: 500 })
    }

    // Runs on the SERVER only — GEMINI_API_KEY never reaches the browser
    const genAI = new GoogleGenerativeAI(geminiKey)
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
      systemInstruction: `You are a world-class film critic and recommendation engine with encyclopedic knowledge of cinema.
Always respond with a valid JSON array only — no markdown fences, no explanations outside the JSON.
Format: [{ "title": string, "year": number, "reason": string, "genres": string[] }]`,
    })

    const { genres, mood, seenMovies, followUp, history } = await req.json()

    // Build chat history for multi-turn conversations
    const chatHistory = (history ?? []).map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    const chat = model.startChat({ history: chatHistory })

    // First message or follow-up refinement
    const userMessage = followUp ?? `
I'm looking for movie recommendations. Here's my profile:
- Favourite genres: ${genres?.join(', ') || 'no preference'}
- Current mood / vibe: ${mood || 'no preference'}
- Movies I've already seen (don't recommend these): ${seenMovies?.join(', ') || 'none listed'}

Recommend 12 movies. Return ONLY a valid JSON array, no markdown, no preamble.
    `.trim()

    const result = await chat.sendMessage(userMessage)
    const text = result.response.text()

    if (!text.trim()) {
      return NextResponse.json({ error: 'Gemini returned an empty response' }, { status: 500 })
    }

    const recommendations = JSON.parse(extractJsonArray(text))

    if (!Array.isArray(recommendations)) {
      return NextResponse.json({ error: 'Gemini did not return a recommendation array' }, { status: 500 })
    }

    // Return recommendations + updated history for follow-up turns
    const updatedHistory = [
      ...(history ?? []),
      { role: 'user', content: userMessage },
      { role: 'assistant', content: text },
    ]

    return NextResponse.json({ recommendations, history: updatedHistory })
  } catch (err) {
    console.error('Recommendation error:', err)
    return NextResponse.json({ error: 'Failed to get recommendations from Gemini' }, { status: 500 })
  }
}
