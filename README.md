Reelwise 🎬<br>
An AI-powered movie recommendation app built with Next.js. Tell it your mood, favourite genres, and movies you've already seen — it finds your next film. Also includes a full browse page with genre filtering, search, and sorting powered by the TMDB API.
Live demo: https://movie-app-eta-ashy.vercel.app

Features

AI Recommendations — multi-step onboarding (genres → mood → seen movies) feeds into Gemini 1.5 Flash, which returns 6 tailored picks with reasons
Follow-up chat — refine results with natural language ("something shorter", "more recent")
Browse & filter — explore movies by genre, sort by popularity/rating/newest, and search by title
TMDB integration — posters, ratings, and metadata pulled live from The Movie Database
Dark cinema aesthetic — deep background, gold accents, clean card layout


Tech stack
LayerTechFrameworkNext.js 15 (App Router)LanguageTypeScriptStylingTailwind CSSAIGoogle Gemini 1.5 FlashMovie dataTMDB APIDeploymentVercel

Getting started
1. Clone the repo
bashgit clone https://github.com/kabzjose/movie-app.git
cd movie-app
2. Install dependencies
bashpnpm install

Don't have pnpm? Install it with npm install -g pnpm

3. Set up environment variables
Copy the example env file and fill in your keys:
bashcp .env.local.example .env.local
envGEMINI_API_KEY=your_gemini_key_here
TMDB_API_KEY=your_tmdb_key_here
Getting your keys:

Gemini — free at aistudio.google.com → Get API Key. No credit card needed, 1,500 requests/day free.
TMDB — free at themoviedb.org/settings/api → Create account → Request API key.

4. Run the dev server
bashpnpm dev
Open http://localhost:3000.

Project structure
my-movie-app/
├── app/
│   ├── layout.tsx              # Root layout — Nav + fonts
│   ├── page.tsx                # Home / landing page
│   ├── globals.css             # Global styles + CSS variables
│   ├── chat/
│   │   └── page.tsx            # AI recommendation flow (client)
│   ├── browse/
│   │   └── page.tsx            # Genre filter + movie grid (client)
│   └── api/
│       ├── recommend/
│       │   └── route.ts        # Calls Gemini — server only
│       └── tmdb-search/
│           └── route.ts        # Proxies TMDB — server only
├── components/
│   ├── Nav.tsx                 # Top nav with active link highlighting
│   └── MovieCard.tsx           # Poster, title, rating, genre badge
└── lib/
    └── tmdb.ts                 # TMDB helper functions

Deploying to Vercel

Push your code to GitHub
Import the repo at vercel.com/new
Add environment variables in Settings → Environment Variables:

GEMINI_API_KEY
TMDB_API_KEY


Deploy — Vercel auto-detects Next.js, no config needed


After adding env vars to an existing deployment, go to Deployments → Redeploy for them to take effect.


How the AI integration works
The app never exposes API keys to the browser. All AI calls go through a Next.js API route:
Browser → POST /api/recommend → Gemini API
                              ↓
                        JSON array of 6 movies
                              ↓
              Each title looked up via /api/tmdb-search
                              ↓
                    Movie cards with posters
The chat page maintains conversation history so follow-up messages have context from previous recommendations.
