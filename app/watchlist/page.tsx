'use client'

import { signIn, useSession } from 'next-auth/react'
import MovieCard from '../../components/MovieCard'
import { useWatchlist } from '../../lib/useWatchlist'

export default function WatchlistPage() {
  const { data: session } = useSession()
  const { watchlist } = useWatchlist()
  const isSignedOut = !session?.user?.email

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 400, marginBottom: '0.5rem' }}>
        Watchlist
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Movies you saved for later.
      </p>

      {isSignedOut && (
        <div
          style={{
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            borderRadius: '8px',
            padding: '1rem',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <span>Sign in to sync your watchlist across devices.</span>
          <button
            type="button"
            onClick={() => signIn('google')}
            style={{
              background: 'var(--accent)',
              color: '#0a0a0f',
              border: 'none',
              borderRadius: '6px',
              padding: '0.6rem 0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Sign in
          </button>
        </div>
      )}

      {watchlist.length === 0 ? (
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
          {watchlist.map((movie) => (
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
