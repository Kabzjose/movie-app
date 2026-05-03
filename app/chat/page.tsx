'use client'
import { useEffect, useState } from 'react'
import MovieCard from '../../components/MovieCard'

const GENRE_OPTIONS = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Animation', 'Documentary', 'Fantasy']
const MOOD_OPTIONS = ['Something light & fun', 'Deep and emotional', 'Edge-of-seat tense', 'Mind-bending', 'Feel-good', 'Dark and gritty']

interface Recommendation {
  clientKey?: string
  id?: number
  title: string
  year?: number
  reason?: string
  genres?: string[]
  posterPath?: string | null
  rating?: number
}

type Step = 'genres' | 'mood' | 'seen' | 'results'

export default function ChatPage() {
  const [step, setStep] = useState<Step>('genres')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedMood, setSelectedMood] = useState('')
  const [seenInput, setSeenInput] = useState('')
  const [seenMovies, setSeenMovies] = useState<string[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [history, setHistory] = useState<{ role: string; content: string }[]>([])
  const [followUp, setFollowUp] = useState('')
  const [candidates, setCandidates] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleGenre = (g: string) =>
    setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])

  const addSeenMovie = () => {
    const trimmed = seenInput.trim()
    if (trimmed && !seenMovies.includes(trimmed)) {
      setSeenMovies(prev => [...prev, trimmed])
    }
    setSeenInput('')
  }

  const enrichRecommendation = async (rec: Recommendation, clientKey: string) => {
    try {
      const tmdbRes = await fetch(
        `/api/tmdb-search?title=${encodeURIComponent(rec.title)}${rec.year ? `&year=${rec.year}` : ''}`
      )
      const tmdb = await tmdbRes.json()

      setRecommendations((prev) => prev.map((movie) => {
        if (movie.clientKey !== clientKey) return movie

        return {
          ...movie,
          id: tmdb.id,
          year: movie.year ?? (tmdb.release_date ? Number(tmdb.release_date.slice(0, 4)) : undefined),
          posterPath: tmdb.poster_path ?? null,
          rating: tmdb.vote_average ?? null,
        }
      }))
    } catch {
      // Keep the streamed text-only recommendation if TMDB enrichment fails.
    }
  }

  const fetchRecommendations = async (isFollowUp = false) => {
    setLoading(true)
    setError('')
    setRecommendations([])
    setStep('results')

    const streamedRecommendations: Recommendation[] = []

    try {
      // include candidate list to avoid hallucination when available
      const res = await fetch('/api/recommend/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genres: selectedGenres,
          mood: selectedMood,
          seenMovies,
          followUp: isFollowUp ? followUp : undefined,
          history: isFollowUp ? history : [],
          candidates: candidates ?? undefined,
        }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error || 'Failed to fetch recommendations')
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Streaming is not available in this browser')
      }

      const appendRecommendation = (line: string) => {
        const trimmed = line.trim()

        if (!trimmed) return

        const parsed = JSON.parse(trimmed) as Recommendation | string
        const rec = typeof parsed === 'string' ? { title: parsed } : parsed

        if (!rec.title) return

        const clientKey = `${Date.now()}-${streamedRecommendations.length}-${rec.title}`
        const movie = { ...rec, clientKey }

        streamedRecommendations.push(rec)
        setRecommendations((prev) => [...prev, movie])
        void enrichRecommendation(movie, clientKey)
      }

      let buffer = ''
      let done = false

      while (!done) {
        const { value, done: streamDone } = await reader.read()
        done = streamDone

        if (value) {
          buffer += decoder.decode(value, { stream: !streamDone })

          const lines = buffer.split(/\r?\n/)
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            appendRecommendation(line)
          }
        }
      }

      buffer += decoder.decode()
      appendRecommendation(buffer)

      if (streamedRecommendations.length === 0) {
        throw new Error('No recommendations were returned')
      }

      const userMessage = isFollowUp ? followUp : `I'm looking for movie recommendations. Favourite genres: ${selectedGenres.join(', ')}; Mood: ${selectedMood}. Seen: ${seenMovies.join(', ')}`
      const updatedHistory = [
        ...(history ?? []),
        { role: 'user', content: userMessage },
        { role: 'assistant', content: streamedRecommendations.map((rec) => JSON.stringify(rec)).join('\n') },
      ]
      setHistory(updatedHistory)
      setFollowUp('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // load public candidates list once
    fetch('/candidates.json')
      .then(r => r.json())
      .then(list => setCandidates(list))
      .catch(() => setCandidates(null))
  }, [])

  const btnStyle = (active = false) => ({
    padding: '0.5rem 1.25rem',
    borderRadius: '4px',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    background: active ? 'var(--accent-dim)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.15s',
  })

  const primaryBtn = {
    background: 'var(--accent)',
    color: '#0a0a0f',
    border: 'none',
    padding: '0.65rem 1.75rem',
    borderRadius: '4px',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '0.9rem',
    letterSpacing: '0.03em',
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 400, marginBottom: '0.5rem' }}>AI Recommendations</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>
        Tell us a bit about yourself and we&apos;ll find the perfect films.
      </p>

      {/* Step: Genres */}
      {step === 'genres' && (
        <div>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 500 }}>What genres do you love?</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '2rem' }}>
            {GENRE_OPTIONS.map(g => (
              <button key={g} style={btnStyle(selectedGenres.includes(g))} onClick={() => toggleGenre(g)}>{g}</button>
            ))}
          </div>
          <button
            style={{ ...primaryBtn, opacity: selectedGenres.length === 0 ? 0.5 : 1 }}
            disabled={selectedGenres.length === 0}
            onClick={() => setStep('mood')}
          >
            Next →
          </button>
        </div>
      )}

      {/* Step: Mood */}
      {step === 'mood' && (
        <div>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 500 }}>What&apos;s your mood tonight?</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '2rem' }}>
            {MOOD_OPTIONS.map(m => (
              <button key={m} style={btnStyle(selectedMood === m)} onClick={() => setSelectedMood(m)}>{m}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button style={{ ...primaryBtn, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }} onClick={() => setStep('genres')}>← Back</button>
            <button style={primaryBtn} onClick={() => setStep('seen')}>Next →</button>
          </div>
        </div>
      )}

      {/* Step: Seen movies */}
      {step === 'seen' && (
        <div>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 500 }}>Movies you&apos;ve already seen</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>We&apos;ll make sure not to recommend these. Skip if you like.</p>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
            <input
              value={seenInput}
              onChange={e => setSeenInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSeenMovie()}
              placeholder="e.g. Inception"
              style={{
                flex: 1, padding: '0.6rem 1rem', borderRadius: '4px',
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text)', fontSize: '0.9rem',
              }}
            />
            <button style={primaryBtn} onClick={addSeenMovie}>Add</button>
          </div>

          {seenMovies.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1.5rem' }}>
              {seenMovies.map(m => (
                <span key={m} style={{
                  padding: '4px 12px', borderRadius: '100px',
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  {m}
                  <button onClick={() => setSeenMovies(p => p.filter(x => x !== m))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, fontSize: '0.9rem' }}>×</button>
                </span>
              ))}
            </div>
          )}

          {error && <p style={{ color: '#e05a5a', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>}

          {loading && (
            <div style={{ background: 'var(--surface)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span className="spinner" aria-hidden="true" />
              <span>Finding films that fit your taste...</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button style={{ ...primaryBtn, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }} onClick={() => setStep('mood')}>← Back</button>
            <button style={primaryBtn} onClick={() => fetchRecommendations(false)} disabled={loading}>
              {loading ? 'Finding films…' : 'Get Recommendations ✦'}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {step === 'results' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 400 }}>Your picks</h2>
            <button style={{ ...primaryBtn, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.4rem 1rem' }} onClick={() => setStep('genres')}>
              Start over
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {recommendations.map(rec => (
              <MovieCard key={rec.clientKey ?? rec.id ?? rec.title} id={rec.id} title={rec.title} year={rec.year} posterPath={rec.posterPath} rating={rec.rating} genres={rec.genres} reason={rec.reason} />
            ))}
          </div>

          {loading && (
            <div style={{ color: 'var(--text-muted)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span className="spinner" aria-hidden="true" />
              <span>Streaming recommendations...</span>
            </div>
          )}

          {error && <p style={{ color: '#e05a5a', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>}

          {/* Follow-up chat */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              Not quite right? Refine your recommendations:
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={followUp}
                onChange={e => setFollowUp(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && followUp && fetchRecommendations(true)}
                placeholder="e.g. Something more recent, or less violent…"
                style={{
                  flex: 1, padding: '0.6rem 1rem', borderRadius: '4px',
                  border: '1px solid var(--border)', background: 'var(--surface)',
                  color: 'var(--text)', fontSize: '0.875rem',
                }}
              />
              <button style={primaryBtn} onClick={() => fetchRecommendations(true)} disabled={!followUp || loading}>
                {loading ? '…' : 'Refine'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
