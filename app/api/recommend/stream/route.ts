import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const geminiKey = process.env['GEMINI_API_KEY']

    if (!geminiKey) {
      return NextResponse.json({ error: 'Missing GEMINI_API_KEY on the server' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(geminiKey)
    const model = genAI.getGenerativeModel({
      model: process.env['GEMINI_MODEL'] ?? 'gemini-2.5-flash',
      systemInstruction: `You are a world-class film critic and recommendation engine with encyclopedic knowledge of cinema.
Always respond as NDJSON only: one compact JSON object per line.
Do not return a JSON array. Do not use markdown fences. Do not add explanations outside JSON.
Each line format: { "title": string, "year": number, "reason": string, "genres": string[] }`,
    })

    const { genres, mood, seenMovies, followUp, history, candidates } = await req.json()

    const chatHistory = (history ?? []).map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    const chat = model.startChat({ history: chatHistory })

    // If a candidate list is provided, instruct the model to only pick from that list to avoid hallucination.
    const candidateText = Array.isArray(candidates) ? JSON.stringify(candidates) : null

    const userMessage = followUp ?? (candidateText
      ? `From this list of real movies (CANDIDATES): ${candidateText}
  Please recommend up to 5 titles that best match the user's request/profile below.
  Only return titles that exist in the CANDIDATES list.
  Return NDJSON only: one compact JSON object per line in this exact format:
  { "title": string, "year": number, "reason": string, "genres": string[] }
  No array, no markdown, no extra text, no explanations.

  User profile:
  - Favourite genres: ${genres?.join(', ') || 'no preference'}
  - Current mood / vibe: ${mood || 'no preference'}
  - Movies I've already seen (don't recommend these): ${seenMovies?.join(', ') || 'none listed'}

  Limit: 5 titles.
      `.trim()
      : `I'm looking for movie recommendations. Here's my profile:
  - Favourite genres: ${genres?.join(', ') || 'no preference'}
  - Current mood / vibe: ${mood || 'no preference'}
  - Movies I've already seen (don't recommend these): ${seenMovies?.join(', ') || 'none listed'}

  Recommend 12 movies.
  Return NDJSON only: one compact JSON object per line in this exact format:
  { "title": string, "year": number, "reason": string, "genres": string[] }
  No array, no markdown, no preamble.`)

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        let emittedCount = 0
        let allText = ''
        let streamErrored = false

        const emitMovie = (movie: { title?: unknown }) => {
          if (movie && typeof movie.title === 'string') {
            emittedCount += 1
            controller.enqueue(encoder.encode(`${JSON.stringify(movie)}\n`))
          }
        }

        const emitValidLine = (line: string) => {
          const trimmed = line.trim().replace(/^```(?:json)?/, '').replace(/```$/, '').trim()

          if (!trimmed) return

          try {
            const parsed = JSON.parse(trimmed)

            if (Array.isArray(parsed)) {
              parsed.forEach(emitMovie)
            } else {
              emitMovie(parsed)
            }
          } catch {
            // Ignore incomplete/non-JSON fragments; the client should only receive valid NDJSON.
          }
        }

        try {
          const result = await chat.sendMessageStream(userMessage)
          let buffer = ''

          for await (const chunk of result.stream) {
            const text = chunk.text()
            allText += text
            buffer += text

            const lines = buffer.split(/\r?\n/)
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              emitValidLine(line)
            }
          }

          emitValidLine(buffer)

          if (emittedCount === 0) {
            const cleaned = allText.replace(/```json|```/g, '').trim()
            const start = cleaned.indexOf('[')
            const end = cleaned.lastIndexOf(']')

            if (start !== -1 && end !== -1 && end > start) {
              emitValidLine(cleaned.slice(start, end + 1))
            }
          }
        } catch {
          streamErrored = true
          controller.error(new Error('Failed to stream recommendations'))
        } finally {
          if (!streamErrored) {
            controller.close()
          }
        }
      },
    })

    const headers = new Headers({
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    })

    return new Response(stream, { headers })
  } catch (err) {
    console.error('Recommendation stream error:', err)
    return NextResponse.json({ error: 'Failed to get recommendations from Gemini' }, { status: 500 })
  }
}
