const TMDB_BASE = 'https://api.themoviedb.org/3'

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'
export const TMDB_POSTER_CARD_BASE = 'https://image.tmdb.org/t/p/w342'
export const TMDB_PROFILE_BASE = 'https://image.tmdb.org/t/p/w185'
export const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280'

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

function getTmdbToken() {
  const key = process.env['TMDB_API_KEY']

  if (!key) {
    throw new Error('Missing TMDB_API_KEY on the server')
  }

  return key
}

async function fetchTmdb(path: string, params: URLSearchParams) {
  const token = getTmdbToken()
  const headers = new Headers()

  if (token.startsWith('eyJ') || token.startsWith('Bearer ')) {
    headers.set('Authorization', token.startsWith('Bearer ') ? token : `Bearer ${token}`)
  } else {
    params.set('api_key', token)
  }

  const url = `${TMDB_BASE}${path}?${params}`
  // Cache stable TMDB metadata server-side so repeated searches/pages avoid a fresh upstream request.
  const res = await fetch(url, { headers, next: { revalidate: 60 * 60 } })
  const data = await res.json()

  if (!res.ok) {
    const statusMessage = typeof data.status_message === 'string' ? data.status_message : 'TMDB request failed'
    throw new Error(statusMessage)
  }

  return data
}

export async function searchMovie(title: string, year?: number) {
  const params = new URLSearchParams({
    query: title,
    ...(year ? { year: String(year) } : {}),
  })
  const data = await fetchTmdb('/search/movie', params)
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
    sort_by: sortBy,
    page: String(page),
    ...(genreId ? { with_genres: String(genreId) } : {}),
  })
  return fetchTmdb('/discover/movie', params)
}

export async function searchMoviesByQuery(query: string, page = 1) {
  const params = new URLSearchParams({
    query,
    page: String(page),
  })
  return fetchTmdb('/search/movie', params)
}

export async function getMovieDetails(id: string | number) {
  const params = new URLSearchParams({
    append_to_response: 'credits,videos',
  })

  return fetchTmdb(`/movie/${id}`, params)
}
