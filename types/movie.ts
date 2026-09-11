export type MediaType = "movie" | "tv";

export interface Media {
  id: number | string;
  slug?: string;
  title: string;
  originalTitle?: string;
  overview: string;
  posterPath: string;
  backdropPath: string;
  releaseDate: string;
  voteAverage: number;
  genreIds: number[];
  genres?: string[];
  mediaType: MediaType;
  runtime?: number;
  progress?: number;
  quality?: string;
  lang?: string;
  episodeCurrent?: string;
  year?: number;
  country?: string;
  countrySlug?: string;
}

export interface ServerEpisode {
  name: string;
  slug: string;
  filename?: string;
  linkEmbed: string;
  linkM3u8: string;
}

export interface MovieServer {
  serverName: string;
  episodes: ServerEpisode[];
}

export interface Person { id: number; name: string; character: string; image: string; }
export interface Episode { id: number; episode: number; title: string; overview: string; runtime: number; image: string; progress?: number; }

export const genres: Record<number, string> = {
  12: "Adventure", 16: "Animation", 18: "Drama", 27: "Horror", 28: "Action", 35: "Comedy", 53: "Thriller", 80: "Crime", 878: "Science Fiction", 9648: "Mystery", 10749: "Romance"
};
