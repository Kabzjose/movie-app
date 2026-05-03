'use client'

import {
  useWatchlist,
  type WatchlistMovie,
} from '../lib/useWatchlist'

interface WatchlistButtonProps {
  movie: WatchlistMovie
  compact?: boolean
}

export default function WatchlistButton({ movie, compact = false }: WatchlistButtonProps) {
  const { toggleWatchlist, isInWatchlist } = useWatchlist()
  const saved = isInWatchlist(movie.id)

  return (
    <button
      type="button"
      onClick={() => {
        void toggleWatchlist(movie)
      }}
      aria-pressed={saved}
      style={{
        width: compact ? '100%' : 'auto',
        border: `1px solid ${saved ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: '6px',
        background: saved ? 'var(--accent-dim)' : 'transparent',
        color: saved ? 'var(--accent)' : 'var(--text-muted)',
        cursor: 'pointer',
        padding: compact ? '0.45rem 0.6rem' : '0.75rem 1rem',
        fontSize: compact ? '0.78rem' : '0.9rem',
        fontWeight: 700,
      }}
    >
      {saved ? 'In watchlist' : 'Add to watchlist'}
    </button>
  )
}
