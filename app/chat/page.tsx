'use client'
import { useState } from 'react'
import MovieCard from '../../components/MovieCard'

const GENRE_OPTIONS = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Animation', 'Documentary', 'Fantasy']
const MOOD_OPTIONS = ['Something light & fun', 'Deep and emotional', 'Edge-of-seat tense', 'Mind-bending', 'Feel-good', 'Dark and gritty']

interface Recommendation {
  title: string
  year: number
  reason: string
  genres: string[]
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

  const fetchRecommendations = async (isFollowUp = false) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genres: selectedGenres,
          mood: selectedMood,
          seenMovies,
          followUp: isFollowUp ? followUp : undefined,
          history: isFollowUp ? history : [],
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Enrich with TMDB poster data
      const enriched = await Promise.all(
        data.recommendations.map(async (rec: Recommendation) => {
          try {
            const tmdbRes = await fetch(
              `/api/tmdb-search?title=${encodeURIComponent(rec.title)}&year=${rec.year}`
            )
            const tmdb = await tmdbRes.json()
            return { ...rec, posterPath: tmdb.poster_path ?? null, rating: tmdb.vote_average ?? null }
          } catch {
            return rec
          }
        })
      )

      setRecommendations(enriched)
      setHistory(data.history)
      setFollowUp('')
      setStep('results')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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
              <MovieCard key={rec.title} title={rec.title} year={rec.year} posterPath={rec.posterPath} rating={rec.rating} genres={rec.genres} reason={rec.reason} />
            ))}
          </div>

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
