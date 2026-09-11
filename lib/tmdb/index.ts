import { allMedia, movies, shows } from "@/lib/mock-data";
import { Media } from "@/types/movie";

const BASE = "https://api.themoviedb.org/3";
const token = process.env.TMDB_ACCESS_TOKEN;
const apiKey = process.env.TMDB_API_KEY;

async function tmdb<T>(path: string): Promise<T | null> {
  if (!token && !apiKey) return null;
  try {
    const separator = path.includes("?") ? "&" : "?";
    const response = await fetch(`${BASE}${path}${token ? "" : `${separator}api_key=${apiKey}`}`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, next: { revalidate: 3600 } });
    return response.ok ? response.json() : null;
  } catch { return null; }
}

export async function getTrending(): Promise<Media[]> {
  const result = await tmdb<{ results: Array<Record<string, unknown>> }>("/trending/all/week?language=en-US");
  if (!result) return allMedia;
  return result.results.slice(0, 12).map(normalize);
}

async function getCollection(path: string, fallback: Media[]): Promise<Media[]> {
  const result = await tmdb<{ results: Array<Record<string, unknown>> }>(path);
  return result?.results?.length ? result.results.slice(0, 16).map(normalize) : fallback;
}

function normalize(item: Record<string, unknown>): Media {
  const path = process.env.NEXT_PUBLIC_TMDB_IMAGE_URL ?? "https://image.tmdb.org/t/p";
  return { id: Number(item.id), title: String(item.title ?? item.name), overview: String(item.overview ?? ""), posterPath: `${path}/w500${item.poster_path}`, backdropPath: `${path}/original${item.backdrop_path}`, releaseDate: String(item.release_date ?? item.first_air_date ?? ""), voteAverage: Number(item.vote_average ?? 0), genreIds: (item.genre_ids as number[]) ?? [], mediaType: item.media_type === "tv" || item.name ? "tv" : "movie" };
}

export async function getHomeContent() {
  const [trending, popular, topRated, nowPlaying, tv, korean, anime] = await Promise.all([
    getTrending(),
    getCollection("/movie/popular?language=en-US", movies),
    getCollection("/movie/top_rated?language=en-US", [...movies].reverse()),
    getCollection("/movie/now_playing?language=en-US", movies.slice(2)),
    getCollection("/tv/popular?language=en-US", shows),
    getCollection("/discover/tv?language=ko-KR&with_original_language=ko", [shows[1], ...movies.slice(3, 6)]),
    getCollection("/discover/tv?with_genres=16&language=en-US", [shows[3], ...movies.slice(0, 3)])
  ]);
  return { trending, popular, topRated, nowPlaying, tv, korean, anime };
}
