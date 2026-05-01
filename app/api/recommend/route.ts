import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

// Runs on the SERVER only — GEMINI_API_KEY never reaches the browser
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  systemInstruction: `You are a world-class film critic and recommendation engine with encyclopedic knowledge of cinema.
Always respond with a valid JSON array only — no markdown fences, no explanations outside the JSON.
Format: [{ "title": string, "year": number, "reason": string, "genres": string[] }]`,
})

export async function POST(req: NextRequest) {
  try {
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

Recommend 6 movies. Return ONLY a valid JSON array, no markdown, no preamble.
    `.trim()

    const result = await chat.sendMessage(userMessage)
    const text = result.response.text()

    // Strip markdown fences if Gemini adds them
    const cleaned = text.replace(/```json|```/g, '').trim()
    const recommendations = JSON.parse(cleaned)

    // Return recommendations + updated history for follow-up turns
    const updatedHistory = [
      ...(history ?? []),
      { role: 'user', content: userMessage },
      { role: 'assistant', content: text },
    ]

    return NextResponse.json({ recommendations, history: updatedHistory })
  } catch (err) {
    console.error('Recommendation error:', err)
    return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 })
  }
}