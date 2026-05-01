import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-8">
      <div>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 5rem)',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          color: 'var(--text)',
        }}>
          Find your next<br />
          <span style={{ color: 'var(--accent)' }}>favourite film.</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '1.25rem', fontSize: '1.1rem', maxWidth: 420 }}>
          Tell us your mood, genres you love, and what you&apos;ve already seen —
          our AI does the rest.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/chat" style={{
          background: 'var(--accent)',
          color: '#0a0a0f',
          padding: '0.75rem 2rem',
          borderRadius: '4px',
          fontWeight: 600,
          fontSize: '0.95rem',
          letterSpacing: '0.02em',
          textDecoration: 'none',
        }}>
          Get AI Recommendations
        </Link>
        <Link href="/browse" style={{
          border: '1px solid var(--border)',
          color: 'var(--text)',
          padding: '0.75rem 2rem',
          borderRadius: '4px',
          fontSize: '0.95rem',
          textDecoration: 'none',
        }}>
          Browse Movies
        </Link>
      </div>
    </div>
  )
}
