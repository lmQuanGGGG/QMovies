import { getPhimDetail } from "@/lib/phimapi";
import { MovieServer, ServerEpisode } from "@/types/movie";

export interface SubtitleTrack {
  label: string;
  language: string;
  url: string;
}

export interface VideoSource {
  id: string;
  movieId?: number | string;
  slug?: string;
  season?: number;
  episode?: number;
  type: "mp4" | "hls";
  url: string;
  embedUrl?: string;
  title?: string;
  episodeName?: string;
  serverName?: string;
  quality?: string;
  subtitleTracks?: SubtitleTrack[];
  servers?: MovieServer[];
  currentServerIndex?: number;
  currentEpisodeIndex?: number;
}

export const demoSources: VideoSource[] = [
  {
    id: "demo-movie-1",
    movieId: 1,
    type: "mp4",
    quality: "720p",
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  },
  {
    id: "demo-tv-101-1-2",
    movieId: 101,
    season: 1,
    episode: 2,
    type: "mp4",
    quality: "720p",
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  }
];

export const getVideoSource = (movieId: number | string, season?: number, episode?: number): VideoSource => {
  const numId = typeof movieId === "number" ? movieId : Number(movieId);
  return demoSources.find((source) => source.movieId === numId && source.season === season && source.episode === episode) ?? demoSources[0];
};

/**
 * Lấy nguồn video phát trực tiếp (M3U8 & Embed) từ PhimAPI
 */
export async function getVideoStreamSource(
  slugOrId: string | number,
  episodeSlugOrIndex?: string | number,
  serverIndex = 0
): Promise<VideoSource> {
  const slug = String(slugOrId);
  try {
    const detail = await getPhimDetail(slug);
    if (detail && detail.servers.length > 0) {
      const activeServerIndex = Math.min(Math.max(0, serverIndex), detail.servers.length - 1);
      const activeServer = detail.servers[activeServerIndex];
      const episodes = activeServer.episodes;

      let episodeIndex = 0;
      if (typeof episodeSlugOrIndex === "number") {
        episodeIndex = Math.max(0, Math.min(episodes.length - 1, episodeSlugOrIndex - 1));
      } else if (typeof episodeSlugOrIndex === "string" && episodeSlugOrIndex) {
        const foundIdx = episodes.findIndex(
          (ep) => ep.slug === episodeSlugOrIndex || ep.name.toLowerCase().includes(episodeSlugOrIndex.toLowerCase())
        );
        if (foundIdx >= 0) episodeIndex = foundIdx;
      }

      const activeEpisode = episodes[episodeIndex] ?? episodes[0];

      if (activeEpisode) {
        return {
          id: `${slug}-${activeServer.serverName}-${activeEpisode.slug}`,
          movieId: slug,
          slug,
          type: "hls",
          url: activeEpisode.linkM3u8,
          embedUrl: activeEpisode.linkEmbed,
          title: detail.media.title,
          episodeName: activeEpisode.name,
          serverName: activeServer.serverName,
          quality: detail.media.quality || "FHD",
          servers: detail.servers,
          currentServerIndex: activeServerIndex,
          currentEpisodeIndex: episodeIndex,
        };
      }
    }
  } catch (error) {
    console.error("Lỗi khi lấy stream source:", slugOrId, error);
  }

  // Fallback demo source
  return getVideoSource(slugOrId);
}
