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

  const userId = session?.user?.email ?? null

  const loadWatchlist = useCallback(async () => {
    if (status === 'loading') return
    if (userId === null && isSignedIn) return  // wait until userId is stable

    if (!isSignedIn) {
      setWatchlist(readLocalWatchlist())
      return
    }

    const res = await fetch('/api/watchlist').catch(() => null)

    if (!res || res.status === 401 || !res.ok) {
      setWatchlist(readLocalWatchlist())
      return
    }

    const data = await res.json() as { watchlist?: WatchlistMovie[] }
    setWatchlist(data.watchlist ?? [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, userId])  // isSignedIn intentionally omitted — userId covers it

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadWatchlist()
  }, [loadWatchlist])

  useEffect(() => {
    // When signed in, state is managed optimistically in toggleWatchlist —
    // do NOT re-fetch from the server here or we risk wiping optimistic updates.
    // For guests, keep localStorage in sync across tabs.
    const syncWatchlist = () => {
      if (!isSignedIn) {
        setWatchlist(readLocalWatchlist())
      }
    }

    window.addEventListener(WATCHLIST_UPDATED_EVENT, syncWatchlist)
    window.addEventListener('storage', syncWatchlist)

    return () => {
      window.removeEventListener(WATCHLIST_UPDATED_EVENT, syncWatchlist)
      window.removeEventListener('storage', syncWatchlist)
    }
  }, [isSignedIn])

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
      // Session appears invalid; persist the optimistic change to localStorage
      // but do not dispatch the global update event (which triggers a server reload)
      try {
        window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(nextWatchlist))
      } catch {}
      return !currentlySaved
    }

    if (!res.ok) {
      // Revert UI to the previous watchlist and keep localStorage consistent
      setWatchlist(watchlist)
      writeLocalWatchlist(watchlist)
      return !currentlySaved
    }

  
    return !currentlySaved
  }, [isSignedIn, watchlist])

  return {
    watchlist,
    toggleWatchlist,
    isInWatchlist,
  }
}
