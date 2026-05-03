'use client'

import { useState } from 'react'

interface TrailerPlayerProps {
  videoKey: string
  title: string
}

export default function TrailerPlayer({ videoKey, title }: TrailerPlayerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div style={{ maxWidth: 520 }}>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          background: 'var(--accent)',
          color: '#0a0a0f',
          border: 'none',
          borderRadius: '6px',
          padding: '0.75rem 1rem',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Watch trailer
      </button>

      {isOpen && (
        <div
          style={{
            marginTop: '1rem',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            overflow: 'hidden',
            background: '#000',
            boxShadow: '0 18px 50px rgba(0,0,0,0.35)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              background: 'var(--surface)',
              padding: '0.6rem 0.75rem',
            }}
          >
            <span style={{ color: 'var(--text)', fontSize: '0.9rem', fontWeight: 700 }}>
              Trailer
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close trailer"
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                width: 32,
                height: 32,
                lineHeight: 1,
              }}
            >
              x
            </button>
          </div>
          <div style={{ aspectRatio: '16/9', position: 'relative' }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`}
              title={`${title} trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                border: 0,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
