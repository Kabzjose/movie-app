# Reelwise

> AI-powered movie recommendations. Tell it your mood, genres, and what you've already seen — it finds your next film.

**Live demo:** https://movie-app-eta-ashy.vercel.app &nbsp;·&nbsp; **Stack:** Next.js 15 · TypeScript · Gemini AI · TMDB · Supabase · Vercel

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [API reference](#api-reference)
- [Authentication](#authentication)
- [Database](#database)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Reelwise is a full-stack movie discovery app. Users complete a short onboarding flow — selecting genres, mood, and films they've already seen — and receive six tailored recommendations from Gemini 1.5 Flash. Recommendations stream token-by-token to the UI. Users can refine results via follow-up chat, browse the full TMDB catalogue with genre and rating filters, and save films to a persistent watchlist synced across devices via Supabase.

Unauthenticated users get the full recommendation and browse experience with a localStorage-backed watchlist. Signing in with Google upgrades the watchlist to a cloud-synced Supabase store.

---

## Features

| Feature | Description |
|---|---|
| AI recommendations | Multi-step onboarding feeds into Gemini 1.5 Flash, returning 6 tailored picks with personalised reasons |
| Streaming responses | Tokens stream to the UI in real time — no waiting for the full response |
| Follow-up chat | Refine results with natural language: "something shorter", "less violent", "more recent" |
| Browse & filter | Explore the TMDB catalogue by genre, release year, minimum rating, and sort order |
| Movie detail page | Full cast, runtime, backdrop, trailer modal, and similar titles |
| Watchlist | Save films locally (guests) or synced to Supabase (signed-in users) |
| Google auth | One-click sign-in via NextAuth — no passwords |

---

## Architecture

```
                        ┌─────────────────────────────┐
                        │        Next.js (Vercel)       │
                        │                               │
  Browser ─────────────▶│  /app  (React Server + Client)│
                        │                               │
                        │  /api/recommend   ────────────────▶  Gemini API
                        │  /api/tmdb-*      ────────────────▶  TMDB API
                        │  /api/watchlist   ────────────────▶  Supabase
                        │  /api/auth        ────────────────▶  Google OAuth
                        │                               │
                        └─────────────────────────────┘
```

**Key design decisions:**

- All third-party API keys are server-only. The browser never holds a secret.
- The Supabase `SERVICE_ROLE_KEY` is used in API routes only — it is never exposed as a `NEXT_PUBLIC_` variable.
- The watchlist degrades gracefully: guests use `localStorage`, authenticated users use Supabase. The same `useWatchlist` hook handles both transparently.
- AI responses use `sendMessageStream` so the UI receives tokens progressively rather than waiting for the full JSON payload.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| AI | Google Gemini 1.5 Flash (`@google/generative-ai`) |
| Movie data | TMDB REST API |
| Auth | NextAuth.js v5 (Google OAuth) |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel |
| Package manager | pnpm |

---

## Getting started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- A [Gemini API key](https://aistudio.google.com) (free, no credit card)
- A [TMDB API key](https://www.themoviedb.org/settings/api) (free)

### Installation

```bash
# 1. Clone
git clone https://github.com/kabzjose/movie-app.git
cd movie-app

# 2. Install dependencies
pnpm install

# 3. Set up environment
cp .env.local.example .env.local
# Fill in the required variables — see Environment variables below

# 4. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

> If port 3000 is in use, Next.js will suggest an alternative port. To stop a conflicting process: `kill <PID>`.

---

## Environment variables

Create a `.env.local` file in the project root. **Never commit secrets.**

### Required

```env
# AI
GEMINI_API_KEY=             # Google Gemini key — aistudio.google.com

# Movie data
TMDB_API_KEY=               # TMDB key — themoviedb.org/settings/api

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=            # Generate: openssl rand -base64 32
GOOGLE_CLIENT_ID=           # Google Cloud Console → OAuth 2.0 credentials
GOOGLE_CLIENT_SECRET=
```

### Required for watchlist persistence (Supabase)

```env
NEXT_PUBLIC_SUPABASE_URL=   # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=  # Supabase service role key — server only, never expose publicly
```

> Without Supabase keys the app still works fully — authenticated users fall back to localStorage for their watchlist.

### Getting your keys

| Key | Where to get it |
|---|---|
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) → Get API Key. Free tier: 1,500 req/day |
| `TMDB_API_KEY` | [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) → Request API key |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` in your terminal |
| `GOOGLE_CLIENT_ID/SECRET` | [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API → service_role (keep secret) |

---

## Project structure

```
my-movie-app/
│
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root shell — Nav, SessionProvider, fonts
│   ├── page.tsx                  # Landing page
│   ├── globals.css               # CSS custom properties + base styles
│   │
│   ├── chat/
│   │   └── page.tsx              # AI recommendation flow (client component)
│   │
│   ├── browse/
│   │   └── page.tsx              # Genre filter + TMDB catalogue grid (client component)
│   │
│   ├── movie/[id]/
│   │   └── page.tsx              # Movie detail — cast, trailer, similar titles
│   │
│   ├── watchlist/
│   │   └── page.tsx              # Saved films — localStorage or Supabase
│   │
│   └── api/
│       ├── auth/[...nextauth]/   # NextAuth catch-all route
│       │   └── route.ts
│       ├── recommend/
│       │   └── route.ts          # Streams Gemini response to client (server only)
│       ├── tmdb-discover/
│       │   └── route.ts          # TMDB discover endpoint with filters (server only)
│       ├── tmdb-movie/
│       │   └── route.ts          # TMDB movie detail + credits + videos (server only)
│       ├── tmdb-search/
│       │   └── route.ts          # TMDB title search proxy (server only)
│       └── watchlist/
│           └── route.ts          # GET / POST / DELETE watchlist rows via Supabase
│
├── components/
│   ├── Nav.tsx                   # Top nav — active links, session state, watchlist count
│   └── MovieCard.tsx             # Poster, title, rating, genre chips — links to detail page
│
├── lib/
│   ├── tmdb.ts                   # TMDB helpers: discoverMovies, searchMovie, genre map
│   ├── supabase.ts               # Supabase client (anon) + admin client (service role)
│   └── useWatchlist.ts           # Hook — Supabase when signed in, localStorage for guests
│
├── supabase/
│   └── migrations/
│       └── 20260503235900_create_watchlist.sql
│
├── .env.local.example
├── next.config.ts
├── tailwind.config.js
└── package.json
```

---

## API reference

All routes are under `/api`. Keys are injected server-side — none are accessible in the browser.

| Method | Route | Auth required | Description |
|---|---|---|---|
| `POST` | `/api/recommend` | No | Streams Gemini movie recommendations as JSON tokens |
| `GET` | `/api/tmdb-discover` | No | Discover movies by genre, year range, rating, sort |
| `GET` | `/api/tmdb-movie` | No | Full movie detail: credits, videos, similar |
| `GET` | `/api/tmdb-search` | No | Search TMDB by title + optional year |
| `GET` | `/api/watchlist` | Yes | Fetch authenticated user's watchlist from Supabase |
| `POST` | `/api/watchlist` | Yes | Add a movie to the watchlist |
| `DELETE` | `/api/watchlist?movieId=` | Yes | Remove a movie from the watchlist |

---

## Authentication

Google OAuth via NextAuth.js v5. The session is JWT-based — no database adapter required for auth itself.

**Local setup:**

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorised redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Secret into `.env.local`

**Production:** Add your Vercel domain to the authorised origins and redirect URIs in Google Cloud Console, and set `NEXTAUTH_URL` to your production URL in Vercel environment variables.

---

## Database

Supabase (PostgreSQL). Run the migration in the Supabase SQL editor or via the Supabase CLI.

**Watchlist table:**

```sql
CREATE TABLE watchlist (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     text NOT NULL,        -- user's email from NextAuth session
  movie_id    integer NOT NULL,     -- TMDB movie ID
  title       text NOT NULL,
  poster_path text,
  rating      float,
  year        integer,
  added_at    timestamp DEFAULT now(),
  UNIQUE(user_id, movie_id)
);
```

> Row Level Security is optional — the app uses the `SERVICE_ROLE_KEY` in API routes which bypasses RLS. If you want to use the anon key instead, enable RLS and add appropriate policies.

---

## Deployment

### Vercel (recommended)

```bash
# 1. Push to GitHub
git push origin main

# 2. Import at vercel.com/new — Vercel auto-detects Next.js

# 3. Add all environment variables under Settings → Environment Variables

# 4. Deploy
```

> **Important:** After adding or changing environment variables on an existing deployment, go to **Deployments → latest deploy → ··· → Redeploy**. Env var changes do not take effect until a fresh deployment.

### Environment variables checklist for production

- [ ] `GEMINI_API_KEY`
- [ ] `TMDB_API_KEY`
- [ ] `NEXTAUTH_URL`
- [ ] `NEXTAUTH_SECRET`
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

---

## Contributing

```bash
# Create a feature branch
git checkout -b feature/your-feature

# Make your changes, then open a pull request against main
```

Please keep API keys out of commits. The `.env.local.example` file documents all required variables — update it if you add new ones.

---

## License

MIT