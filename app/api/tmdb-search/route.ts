import { NextRequest, NextResponse } from 'next/server'
import { searchMovie } from '../../../lib/tmdb'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const title = searchParams.get('title')?.trim()
    const yearParam = searchParams.get('year')?.trim()

    if (!title) {
      return NextResponse.json({ error: 'Missing title query parameter' }, { status: 400 })
    }

    const parsedYear = yearParam ? Number.parseInt(yearParam, 10) : undefined
    const year = Number.isNaN(parsedYear) ? undefined : parsedYear

    const movie = await searchMovie(title, year)

    if (!movie) {
      return NextResponse.json({}, { status: 200 })
    }

    return NextResponse.json({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path ?? null,
      vote_average: movie.vote_average ?? null,
      release_date: movie.release_date ?? null,
      overview: movie.overview ?? null,
    })
  } catch (err) {
    console.error('TMDB search route error:', err)
    return NextResponse.json({ error: 'Failed to search TMDB' }, { status: 500 })
  }
}
