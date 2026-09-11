import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { findMedia } from "@/lib/mock-data";
import { getVideoStreamSource } from "@/lib/video/sources";
import { VideoPlayer } from "@/components/player/video-player";
import { getPhimDetail } from "@/lib/phimapi";

export default async function WatchMovie({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const detail = await getPhimDetail(id);
  const media = detail?.media ?? findMedia(id);
  const source = await getVideoStreamSource(id);

  return (
    <main className="watch-page">
      <div className="watch-heading">
        <Link href={`/movie/${media.slug || media.id}`}>
          <ChevronLeft size={18} /> Quay lại trang chi tiết
        </Link>
        <span>Đang phát: {source.episodeName || "Bản đầy đủ"}</span>
      </div>

      <VideoPlayer source={source} servers={source.servers} media={media} />

      <div className="watch-copy">
        <p className="eyebrow">
          {media.quality ? `${media.quality} • ` : ""}{media.lang || "Vietsub"}
        </p>
        <h1>{media.title}</h1>
        {media.originalTitle && media.originalTitle !== media.title && (
          <p style={{ color: "var(--muted)", margin: "0 0 12px", fontSize: 14 }}>
            {media.originalTitle}
          </p>
        )}
        <p>{media.overview}</p>
      </div>
    </main>
  );
}
