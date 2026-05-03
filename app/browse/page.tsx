'use client'

import { useEffect, useMemo, useState } from 'react'
import MovieCard from '../../components/MovieCard'

interface BrowseMovie {
	id: number
	title: string
	release_date?: string
	poster_path?: string | null
	vote_average?: number
	genre_ids?: number[]
}

interface BrowseResponse {
	results: BrowseMovie[]
	page: number
	totalPages: number
	totalResults: number
	error?: string
}

const GENRE_OPTIONS = [
	'All',
	'Action',
	'Comedy',
	'Sci-Fi',
	'Drama',
	'Horror',
	'Romance',
	'Thriller',
	'Animation',
	'Documentary',
	'Fantasy',
]

const SORT_OPTIONS = [
	{ value: 'popularity.desc', label: 'Most Popular' },
	{ value: 'vote_average.desc', label: 'Top Rated' },
	{ value: 'release_date.desc', label: 'Newest First' },
]

export default function BrowsePage() {
	const [queryInput, setQueryInput] = useState('')
	const [query, setQuery] = useState('')
	const [genre, setGenre] = useState('All')
	const [sortBy, setSortBy] = useState('popularity.desc')
	const [page, setPage] = useState(1)
	const [movies, setMovies] = useState<BrowseMovie[]>([])
	const [totalPages, setTotalPages] = useState(1)
	const [totalResults, setTotalResults] = useState(0)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	const heading = useMemo(() => {
		if (query) return `Results for "${query}"`
		if (genre !== 'All') return `${genre} Movies`
		return 'Browse Movies'
	}, [genre, query])

	useEffect(() => {
		let isCancelled = false

		const loadMovies = async () => {
			setLoading(true)
			setError('')

			const params = new URLSearchParams({
				page: String(page),
				sort: sortBy,
			})

			if (query) params.set('q', query)
			if (genre !== 'All') params.set('genre', genre)

			try {
				const res = await fetch(`/api/browse?${params.toString()}`)
				const data: BrowseResponse = await res.json()

				if (!res.ok || data.error) {
					throw new Error(data.error || 'Failed to load movies')
				}

				if (!isCancelled) {
					setMovies(data.results || [])
					setTotalPages(Math.max(1, data.totalPages || 1))
					setTotalResults(data.totalResults || 0)
				}
			} catch {
				if (!isCancelled) {
					setError('Could not load movies right now. Please try again.')
					setMovies([])
					setTotalPages(1)
					setTotalResults(0)
				}
			} finally {
				if (!isCancelled) setLoading(false)
			}
		}

		loadMovies()

		return () => {
			isCancelled = true
		}
	}, [genre, page, query, sortBy])

	const handleSearch = () => {
		setPage(1)
		setQuery(queryInput.trim())
	}

	const clearSearch = () => {
		setQueryInput('')
		setQuery('')
		setPage(1)
	}

	return (
		<div style={{ maxWidth: 1120, margin: '0 auto' }}>
			<h1 style={{ fontSize: '1.75rem', fontWeight: 400, marginBottom: '0.5rem' }}>Browse Catalog</h1>
			<p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
				Explore popular titles or search for something specific.
			</p>

			<div
				style={{
					border: '1px solid var(--border)',
					background: 'var(--surface)',
					borderRadius: '10px',
					padding: '1rem',
					marginBottom: '1.5rem',
					display: 'grid',
					gap: '0.75rem',
					gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
				}}
			>
				<input
					value={queryInput}
					onChange={(e) => setQueryInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') handleSearch()
					}}
					placeholder="Search by title"
					style={{
						width: '100%',
						border: '1px solid var(--border)',
						borderRadius: '6px',
						background: 'var(--surface-2)',
						color: 'var(--text)',
						padding: '0.6rem 0.75rem',
						fontSize: '0.9rem',
					}}
				/>

				<select
					value={genre}
					onChange={(e) => {
						setGenre(e.target.value)
						setPage(1)
					}}
					style={{
						width: '100%',
						border: '1px solid var(--border)',
						borderRadius: '6px',
						background: 'var(--surface-2)',
						color: 'var(--text)',
						padding: '0.6rem 0.75rem',
						fontSize: '0.9rem',
					}}
				>
					{GENRE_OPTIONS.map((option) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</select>

				<select
					value={sortBy}
					onChange={(e) => {
						setSortBy(e.target.value)
						setPage(1)
					}}
					style={{
						width: '100%',
						border: '1px solid var(--border)',
						borderRadius: '6px',
						background: 'var(--surface-2)',
						color: 'var(--text)',
						padding: '0.6rem 0.75rem',
						fontSize: '0.9rem',
					}}
				>
					{SORT_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>

				<button
					onClick={handleSearch}
					style={{
						border: 'none',
						borderRadius: '6px',
						background: 'var(--accent)',
						color: '#0a0a0f',
						fontWeight: 700,
						cursor: 'pointer',
						padding: '0.6rem 0.75rem',
					}}
				>
					Search
				</button>
			</div>

			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
				<h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{heading}</h2>
				<button
					onClick={clearSearch}
					style={{
						background: 'transparent',
						color: 'var(--text-muted)',
						border: '1px solid var(--border)',
						borderRadius: '4px',
						fontSize: '0.8rem',
						cursor: 'pointer',
						padding: '0.3rem 0.6rem',
					}}
				>
					Reset
				</button>
			</div>

			{error && (
				<p style={{ color: '#ef7d7d', marginBottom: '1rem' }}>{error}</p>
			)}

			{!error && !loading && (
				<p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
					{totalResults.toLocaleString()} result{totalResults === 1 ? '' : 's'}
				</p>
			)}

			{loading ? (
				<div style={{ color: 'var(--text-muted)', padding: '2rem 0' }}>Loading movies...</div>
			) : movies.length === 0 ? (
				<div style={{ color: 'var(--text-muted)', padding: '2rem 0' }}>No movies found for this filter.</div>
			) : (
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
						gap: '1rem',
					}}
				>
					{movies.map((movie) => (
						<MovieCard
							key={movie.id}
							id={movie.id}
							title={movie.title}
							year={movie.release_date ? Number(movie.release_date.slice(0, 4)) : undefined}
							posterPath={movie.poster_path}
							rating={movie.vote_average}
						/>
					))}
				</div>
			)}

			<div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
				<button
					onClick={() => setPage((p) => Math.max(1, p - 1))}
					disabled={page === 1 || loading}
					style={{
						border: '1px solid var(--border)',
						borderRadius: '4px',
						background: 'transparent',
						color: page === 1 || loading ? 'var(--text-muted)' : 'var(--text)',
						padding: '0.45rem 0.9rem',
						cursor: page === 1 || loading ? 'not-allowed' : 'pointer',
					}}
				>
					Previous
				</button>
				<span style={{ alignSelf: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
					Page {page} / {totalPages}
				</span>
				<button
					onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
					disabled={page >= totalPages || loading}
					style={{
						border: '1px solid var(--border)',
						borderRadius: '4px',
						background: 'transparent',
						color: page >= totalPages || loading ? 'var(--text-muted)' : 'var(--text)',
						padding: '0.45rem 0.9rem',
						cursor: page >= totalPages || loading ? 'not-allowed' : 'pointer',
					}}
				>
					Next
				</button>
			</div>
		</div>
	)
}
