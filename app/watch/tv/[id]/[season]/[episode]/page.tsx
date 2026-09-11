import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { episodes, findMedia } from "@/lib/mock-data";
import { getVideoStreamSource } from "@/lib/video/sources";
import { VideoPlayer } from "@/components/player/video-player";
import { getPhimDetail } from "@/lib/phimapi";

export default async function WatchTV({
  params,
}: {
  params: Promise<{ id: string; season: string; episode: string }>;
}) {
  const p = await params;
  const detail = await getPhimDetail(p.id);
  const media = detail?.media ?? findMedia(p.id);

  const epNum = Number(p.episode) || 1;
  const source = await getVideoStreamSource(p.id, epNum);

  const primaryServer = source.servers?.[0];
  const totalEpisodes = primaryServer?.episodes.length ?? episodes.length;

  const currentEpTitle = source.episodeName || `Tập ${epNum}`;

  return (
    <main className="watch-page">
      <div className="watch-heading">
        <Link href={`/tv/${media.slug || media.id}`}>
          <ChevronLeft size={18} /> Quay lại trang phim bộ
        </Link>
        <span>
          Phần {p.season} • {currentEpTitle}
        </span>
      </div>

      <VideoPlayer source={source} servers={source.servers} media={media} />

      <div className="watch-copy tv-watch">
        <div>
          <p className="eyebrow">
            {media.title} · Phần {p.season}
          </p>
          <h1>{currentEpTitle}</h1>
          <p>{media.overview}</p>
        </div>

        <div className="episode-nav">
          {epNum > 1 && (
            <Link href={`/watch/tv/${media.slug || media.id}/${p.season}/${epNum - 1}`}>
              <ChevronLeft /> Tập trước
            </Link>
          )}
          {epNum < totalEpisodes && (
            <Link href={`/watch/tv/${media.slug || media.id}/${p.season}/${epNum + 1}`}>
              Tập tiếp theo <ChevronRight />
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
