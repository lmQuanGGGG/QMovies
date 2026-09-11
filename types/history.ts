import { Media } from "./movie";

export interface WatchHistoryItem {
  id: string | number;
  slug?: string;
  title: string;
  posterPath: string;
  backdropPath?: string;
  mediaType: "movie" | "tv";
  serverIdx?: number;
  serverName?: string;
  episodeIdx?: number;
  episodeName?: string;
  currentTime: number;
  duration: number;
  percentage: number;
  updatedAt: number; // Unix timestamp in ms
}

export type WatchHistoryInput = {
  media: Media;
  serverIdx?: number;
  serverName?: string;
  episodeIdx?: number;
  episodeName?: string;
  currentTime: number;
  duration: number;
};
