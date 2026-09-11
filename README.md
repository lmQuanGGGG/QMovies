# QMovies

A cinematic, responsive streaming interface built with Next.js App Router, TypeScript, and CSS variables. It has TMDB-ready server-side metadata fetching, with a polished fallback catalogue so the app remains functional before an API key is added.

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the local environment file and add a TMDB read access token (optional but recommended):

   ```bash
   cp .env.example .env.local
   ```

   Get a **Read Access Token** from [TMDB Settings → API](https://www.themoviedb.org/settings/api), then set `TMDB_ACCESS_TOKEN` in `.env.local`.

3. Start development:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Production

```bash
npm run build
npm run start
```

## Video architecture

`lib/video/sources.ts` defines the `VideoSource` contract separately from TMDB metadata. The included sources use legal public sample files from Google’s sample-media bucket so the player can be tested immediately. Replace `getVideoSource()` with a signed internal API when a production video backend is available.

## Routes

`/`, `/movies`, `/tv`, `/trending`, `/search`, `/movie/[id]`, `/tv/[id]`, `/watch/movie/[id]`, `/watch/tv/[id]/[season]/[episode]`, `/watchlist`, and `/history`.
