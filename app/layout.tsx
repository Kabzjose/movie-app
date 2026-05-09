import type { Metadata } from 'next'
import './globals.css'
import Nav from '../components/Nav'
import SessionProvider from '../components/providers/SessionProvider'

export const metadata: Metadata = {
  title: 'Reelwise — AI Movie Recommendations',
  description: 'Discover your next favourite film',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Warm the TMDB image CDN connection before result posters enter the viewport. */}
        <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="" />
      </head>
      <body>
        <SessionProvider>
          <Nav />
          <main className="max-w-6xl mx-auto px-6 py-8">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  )
}
