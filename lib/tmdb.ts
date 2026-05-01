const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_KEY = process.env.TMDB_API_KEY

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

// Genre ID map — fetch fresh list via /genre/movie/list if needed
export const GENRES: Record<string, number> = {
  Action: 28,
  Comedy: 35,
  'Sci-Fi': 878,
  Drama: 18,
  Horror: 27,
  Romance: 10749,
  Thriller: 53,
  Animation: 16,
  Documentary: 99,
  Fantasy: 14,
}

export async function searchMovie(title: string, year?: number) {
  const params = new URLSearchParams({
    api_key: TMDB_KEY!,
    query: title,
    ...(year ? { year: String(year) } : {}),
  })
  const res = await fetch(`${TMDB_BASE}/search/movie?${params}`)
  const data = await res.json()
  return data.results?.[0] ?? null
}

export async function discoverMovies({
  genreId,
  sortBy = 'popularity.desc',
  page = 1,
}: {
  genreId?: number
  sortBy?: string
  page?: number
}) {
  const params = new URLSearchParams({
    api_key: TMDB_KEY!,
    sort_by: sortBy,
    page: String(page),
    ...(genreId ? { with_genres: String(genreId) } : {}),
  })
  const res = await fetch(`${TMDB_BASE}/discover/movie?${params}`)
  return res.json()
}

export async function searchMoviesByQuery(query: string, page = 1) {
  const params = new URLSearchParams({
    api_key: TMDB_KEY!,
    query,
    page: String(page),
  })
  const res = await fetch(`${TMDB_BASE}/search/movie?${params}`)
  return res.json()
}