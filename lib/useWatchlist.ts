'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

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

function readLocalWatchlist() {
  try {
    const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []

    return Array.isArray(parsed) ? parsed as WatchlistMovie[] : []
  } catch {
    return []
  }
}

function writeLocalWatchlist(movies: WatchlistMovie[]) {
  window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(movies))
  window.dispatchEvent(new Event(WATCHLIST_UPDATED_EVENT))
}

export function useWatchlist() {
  const { data: session, status } = useSession()
  const [watchlist, setWatchlist] = useState<WatchlistMovie[]>([])
  const isSignedIn = Boolean(session?.user?.email)

  const loadWatchlist = useCallback(async () => {
    if (status === 'loading') return

    if (!isSignedIn) {
      setWatchlist(readLocalWatchlist())
      return
    }

    const res = await fetch('/api/watchlist')

    if (res.status === 401) {
      setWatchlist(readLocalWatchlist())
      return
    }

    if (!res.ok) {
      throw new Error('Failed to load watchlist')
    }

    const data = await res.json() as { watchlist?: WatchlistMovie[] }
    setWatchlist(data.watchlist ?? [])
  }, [isSignedIn, status])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadWatchlist()
  }, [loadWatchlist])

  useEffect(() => {
    const syncWatchlist = () => {
      if (isSignedIn) {
        void loadWatchlist()
      } else {
        setWatchlist(readLocalWatchlist())
      }
    }

    window.addEventListener(WATCHLIST_UPDATED_EVENT, syncWatchlist)
    window.addEventListener('storage', syncWatchlist)

    return () => {
      window.removeEventListener(WATCHLIST_UPDATED_EVENT, syncWatchlist)
      window.removeEventListener('storage', syncWatchlist)
    }
  }, [isSignedIn, loadWatchlist])

  const isInWatchlist = useCallback((movieId: number) => {
    return watchlist.some((movie) => movie.id === movieId)
  }, [watchlist])

  const toggleWatchlist = useCallback(async (movie: WatchlistMovie) => {
    const currentlySaved = watchlist.some((item) => item.id === movie.id)
    const nextWatchlist = currentlySaved
      ? watchlist.filter((item) => item.id !== movie.id)
      : [movie, ...watchlist]

    setWatchlist(nextWatchlist)

    if (!isSignedIn) {
      writeLocalWatchlist(nextWatchlist)
      return !currentlySaved
    }

    const res = currentlySaved
      ? await fetch(`/api/watchlist?movieId=${movie.id}`, { method: 'DELETE' })
      : await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            movieId: movie.id,
            title: movie.title,
            posterPath: movie.posterPath,
            rating: movie.rating,
            year: movie.year,
          }),
        })

    if (res.status === 401) {
      writeLocalWatchlist(nextWatchlist)
      return !currentlySaved
    }

    if (!res.ok) {
      setWatchlist(watchlist)
      throw new Error('Failed to update watchlist')
    }

    window.dispatchEvent(new Event(WATCHLIST_UPDATED_EVENT))
    return !currentlySaved
  }, [isSignedIn, watchlist])

  return {
    watchlist,
    toggleWatchlist,
    isInWatchlist,
  }
}
