'use client'

import { useEffect, useState } from 'react'
import MovieCard from '../../components/MovieCard'
import {
  getWatchlist,
  WATCHLIST_UPDATED_EVENT,
  type WatchlistMovie,
} from '../../lib/watchlist'

export default function WatchlistPage() {
  const [movies, setMovies] = useState<WatchlistMovie[]>([])

  useEffect(() => {
    const syncWatchlist = () => setMovies(getWatchlist())

    syncWatchlist()
    window.addEventListener(WATCHLIST_UPDATED_EVENT, syncWatchlist)
    window.addEventListener('storage', syncWatchlist)

    return () => {
      window.removeEventListener(WATCHLIST_UPDATED_EVENT, syncWatchlist)
      window.removeEventListener('storage', syncWatchlist)
    }
  }, [])

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 400, marginBottom: '0.5rem' }}>
        Watchlist
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Movies you saved for later.
      </p>

      {movies.length === 0 ? (
        <div
          style={{
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            borderRadius: '8px',
            padding: '2rem',
            color: 'var(--text-muted)',
          }}
        >
          Your watchlist is empty.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '1rem',
          }}
        >
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              id={movie.id}
              title={movie.title}
              year={movie.year}
              posterPath={movie.posterPath}
              rating={movie.rating}
              genres={movie.genres}
            />
          ))}
        </div>
      )}
    </div>
  )
}
