export interface WatchlistMovie {
  id: number
  title: string
  year?: number
  posterPath?: string | null
  rating?: number
  genres?: string[]
}

export const WATCHLIST_STORAGE_KEY = 'reelwise-watchlist'
export const WATCHLIST_UPDATED_EVENT = 'reelwise-watchlist-updated'

function readMovies() {
  try {
    const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []

    return Array.isArray(parsed) ? parsed as WatchlistMovie[] : []
  } catch {
    return []
  }
}

function writeMovies(movies: WatchlistMovie[]) {
  window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(movies))
  window.dispatchEvent(new Event(WATCHLIST_UPDATED_EVENT))
}

export function getWatchlist() {
  return readMovies()
}

export function isInWatchlist(id: number) {
  return readMovies().some((movie) => movie.id === id)
}

export function addToWatchlist(movie: WatchlistMovie) {
  const movies = readMovies()

  if (movies.some((item) => item.id === movie.id)) {
    return
  }

  writeMovies([movie, ...movies])
}

export function removeFromWatchlist(id: number) {
  writeMovies(readMovies().filter((movie) => movie.id !== id))
}

export function toggleWatchlist(movie: WatchlistMovie) {
  if (isInWatchlist(movie.id)) {
    removeFromWatchlist(movie.id)
    return false
  }

  addToWatchlist(movie)
  return true
}
