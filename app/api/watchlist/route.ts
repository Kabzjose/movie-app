import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../auth'
import { createSupabaseServerClient } from '../../../lib/supabase'

interface WatchlistPayload {
  movieId?: number
  title?: string
  posterPath?: string | null
  rating?: number
  year?: number
}

function getUserId(session: { user?: { email?: string | null } } | null) {
  return session?.user?.email ?? undefined
}

function checkSupabaseEnv() {
  const missing: string[] = []
  if (!process.env['NEXT_PUBLIC_SUPABASE_URL']) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!process.env['SUPABASE_SERVICE_ROLE_KEY']) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (missing.length > 0) {
    return `Missing env: ${missing.join(', ')}`
  }
  return null
}

export async function GET() {
  try {
    const session = await auth()
    const userId = getUserId(session)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const envError = checkSupabaseEnv()
    if (envError) {
      console.error('Watchlist env error:', envError)
      return NextResponse.json({ error: envError }, { status: 500 })
    }

    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('watchlist')
      .select('movie_id,title,poster_path,rating,year,added_at')
      .eq('user_id', userId)
      .order('added_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      watchlist: (data ?? []).map((movie) => ({
        id: movie.movie_id,
        title: movie.title,
        posterPath: movie.poster_path,
        rating: movie.rating,
        year: movie.year,
      })),
    })
  } catch (err) {
    console.error('Watchlist GET error:', err)
    return NextResponse.json({ error: 'Failed to load watchlist' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = getUserId(session)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const envError = checkSupabaseEnv()
    if (envError) {
      console.error('Watchlist env error:', envError)
      return NextResponse.json({ error: envError }, { status: 500 })
    }

    const body = await req.json() as WatchlistPayload

    if (!body.movieId || !body.title) {
      return NextResponse.json({ error: 'Missing movieId or title' }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()
    const { error } = await supabase
      .from('watchlist')
      .upsert({
        user_id: userId,
        movie_id: body.movieId,
        title: body.title,
        poster_path: body.posterPath ?? null,
        rating: body.rating ?? null,
        year: body.year ?? null,
      }, {
        onConflict: 'user_id,movie_id',
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Watchlist POST error:', err)
    return NextResponse.json({ error: 'Failed to update watchlist' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    const userId = getUserId(session)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const envError = checkSupabaseEnv()
    if (envError) {
      console.error('Watchlist env error:', envError)
      return NextResponse.json({ error: envError }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const movieId = Number.parseInt(searchParams.get('movieId') ?? '', 10)

    if (Number.isNaN(movieId)) {
      return NextResponse.json({ error: 'Missing movieId' }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', movieId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Watchlist DELETE error:', err)
    return NextResponse.json({ error: 'Failed to update watchlist' }, { status: 500 })
  }
}
