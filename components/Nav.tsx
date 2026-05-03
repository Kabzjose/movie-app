'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signIn, signOut, useSession } from 'next-auth/react'

export default function Nav() {
  const path = usePathname()
  const { data: session, status } = useSession()

  const links = [
    { href: '/', label: 'Home' },
    { href: '/chat', label: 'AI Picks' },
    { href: '/browse', label: 'Browse' },
    { href: '/watchlist', label: 'Watchlist' },
  ]

  return (
    <nav style={{
      borderBottom: '1px solid var(--border)',
      padding: '0 1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '2rem',
      height: '56px',
    }}>
      <Link href="/" style={{
        color: 'var(--accent)',
        fontWeight: 700,
        fontSize: '1.1rem',
        letterSpacing: '0.05em',
        textDecoration: 'none',
        textTransform: 'uppercase',
      }}>
        Reelwise
      </Link>

      <div style={{ display: 'flex', gap: '1.5rem', marginLeft: 'auto', alignItems: 'center' }}>
        {links.map(({ href, label }) => (
          <Link key={href} href={href} style={{
            color: path === href ? 'var(--accent)' : 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: '0.9rem',
            letterSpacing: '0.03em',
            borderBottom: path === href ? '1px solid var(--accent)' : '1px solid transparent',
            paddingBottom: '2px',
          }}>
            {label}
          </Link>
        ))}

        {status === 'loading' ? (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Checking session...</span>
        ) : session?.user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {session.user.image && (
              <span
                aria-hidden="true"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundImage: `url(${session.user.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid var(--border)',
                }}
              />
            )}
            <span style={{ color: 'var(--text)', fontSize: '0.85rem' }}>
              {session.user.name ?? session.user.email}
            </span>
            <button
              type="button"
              onClick={() => signOut()}
              style={{
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.4rem 0.7rem',
                fontSize: '0.85rem',
              }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => signIn('google')}
            style={{
              border: 'none',
              borderRadius: '6px',
              background: 'var(--accent)',
              color: '#0a0a0f',
              cursor: 'pointer',
              padding: '0.45rem 0.75rem',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            Sign in
          </button>
        )}
      </div>
    </nav>
  )
}
