import { NextRequest, NextResponse } from 'next/server'
import { discoverMovies, GENRES, searchMoviesByQuery } from '../../../lib/tmdb'

const ALLOWED_SORTS = new Set([
  'popularity.desc',
  'vote_average.desc',
  'release_date.desc',
])

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')?.trim() ?? ''
    const genre = searchParams.get('genre')?.trim() ?? ''
    const requestedSort = searchParams.get('sort') ?? 'popularity.desc'
    const sortBy = ALLOWED_SORTS.has(requestedSort) ? requestedSort : 'popularity.desc'

    const pageParam = Number.parseInt(searchParams.get('page') ?? '1', 10)
    const page = Number.isNaN(pageParam) ? 1 : Math.min(Math.max(pageParam, 1), 500)

    const data = query
      ? await searchMoviesByQuery(query, page)
      : await discoverMovies({
          genreId: genre && genre !== 'All' ? GENRES[genre] : undefined,
          sortBy,
          page,
        })

    return NextResponse.json({
      results: data.results ?? [],
      page: data.page ?? page,
      totalPages: Math.min(data.total_pages ?? 1, 500),
      totalResults: data.total_results ?? 0,
    })
  } catch (err) {
    console.error('Browse API error:', err)
    return NextResponse.json({ error: 'Failed to browse movies' }, { status: 500 })
  }
}
