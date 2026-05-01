import Image from 'next/image'
import { TMDB_IMAGE_BASE } from '../lib/tmdb'

interface MovieCardProps {
  title: string
  year?: number
  posterPath?: string | null
  rating?: number
  genres?: string[]
  reason?: string  // shown in AI chat recommendations
  onClick?: () => void
}

export default function MovieCard({ title, year, posterPath, rating, genres, reason, onClick }: MovieCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => onClick && ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)')}
      onMouseLeave={e => onClick && ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)')}
    >
      {/* Poster */}
      <div style={{ aspectRatio: '2/3', background: 'var(--surface-2)', position: 'relative' }}>
        {posterPath ? (
          <Image
            src={`${TMDB_IMAGE_BASE}${posterPath}`}
            alt={title}
            fill
            style={{ objectFit: 'cover' }}
            sizes="200px"
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', fontSize: '2rem',
          }}>🎬</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '0.75rem' }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.3, marginBottom: '4px' }}>
          {title}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: reason ? '8px' : 0 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{year}</span>
          {rating && (
            <span style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600 }}>
              ★ {rating.toFixed(1)}
            </span>
          )}
        </div>
        {genres && genres.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: reason ? '8px' : 0 }}>
            {genres.slice(0, 2).map(g => (
              <span key={g} style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: '100px',
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
              }}>{g}</span>
            ))}
          </div>
        )}
        {reason && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.5, margin: 0 }}>
            {reason}
          </p>
        )}
      </div>
    </div>
  )
}