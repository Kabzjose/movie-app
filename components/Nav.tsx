'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const path = usePathname()

  const links = [
    { href: '/', label: 'Home' },
    { href: '/chat', label: 'AI Picks' },
    { href: '/browse', label: 'Browse' },
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

      <div style={{ display: 'flex', gap: '1.5rem', marginLeft: 'auto' }}>
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
      </div>
    </nav>
  )
}