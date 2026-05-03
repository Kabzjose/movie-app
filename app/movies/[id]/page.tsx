import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import TrailerPlayer from '../../../components/TrailerPlayer'
import WatchlistButton from '../../../components/WatchlistButton'
import { getMovieDetails, TMDB_BACKDROP_BASE, TMDB_IMAGE_BASE } from '../../../lib/tmdb'

interface CastMember {
  id: number
  name: string
  character?: string
  profile_path?: string | null
}

interface Video {
  key: string
  name: string
  site: string
  type: string
  official?: boolean
}

interface MovieDetails {
  title: string
  overview?: string | null
  release_date?: string
  runtime?: number | null
  vote_average?: number
  backdrop_path?: string | null
  poster_path?: string | null
  genres?: { id: number; name: string }[]
  credits?: { cast?: CastMember[] }
  videos?: { results?: Video[] }
}

function formatRuntime(minutes?: number | null) {
  if (!minutes) return null

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (!hours) return `${mins}m`
  if (!mins) return `${hours}h`

  return `${hours}h ${mins}m`
}

function getTrailer(videos?: Video[]) {
  return videos?.find(
    (video) => video.site === 'YouTube' && video.type === 'Trailer' && video.official
  ) ?? videos?.find((video) => video.site === 'YouTube' && video.type === 'Trailer')
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const movie = await getMovieDetails(id) as MovieDetails

    return {
      title: `${movie.title} - Reelwise`,
      description: movie.overview ?? 'Movie details, cast, runtime, and trailer.',
    }
  } catch {
    return {
      title: 'Movie - Reelwise',
    }
  }
}

export default async function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const movie = await getMovieDetails(id).catch(() => null) as MovieDetails | null

  if (!movie) {
    notFound()
  }

  const releaseYear = movie.release_date ? movie.release_date.slice(0, 4) : null
  const runtime = formatRuntime(movie.runtime)
  const trailer = getTrailer(movie.videos?.results)
  const cast = movie.credits?.cast?.slice(0, 8) ?? []
  const backdrop = movie.backdrop_path ? `${TMDB_BACKDROP_BASE}${movie.backdrop_path}` : null
  const poster = movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : null

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto' }}>
      <Link
        href="/browse"
        style={{
          color: 'var(--text-muted)',
          display: 'inline-block',
          marginBottom: '1rem',
          textDecoration: 'none',
        }}
      >
        Back to browse
      </Link>

      <section
        style={{
          minHeight: 430,
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          marginBottom: '2rem',
        }}
      >
        {backdrop && (
          <Image
            src={backdrop}
            alt=""
            fill
            priority
            sizes="(max-width: 1120px) 100vw, 1120px"
            style={{ objectFit: 'cover' }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(10,10,15,0.96) 0%, rgba(10,10,15,0.76) 44%, rgba(10,10,15,0.25) 100%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            minHeight: 430,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.5rem',
            alignItems: 'end',
            padding: 'clamp(1rem, 4vw, 2rem)',
          }}
        >
          <div style={{ aspectRatio: '2/3', position: 'relative', background: 'var(--surface-2)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', flex: '0 1 240px', width: 'min(100%, 240px)' }}>
            {poster ? (
              <Image src={poster} alt={movie.title} fill sizes="240px" style={{ objectFit: 'cover' }} />
            ) : (
              <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
                No poster
              </div>
            )}
          </div>

          <div style={{ flex: '1 1 280px', minWidth: 0 }}>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: 1, margin: '0 0 0.75rem', fontWeight: 400 }}>
              {movie.title}
            </h1>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {releaseYear && <span>{releaseYear}</span>}
              {runtime && <span>{runtime}</span>}
              {movie.vote_average ? <span style={{ color: 'var(--accent)', fontWeight: 700 }}>★ {movie.vote_average.toFixed(1)}</span> : null}
            </div>

            {movie.genres && movie.genres.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {movie.genres.map((genre) => (
                  <span key={genre.id} style={{ fontSize: '0.8rem', padding: '0.25rem 0.65rem', borderRadius: '100px', background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {movie.overview && (
              <p style={{ maxWidth: 720, color: 'var(--text)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                {movie.overview}
              </p>
            )}

            {trailer && (
              <TrailerPlayer videoKey={trailer.key} title={movie.title} />
            )}

            <div style={{ marginTop: trailer ? '1rem' : 0 }}>
              <WatchlistButton
                movie={{
                  id: Number(id),
                  title: movie.title,
                  year: releaseYear ? Number(releaseYear) : undefined,
                  posterPath: movie.poster_path,
                  rating: movie.vote_average,
                  genres: movie.genres?.map((genre) => genre.name),
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '1rem' }}>Cast</h2>
        {cast.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
            {cast.map((person) => (
              <div key={person.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ aspectRatio: '2/3', position: 'relative', background: 'var(--surface-2)' }}>
                  {person.profile_path ? (
                    <Image src={`${TMDB_IMAGE_BASE}${person.profile_path}`} alt={person.name} fill sizes="150px" style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                      No photo
                    </div>
                  )}
                </div>
                <div style={{ padding: '0.75rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.3 }}>{person.name}</div>
                  {person.character && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.4, marginTop: '0.25rem' }}>
                      {person.character}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>Cast details are not available for this title.</p>
        )}
      </section>
    </div>
  )
}
